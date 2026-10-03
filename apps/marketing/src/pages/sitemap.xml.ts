import {
  escapeXml,
  getCanonicalUrl,
  getSiteMode,
  getVisiblePages,
  isPageIndexable,
} from "../lib/site";

export function GET() {
  const mode = getSiteMode(import.meta.env.PUBLIC_SITE_MODE);
  const baseUrl = import.meta.env.PUBLIC_SITE_URL;
  const urls = getVisiblePages(mode)
    .filter((page) => isPageIndexable(page, mode))
    .map((page) => {
      const location = escapeXml(getCanonicalUrl(page.path, baseUrl));
      const lastModified = page.lastModified
        ? `<lastmod>${escapeXml(page.lastModified)}</lastmod>`
        : "";
      return `<url><loc>${location}</loc>${lastModified}</url>`;
    })
    .join("");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
}
