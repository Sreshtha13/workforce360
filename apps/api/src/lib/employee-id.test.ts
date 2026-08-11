import { describe, it, expect } from "vitest";
import {
  formatEmployeeId,
  parseEmployeeIdSequence,
  getNextEmployeeId,
  findHighestEmployeeId,
} from "./employee-id";

describe("employee-id helpers", () => {
  it("formats and parses EMP codes", () => {
    expect(formatEmployeeId(1)).toBe("EMP001");
    expect(formatEmployeeId(42)).toBe("EMP042");
    expect(parseEmployeeIdSequence("EMP042")).toBe(42);
    expect(parseEmployeeIdSequence("invalid")).toBeNull();
  });

  it("increments from the latest code", () => {
    expect(getNextEmployeeId("EMP005")).toBe("EMP006");
    expect(getNextEmployeeId(null)).toBe("EMP001");
  });

  it("finds the highest sequence in a list", () => {
    expect(findHighestEmployeeId(["EMP002", "EMP010", "EMP003", null])).toBe("EMP010");
  });
});
