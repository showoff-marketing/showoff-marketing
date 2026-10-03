import { describe, expect, it } from "vitest";
import {
  getCanonicalUrl,
  getSiteMode,
  getVisiblePages,
  isPageIndexable,
  isPageVisible,
  isSectionVisible,
  pageDefinitions,
} from "./site";

describe("marketing mode and visibility", () => {
  it("defaults to an indexable prelaunch home page", () => {
    const mode = getSiteMode(undefined);
    const home = pageDefinitions.find((page) => page.path === "/")!;

    expect(mode).toBe("prelaunch");
    expect(isPageVisible(home, mode)).toBe(true);
    expect(isPageIndexable(home, mode)).toBe(true);
  });

  it("keeps unpublished live-only pages out of the prelaunch sitemap", () => {
    expect(getVisiblePages("prelaunch").map((page) => page.path)).toEqual(["/"]);
    expect(
      isPageVisible(
        pageDefinitions.find((page) => page.path === "/pricing")!,
        "prelaunch",
      ),
    ).toBe(false);
  });

  it("makes all pages unavailable and sections hidden in maintenance mode", () => {
    expect(getVisiblePages("maintenance")).toEqual([]);
    expect(
      isSectionVisible(
        { id: "navigation", visibleIn: ["prelaunch", "live", "maintenance"] },
        "maintenance",
      ),
    ).toBe(false);
  });

  it("rejects unsupported mode values instead of silently choosing a mode", () => {
    expect(() => getSiteMode("coming-soon")).toThrow("Invalid PUBLIC_SITE_MODE value: coming-soon");
  });

  it("resolves canonical paths against the configured site origin", () => {
    expect(getCanonicalUrl("/pricing", "https://stage.showoff.marketing/")).toBe(
      "https://stage.showoff.marketing/pricing",
    );
  });
});
