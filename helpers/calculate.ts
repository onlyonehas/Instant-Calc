import { evaluate } from "mathjs";
import { VariableMap } from "./sharedTypes";

const reservedKeywords = ["prev", "sum", "to"];

type EvaluateExpressionType = {
  expression: string;
  variables: VariableMap;
  keywordValues: VariableMap;
};

export const evaluateExpression = ({
  expression,
  variables,
  keywordValues,
}: EvaluateExpressionType) => {
  const exchanged = "";
  const output = {
    evaluatedResult: 0,
    hasCustomOutput: exchanged,
  };

  const individualValue = expression
    .split(/[+-/*()]/gm)
    .map((item) => item.trim());
  individualValue.forEach(async (value) => {
    if (typeof value == "string") {
      if (reservedKeywords.includes(value)) {
        if (value == "prev") {
          expression = expression.replace(
            value,
            String(keywordValues.tempPrev),
          );
        }
        if (value == "sum") {
          expression = expression.replace(value, String(keywordValues.tempSum));
        }
      }
      if (variables[value] >= 0) {
        expression = expression.replace(value, String(variables[value]));
      }
      // const checkCurrency = await isCurrency(value)

      // if (!!checkCurrency) {
      //   exchanged = await isCurrency(value) as string
      //   output.hasCustomOutput = exchanged
      // }
    }
  });

  let checkValidEvalution = 0;
  if (expression.length > 0) {
    try {
      checkValidEvalution = evaluate(expression);
    } catch (e) {
      console.error(e);
    }
  }
  output.evaluatedResult = checkValidEvalution | Number(expression);

  return output;
};
