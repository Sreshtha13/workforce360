import { describe, expect, it } from "vitest";
import { renderTemplate } from "../lib/template-render";

describe("renderTemplate", () => {
  it("replaces known placeholders", () => {
    const out = renderTemplate("Hello {{name}}, ticket {{ticketNumber}}", {
      name: "Sam",
      ticketNumber: "T-1",
    });
    expect(out).toBe("Hello Sam, ticket T-1");
  });

  it("leaves unknown placeholders intact", () => {
    expect(renderTemplate("Hi {{x}}", {})).toBe("Hi {{x}}");
  });

  it("allows whitespace inside braces", () => {
    expect(renderTemplate("{{ name }}", { name: "A" })).toBe("A");
  });
});
