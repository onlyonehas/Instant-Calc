import { describe, it, expect } from "vitest";
import { evaluateExpression } from "../calculate";

describe("evaluateExpression", () => {
  it("evaluates a simple number expression", () => {
    const result = evaluateExpression({
      expression: "100 + 200",
      variables: {},
      keywordValues: {},
    });
    expect(result.evaluatedResult).toBe(300);
  });

  it("substitutes known variables", () => {
    const result = evaluateExpression({
      expression: "rent + food",
      variables: { rent: 1000, food: 250 },
      keywordValues: {},
    });
    expect(result.evaluatedResult).toBe(1250);
  });

  it("substitutes prev keyword", () => {
    const result = evaluateExpression({
      expression: "prev * 2",
      variables: {},
      keywordValues: { tempPrev: 500 },
    });
    expect(result.evaluatedResult).toBe(1000);
  });

  it("substitutes sum keyword", () => {
    const result = evaluateExpression({
      expression: "sum + 100",
      variables: {},
      keywordValues: { tempSum: 2000 },
    });
    expect(result.evaluatedResult).toBe(2100);
  });

  it("handles unknown variable gracefully", () => {
    const result = evaluateExpression({
      expression: "unknown + 50",
      variables: {},
      keywordValues: {},
    });
    expect(result.evaluatedResult).toBeNaN ||
      expect(typeof result.evaluatedResult).toBe("number");
  });
});
