import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/save'],
    },
    sitemap: 'https://www.getlinklib.com/sitemap.xml',
  }
}
