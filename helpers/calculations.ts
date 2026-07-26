import { evaluate } from "mathjs";

export type VariableInfo = {
  name: string;
  separator: string;
  isCommented: boolean;
};

export function parseVariableLine(line: string): VariableInfo | null {
  const trimmed = line.trim();
  const isCommented = trimmed.startsWith("//");
  const content = isCommented ? trimmed.slice(2).trim() : trimmed;
  if (!content.includes("=") && !content.includes(":")) return null;
  const separator = content.includes("=") ? "=" : ":";
  const [name] = content.split(separator).map((s) => s.trim().toLowerCase());
  if (!name || name === "monthlypaydate") return null;
  return { name, separator, isCommented };
}

export function getAutoCommentedLines(
  lines: string[],
  deductionDates: Record<string, number>,
  showNextMonth: boolean,
  currentDay: number,
): string[] {
  return lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) return line;

    if (showNextMonth) {
      if (trimmed.startsWith("//")) {
        const info = parseVariableLine(line);
        if (info && deductionDates[info.name]) {
          return line.replace(/^\/\//, "");
        }
      }
      return line;
    }

    if (trimmed.startsWith("//")) {
      const info = parseVariableLine(line);
      if (info && deductionDates[info.name]) {
        if (currentDay >= deductionDates[info.name]) {
          return line;
        }
        return line.replace(/^\/\//, "");
      }
      return line;
    }

    const info = parseVariableLine(line);
    if (
      info &&
      deductionDates[info.name] &&
      currentDay >= deductionDates[info.name]
    ) {
      return `//${line}`;
    }
    return line;
  });
}

export function tryGetValue(
  inputLines: string[],
  variables: Record<string, number>,
  originalValues: Record<string, number>,
  name: string,
  lineIndex: number,
): number | undefined {
  if (variables[name] !== undefined) return variables[name];
  if (originalValues[name] !== undefined) return originalValues[name];
  const line = inputLines[lineIndex];
  if (!line) return undefined;
  const content = line.trim().startsWith("//")
    ? line.trim().slice(2).trim()
    : line.trim();
  const sep = content.includes("=") ? "=" : ":";
  const expr = content.split(sep).slice(1).join(sep).trim();
  const num = Number(expr);
  if (!isNaN(num)) return num;
  try {
    const r = evaluate(expr);
    if (typeof r === "number" && !isNaN(r)) return r;
  } catch {}
  return undefined;
}

export function computeSummary(
  inputLines: string[],
  deductionDates: Record<string, number>,
  variables: Record<string, number>,
  originalValues: Record<string, number>,
  currentDay: number,
): { remainingTotal: number; dueNextTotal: number } {
  let remainingTotal = 0;
  let dueNextTotal = 0;

  for (let i = 0; i < inputLines.length; i++) {
    const line = inputLines[i];
    const info = parseVariableLine(line);
    if (!info || info.separator !== ":") continue;

    const value = variables[info.name];
    if (value !== undefined) {
      const hasDeduction = deductionDates[info.name] !== undefined;
      const isDeducted =
        hasDeduction && currentDay >= deductionDates[info.name];
      if (!isDeducted) {
        remainingTotal += value;
      }
    }

    const dueValue = tryGetValue(
      inputLines,
      variables,
      originalValues,
      info.name,
      i,
    );
    if (dueValue !== undefined) {
      dueNextTotal += dueValue;
    }
  }

  return { remainingTotal, dueNextTotal };
}
