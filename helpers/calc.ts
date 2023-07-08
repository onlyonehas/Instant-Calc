import { VariableMap } from '../helpers/shareTypes'
import { evaluate } from 'mathjs';
import { isCurrency } from './currencies';

const reservedKeywords = ["prev", "sum", "to"]

export const evaluateExpression = (expression: string, variables: VariableMap, keywordValue: VariableMap) => {
    const individualValue = expression.split(/[+-/*()]/gm).map((item) => item.trim());

    individualValue.forEach(value => {
      if (typeof value == "string") {
        if (reservedKeywords.includes(value)) {
          if (value == "prev") {
            expression = expression.replace(value, String(keywordValue.tempPrev))
          }
          if (value == "sum") {
            expression = expression.replace(value, String(keywordValue.tempSum))
          }
        }
        if (variables[value] >= 0) {
          expression = expression.replace(value, String(variables[value]))
        }
      }

      if(isCurrency(value)){
        console.log(value)
      }

    })

    let result
    if (expression.length > 0) {
      try {
        result = evaluate(expression)
      } catch (e) {
        console.error(e)
      }
    }
    const formattedExp = Number(expression)

    return result | formattedExp
};