import { describe, it, expect } from "vitest";
import {
  parseVariableLine,
  getAutoCommentedLines,
  computeSummary,
  tryGetValue,
} from "../calculations";

describe("parseVariableLine", () => {
  it("parses a simple = variable line", () => {
    expect(parseVariableLine("rent=1000")).toEqual({
      name: "rent",
      separator: "=",
      isCommented: false,
    });
  });

  it("parses a : expense line", () => {
    expect(parseVariableLine("food: 250")).toEqual({
      name: "food",
      separator: ":",
      isCommented: false,
    });
  });

  it("parses a commented line with =", () => {
    expect(parseVariableLine("//rent: 1000")).toEqual({
      name: "rent",
      separator: ":",
      isCommented: true,
    });
  });

  it("parses a commented line with :", () => {
    expect(parseVariableLine("//gas: 150")).toEqual({
      name: "gas",
      separator: ":",
      isCommented: true,
    });
  });

  it("ignores heading lines", () => {
    expect(parseVariableLine("# My Heading")).toBeNull();
  });

  it("ignores plain expression lines", () => {
    expect(parseVariableLine("100/4")).toBeNull();
  });

  it("ignores monthlypaydate", () => {
    expect(parseVariableLine("monthlyPayDate=15")).toBeNull();
  });

  it("ignores lines with no separator", () => {
    expect(parseVariableLine("just some text")).toBeNull();
  });

  it("handles whitespace around name and value", () => {
    expect(parseVariableLine("  wifi : 27.49  ")).toEqual({
      name: "wifi",
      separator: ":",
      isCommented: false,
    });
  });
});

describe("getAutoCommentedLines", () => {
  it("leaves heading lines unchanged", () => {
    const result = getAutoCommentedLines(["# Heading"], {}, false, 10);
    expect(result).toEqual(["# Heading"]);
  });

  it("comments a line when deduction date is reached", () => {
    const result = getAutoCommentedLines(
      ["rent: 1000"],
      { rent: 15 },
      false,
      20,
    );
    expect(result).toEqual(["//rent: 1000"]);
  });

  it("does not comment when deduction date is not reached", () => {
    const result = getAutoCommentedLines(
      ["rent: 1000"],
      { rent: 15 },
      false,
      10,
    );
    expect(result).toEqual(["rent: 1000"]);
  });

  it("uncomments a commented line when date has passed", () => {
    const result = getAutoCommentedLines(
      ["//rent: 1000"],
      { rent: 15 },
      false,
      10,
    );
    expect(result).toEqual(["rent: 1000"]);
  });

  it("keeps commented line commented when deduction date is reached", () => {
    const result = getAutoCommentedLines(
      ["//rent: 1000"],
      { rent: 15 },
      false,
      20,
    );
    expect(result).toEqual(["//rent: 1000"]);
  });

  it("uncomments all lines when showNextMonth is true", () => {
    const result = getAutoCommentedLines(
      ["//rent: 1000", "//food: 250"],
      { rent: 15, food: 20 },
      true,
      25,
    );
    expect(result).toEqual(["rent: 1000", "food: 250"]);
  });

  it("keeps already active lines when showNextMonth is true", () => {
    const result = getAutoCommentedLines(
      ["rent: 1000", "food: 250"],
      { rent: 15, food: 20 },
      true,
      25,
    );
    expect(result).toEqual(["rent: 1000", "food: 250"]);
  });

  it("does not uncomment lines without deduction dates when showNextMonth", () => {
    const result = getAutoCommentedLines(["//rent: 1000"], {}, true, 25);
    expect(result).toEqual(["//rent: 1000"]);
  });

  it("leaves commented lines without deduction dates as-is", () => {
    const result = getAutoCommentedLines(["//comment: 300"], {}, false, 26);
    expect(result).toEqual(["//comment: 300"]);
  });

  it("initialInput with no deduction dates stays stable", () => {
    const lines = [
      "# Example Heading",
      "//comment: 300",
      "monthlyPayDate=15",
      "gas: 300",
      "food: 250",
      "100/4",
      "Variable = prev*2",
      "Total=sum-variable",
    ];
    const result = getAutoCommentedLines(lines, {}, false, 26);
    expect(result).toEqual(lines);
  });

  it("handles = separator in commented lines", () => {
    const result = getAutoCommentedLines(
      ["//rent=1000"],
      { rent: 15 },
      false,
      20,
    );
    expect(result).toEqual(["//rent=1000"]);
  });

  it("uncomments = separator line when date not yet reached", () => {
    const result = getAutoCommentedLines(
      ["//rent=1000"],
      { rent: 15 },
      false,
      10,
    );
    expect(result).toEqual(["rent=1000"]);
  });
});

describe("tryGetValue", () => {
  it("returns value from variables", () => {
    expect(tryGetValue([], { rent: 500 }, {}, "rent", 0)).toBe(500);
  });

  it("returns value from originalValues", () => {
    expect(tryGetValue([], {}, { rent: 300 }, "rent", 0)).toBe(300);
  });

  it("returns numeric value from input line expression", () => {
    const lines = ["rent: 1000"];
    expect(tryGetValue(lines, {}, {}, "rent", 0)).toBe(1000);
  });

  it("parses expression from commented line", () => {
    const lines = ["//rent: 1000"];
    expect(tryGetValue(lines, {}, {}, "rent", 0)).toBe(1000);
  });

  it("returns undefined when variable not found", () => {
    expect(tryGetValue(["other: 50"], {}, {}, "rent", 0)).toBe(50);
  });
});

describe("computeSummary", () => {
  it("computes remaining from undeducted expenses", () => {
    const lines = ["rent: 1000", "food: 250", "wifi: 50"];
    const result = computeSummary(
      lines,
      { rent: 15 },
      { rent: 1000, food: 250, wifi: 50 },
      {},
      10,
    );
    expect(result.remainingTotal).toBe(1300); // rent (not deducted yet) + food + wifi
    expect(result.dueNextTotal).toBe(1300); // rent + food + wifi
  });

  it("subtracts deducted expenses from remaining", () => {
    const lines = ["rent: 1000", "food: 250"];
    const result = computeSummary(
      lines,
      { rent: 15, food: 15 },
      { rent: 1000, food: 250 },
      {},
      20,
    );
    expect(result.remainingTotal).toBe(0); // both deducted
    expect(result.dueNextTotal).toBe(1250);
  });

  it("skips = calculation lines", () => {
    const lines = ["rent: 1000", "total=rent*2"];
    const result = computeSummary(
      lines,
      {},
      { rent: 1000, total: 2000 },
      {},
      10,
    );
    expect(result.remainingTotal).toBe(1000); // only rent has : separator
  });

  it("returns zeros for empty input", () => {
    const result = computeSummary([], {}, {}, {}, 10);
    expect(result).toEqual({ remainingTotal: 0, dueNextTotal: 0 });
  });
});
