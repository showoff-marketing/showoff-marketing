import { getCanonicalUrl, getSiteMode, isPageIndexable, pageDefinitions } from "./site";

export const publicSiteUrl = import.meta.env.PUBLIC_SITE_URL;

export function getHomeSeo(siteModeValue = import.meta.env.PUBLIC_SITE_MODE) {
  const mode = getSiteMode(siteModeValue);
  const home = pageDefinitions.find((page) => page.path === "/");

  if (!home) throw new Error("The marketing home page must be registered in pageDefinitions.");

  return {
    title: "Showoff | Marketing for small businesses",
    description:
      "Plan, create, capture, distribute, nurture, analyze, and optimize marketing in one AI-powered application.",
    canonical: getCanonicalUrl("/", publicSiteUrl),
    robots: isPageIndexable(home, mode) ? "index,follow" : "noindex,nofollow",
    mode,
  };
}
