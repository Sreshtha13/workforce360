import { describe, it, expect } from "vitest";
import {
  departmentPrefix,
  findHighestDesignationSequence,
  formatDesignationCode,
  normalizeDesignationCode,
  parseDesignationCodeSequence,
} from "./designation-code";

describe("designation-code", () => {
  describe("departmentPrefix", () => {
    it("uses department code when present", () => {
      expect(departmentPrefix({ code: "eng", name: "Engineering" })).toBe("ENG");
    });

    it("strips non-alphanumeric from code", () => {
      expect(departmentPrefix({ code: "hr-ops", name: "HR" })).toBe("HROPS");
    });

    it("falls back to first 3 letters of name", () => {
      expect(departmentPrefix({ code: null, name: "Finance" })).toBe("FIN");
    });

    it("pads short names", () => {
      expect(departmentPrefix({ code: "", name: "IT" })).toBe("ITX");
    });

    it("defaults when name has no alphanumerics", () => {
      expect(departmentPrefix({ code: null, name: "---" })).toBe("DES");
    });
  });

  describe("format / parse", () => {
    it("formats zero-padded sequences", () => {
      expect(formatDesignationCode("ENG", 1)).toBe("ENG-001");
      expect(formatDesignationCode("HR", 12)).toBe("HR-012");
    });

    it("parses matching PREFIX-NNN", () => {
      expect(parseDesignationCodeSequence("ENG-001", "ENG")).toBe(1);
      expect(parseDesignationCodeSequence("eng-042", "ENG")).toBe(42);
    });

    it("returns null for non-matching codes", () => {
      expect(parseDesignationCodeSequence("HR-001", "ENG")).toBeNull();
      expect(parseDesignationCodeSequence("ENG001", "ENG")).toBeNull();
      expect(parseDesignationCodeSequence("CUSTOM", "ENG")).toBeNull();
    });
  });

  describe("findHighestDesignationSequence", () => {
    it("returns max matching sequence and ignores others", () => {
      expect(
        findHighestDesignationSequence(["ENG-001", "ENG-010", "HR-099", null, "ENG-003"], "ENG"),
      ).toBe(10);
    });

    it("returns 0 when none match", () => {
      expect(findHighestDesignationSequence(["CUSTOM", null], "ENG")).toBe(0);
    });
  });

  describe("normalizeDesignationCode", () => {
    it("trims and uppercases", () => {
      expect(normalizeDesignationCode("  eng-001  ")).toBe("ENG-001");
    });
  });
});
