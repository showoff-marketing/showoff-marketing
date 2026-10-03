import { describe, expect, it } from "vitest";
import { normalizeOrganizationName } from "./organizations";

describe("organization name validation", () => {
  it("trims a valid name", () => {
    expect(normalizeOrganizationName("  Studio North  ")).toBe("Studio North");
  });

  it("rejects missing, empty, and overlong names", () => {
    expect(() => normalizeOrganizationName(undefined)).toThrow(
      "Enter an organization name to continue.",
    );
    expect(() => normalizeOrganizationName("  ")).toThrow(
      "Organization names must contain 1 to 160 characters.",
    );
    expect(() => normalizeOrganizationName("x".repeat(161))).toThrow(
      "Organization names must contain 1 to 160 characters.",
    );
  });
});
