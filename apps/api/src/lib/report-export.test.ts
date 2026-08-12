import { describe, expect, it } from "vitest";
import { rowsToCsv, escapeCsvField } from "../lib/report-export";

describe("rowsToCsv", () => {
  it("builds a simple CSV with headers", () => {
    const csv = rowsToCsv(
      ["name", "status"],
      [
        { name: "Alice", status: "PRESENT" },
        { name: "Bob", status: "ABSENT" },
      ],
    );
    expect(csv).toBe("name,status\nAlice,PRESENT\nBob,ABSENT");
  });

  it("escapes commas and quotes", () => {
    expect(escapeCsvField('He said "hi"')).toBe('"He said ""hi"""');
    const csv = rowsToCsv(["note"], [{ note: "a,b" }]);
    expect(csv).toBe('note\n"a,b"');
  });

  it("supports array rows", () => {
    const csv = rowsToCsv(["a", "b"], [["1", "2"]]);
    expect(csv).toBe("a,b\n1,2");
  });
});
