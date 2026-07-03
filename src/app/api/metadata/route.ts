import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { isIP } from 'net';
import { lookup } from 'dns/promises';

// WhatsApp/Facebook/Twitter erhalten von so gut wie jeder Website zuverlässig volle OG-Daten
// (Titel, Beschreibung, Thumbnail) - selbst wenn ein generischer "Chrome unter Windows"-User-Agent
// von einer Server-/Cloud-IP aus (z. B. Vercel) auf eine Bot-Sperre, ein Captcha oder eine
// Cookie-Consent-Zwischenseite trifft. Websites (inkl. YouTube/Google) erlauben diesen bekannten
// "Link-Preview-Bots" bewusst uneingeschränkten Zugriff, weil sie sonst in Chats/Posts keine
// Vorschau mehr anzeigen könnten. Deshalb geben wir uns hier als solcher Bot aus.
const PREVIEW_BOT_USER_AGENT = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';

// Blockiert Zugriffe auf lokale/interne/private Netzwerke, um Server-Side Request Forgery (SSRF) zu verhindern
function isPrivateOrReservedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const parts = ip.split('.').map(Number);
    const [a, b] = parts;
    if (a === 127) return true; // loopback
    if (a === 10) return true; // private
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 0) return true; // "this" network
    return false;
  }
  if (version === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === '::1') return true; // loopback
    if (normalized.startsWith('fe80:')) return true; // link-local
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // unique local
    if (normalized.startsWith('::ffff:')) return isPrivateOrReservedIp(normalized.replace('::ffff:', ''));
    return false;
  }
  return true; // unknown format, refuse to be safe
}

async function assertUrlIsSafe(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http/https URLs are allowed');
  }

  const hostname = parsed.hostname;
  if (hostname === 'localhost') {
    throw new Error('Access to this host is not allowed');
  }

  // Falls der Host bereits eine IP-Adresse ist, direkt prüfen
  if (isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) throw new Error('Access to this host is not allowed');
    return parsed;
  }

  // Ansonsten den Hostnamen auflösen und alle Adressen prüfen (verhindert DNS-Rebinding auf interne IPs)
  const records = await lookup(hostname, { all: true });
  for (const record of records) {
    if (isPrivateOrReservedIp(record.address)) {
      throw new Error('Access to this host is not allowed');
    }
  }

  return parsed;
}

type YoutubeOembed = { title?: string; thumbnail_url?: string; author_name?: string };

// YouTube liefert über die offizielle oEmbed-API zuverlässig Titel + Thumbnail als JSON,
// völlig unabhängig von Consent-Wall/Bot-Erkennung beim normalen HTML-Scraping.
async function fetchYoutubeOembed(pageUrl: string): Promise<YoutubeOembed | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(pageUrl)}&format=json`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function isYoutubeUrl(parsed: URL): boolean {
  const host = parsed.hostname.replace(/^www\./, '');
  return host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    let currentUrl = await assertUrlIsSafe(url);
    const oembed = isYoutubeUrl(currentUrl) ? await fetchYoutubeOembed(currentUrl.toString()) : null;

    let response: Response | null = null;

    // Redirects werden manuell verfolgt, damit jeder Hop erneut gegen private/interne Hosts geprüft wird (SSRF-Schutz)
    for (let redirectCount = 0; redirectCount < 5; redirectCount++) {
      response = await fetch(currentUrl, {
        headers: {
          'User-Agent': PREVIEW_BOT_USER_AGENT,
          'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
          // Zusätzliches Sicherheitsnetz gegen die Google/YouTube Cookie-Consent-Zwischenseite,
          // falls der Bot-User-Agent allein nicht ausreicht.
          'Cookie': 'CONSENT=YES+1',
        },
        redirect: 'manual',
        signal: AbortSignal.timeout(8000),
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) throw new Error('Redirect without location header');
        currentUrl = await assertUrlIsSafe(new URL(location, currentUrl).toString());
        continue;
      }
      break;
    }

    if (!response || !response.ok) {
      // Ohne HTML trotzdem die oEmbed-Daten verwenden, statt komplett zu scheitern
      if (oembed) {
        return NextResponse.json({ title: oembed.title || '', description: oembed.author_name ? `Video von ${oembed.author_name}` : '', image: oembed.thumbnail_url || null });
      }
      throw new Error('Failed to fetch URL');
    }
    const html = await response.text();
    
    const $ = cheerio.load(html);
    
    const title = oembed?.title || $('meta[property="og:title"]').attr('content') || $('meta[name="twitter:title"]').attr('content') || $('title').text() || '';
    const rawDescription =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      '';
    // Mehrfache Leerzeichen/Zeilenumbrüche vereinheitlichen, damit die Beschreibung lesbar bleibt
    let description = rawDescription.replace(/\s+/g, ' ').trim();
    if (!description && oembed?.author_name) description = `Video von ${oembed.author_name}`;

    let image = oembed?.thumbnail_url || $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
    if (!image) {
      // "data:," ist ein leerer Platzhalter-Favicon-Trick vieler Seiten - kein echtes Bild
      const favicon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href');
      if (favicon && favicon !== 'data:,' && !favicon.startsWith('data:,')) {
        try {
          image = new URL(favicon, url).href;
        } catch {
          // invalid url
        }
      }
    }

    return NextResponse.json({ title, description, image: image || null });
  } catch (error) {
    console.error('Metadata fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
  }
}
