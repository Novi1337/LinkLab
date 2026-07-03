/**
 * LinkLib Save-Button – einbettbares Script für externe Webseiten.
 *
 * Einbindung:
 *   <a href="https://getlinklib.com/save" class="linklib-save-button"></a>
 *   <script async src="https://getlinklib.com/save-button.js"></script>
 *
 * Optionale data-Attribute am Button:
 *   data-url    – zu speichernde URL (Standard: canonical/og:url bzw. aktuelle Seite)
 *   data-title  – Titel (Standard: document.title)
 *   data-label  – Text neben dem Icon, z. B. "Speichern" (Standard: nur Icon)
 *   data-size   – Button-Höhe in Pixeln (Standard: 32)
 *
 * Für dynamisch eingefügte Buttons steht window.LinkLibSave.scan() bereit.
 * Klicks funktionieren dank Event-Delegation auch ohne erneuten scan().
 */
(function () {
  "use strict";

  if (window.__linklibSaveButtonLoaded) return;
  window.__linklibSaveButtonLoaded = true;

  var SELECTOR = ".linklib-save-button";

  // Origin aus der eigenen Script-URL ableiten, damit das Script auch in
  // Staging-/Dev-Umgebungen auf die richtige Instanz zeigt.
  var ORIGIN = "https://getlinklib.com";
  try {
    if (document.currentScript && document.currentScript.src) {
      ORIGIN = new URL(document.currentScript.src).origin;
    }
  } catch { /* Fallback auf Produktions-Origin */ }

  function resolveUrl(btn) {
    var explicit = btn.getAttribute("data-url");
    if (explicit) return explicit;
    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && canonical.href) return canonical.href;
    var og = document.querySelector('meta[property="og:url"]');
    if (og && og.content) return og.content;
    return window.location.href;
  }

  function openPopup(btn) {
    var url = resolveUrl(btn);
    var title = btn.getAttribute("data-title") || document.title || "";
    var saveUrl = ORIGIN + "/save?url=" + encodeURIComponent(url) + "&title=" + encodeURIComponent(title);

    var w = 480;
    var h = 640;
    var left = Math.max(0, Math.round(((window.screen.width || w) - w) / 2));
    var top = Math.max(0, Math.round(((window.screen.height || h) - h) / 2));
    window.open(
      saveUrl,
      "linklib-save",
      "noopener,noreferrer,scrollbars=yes,resizable=yes,width=" + w + ",height=" + h + ",left=" + left + ",top=" + top
    );
  }

  function injectHoverStyle() {
    if (document.getElementById("linklib-save-style")) return;
    var style = document.createElement("style");
    style.id = "linklib-save-style";
    style.textContent =
      SELECTOR + "[data-linklib-ready]:hover{transform:translateY(-1px) scale(1.05);box-shadow:0 4px 10px rgba(15,23,42,.18)!important}";
    (document.head || document.documentElement).appendChild(style);
  }

  function styleButton(btn) {
    if (btn.hasAttribute("data-linklib-ready")) return;
    btn.setAttribute("data-linklib-ready", "1");

    var size = parseInt(btn.getAttribute("data-size") || "32", 10);
    if (!(size > 0)) size = 32;
    var label = btn.getAttribute("data-label") || "";

    // Inhalt kontrolliert aufbauen (keine innerHTML-Verwendung)
    btn.textContent = "";

    var icon = document.createElement("img");
    icon.src = ORIGIN + "/Favicon.svg";
    icon.alt = "";
    icon.style.cssText = "width:" + (size - 12) + "px;height:" + (size - 12) + "px;display:block;border:0;margin:0;padding:0;";

    btn.style.cssText = [
      "display:inline-flex",
      "align-items:center",
      "justify-content:center",
      "gap:6px",
      "height:" + size + "px",
      label ? "padding:0 12px 0 10px" : "padding:0;width:auto",
      "border-radius:" + Math.round(size / 2) + "px",
      label ? "background:#ffffff" : "background:transparent",
      label ? "border:1px solid #e2e8f0" : "border:0",
      label ? "box-shadow:0 1px 3px rgba(15,23,42,.12)" : "box-shadow:none",
      "cursor:pointer",
      "text-decoration:none",
      "font:600 " + Math.max(11, Math.round(size * 0.4)) + "px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif",
      "color:#23466b",
      "vertical-align:middle",
      "box-sizing:border-box",
      "transition:transform .15s ease,box-shadow .15s ease",
    ].join(";");

    btn.appendChild(icon);
    if (label) {
      var text = document.createElement("span");
      text.textContent = label;
      btn.appendChild(text);
    }
    if (!btn.getAttribute("title")) btn.setAttribute("title", "Auf LinkLib speichern");
  }

  function scan(root) {
    injectHoverStyle();
    var nodes = (root || document).querySelectorAll(SELECTOR);
    for (var i = 0; i < nodes.length; i++) styleButton(nodes[i]);
  }

  // Event-Delegation: funktioniert auch für Buttons, die erst nach dem
  // Laden des Scripts ins DOM eingefügt werden.
  document.addEventListener(
    "click",
    function (e) {
      var target = e.target;
      var btn = target && target.closest ? target.closest(SELECTOR) : null;
      if (!btn) return;
      e.preventDefault();
      openPopup(btn);
    },
    true
  );

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { scan(); });
  } else {
    scan();
  }

  window.LinkLibSave = { scan: scan };
})();
