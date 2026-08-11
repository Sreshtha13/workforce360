import { describe, it, expect } from "vitest";
import { bumpPolicyVersion } from "./policy-version";

describe("bumpPolicyVersion", () => {
  it("increments minor version", () => {
    expect(bumpPolicyVersion("1.0")).toBe("1.1");
    expect(bumpPolicyVersion("2.3")).toBe("2.4");
  });

  it("handles major-only versions", () => {
    expect(bumpPolicyVersion("3")).toBe("3.1");
  });

  it("appends suffix for non-numeric versions", () => {
    expect(bumpPolicyVersion("v1")).toBe("v1.1");
  });
});
