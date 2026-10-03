export const siteModes = ["prelaunch", "live", "maintenance"] as const;

export type SiteMode = (typeof siteModes)[number];

export interface PageDefinition {
  path: string;
  label: string;
  visibleIn: readonly SiteMode[];
  published: boolean;
  indexable: boolean;
  lastModified?: string;
}

export interface SectionDefinition {
  id: string;
  visibleIn: readonly SiteMode[];
}

export interface SiteCallToAction {
  label: string;
  href: string;
}

export const pageDefinitions: readonly PageDefinition[] = [
  {
    path: "/",
    label: "Home",
    visibleIn: ["prelaunch", "live"],
    published: true,
    indexable: true,
  },
  {
    path: "/pricing",
    label: "Pricing",
    visibleIn: ["live"],
    published: false,
    indexable: true,
  },
];

export const homepageSectionDefinitions: readonly SectionDefinition[] = [
  { id: "hero", visibleIn: ["prelaunch", "live"] },
  { id: "workflow", visibleIn: ["prelaunch", "live"] },
  { id: "waitlist", visibleIn: ["prelaunch"] },
  { id: "final_cta", visibleIn: ["live"] },
];

export function getSiteMode(value: string | undefined): SiteMode {
  if (value === undefined || value === "") return "prelaunch";
  if (siteModes.includes(value as SiteMode)) return value as SiteMode;
  throw new Error(`Invalid PUBLIC_SITE_MODE value: ${value}`);
}

export function isPageVisible(page: PageDefinition, mode: SiteMode): boolean {
  return page.published && page.visibleIn.includes(mode) && mode !== "maintenance";
}

export function getVisiblePages(mode: SiteMode): PageDefinition[] {
  return pageDefinitions.filter((page) => isPageVisible(page, mode));
}

export function isPageIndexable(page: PageDefinition, mode: SiteMode): boolean {
  return isPageVisible(page, mode) && page.indexable;
}

export function isSectionVisible(section: SectionDefinition, mode: SiteMode): boolean {
  return section.visibleIn.includes(mode) && mode !== "maintenance";
}

export function getVisibleHomepageSections(mode: SiteMode): string[] {
  return homepageSectionDefinitions
    .filter((section) => isSectionVisible(section, mode))
    .map((section) => section.id);
}

export function getPrimaryCallToAction(
  mode: SiteMode,
  appUrl = "https://app.showoff.marketing",
): SiteCallToAction | null {
  if (mode === "prelaunch") return { label: "Join the waitlist", href: "#waitlist" };
  if (mode === "live") return { label: "Start Showing Off", href: appUrl };
  return null;
}

export function getCanonicalUrl(path: string, siteUrl: string | undefined): string {
  const origin = siteUrl?.trim() || "https://showoff.marketing";
  return new URL(path, origin.endsWith("/") ? origin : `${origin}/`).toString();
}

export function getRobotsTxt(mode: SiteMode, siteUrl?: string): string {
  if (mode === "maintenance") return "User-agent: *\nDisallow: /\n";
  return `User-agent: *\nAllow: /\nSitemap: ${getCanonicalUrl("/sitemap.xml", siteUrl)}\n`;
}

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
