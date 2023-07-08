import { currenciesCode } from '../currencies'
import { VariableMap } from './shareTypes'

type SymbolType = {
    [name: string]: string;
}
const acceptedCurrencySymbols: SymbolType = { "gbp": "£", "usd": "$", "eur": "€" }

export const isCurrency = (name: string) => {
    const hasIn = name.includes("in")

    if (hasIn) {
        const expression = name.split("in").map((item) => item.trim().replace(/\,/g, '').toLowerCase());

        console.log({expression})

        expression.map(singleValue => {
             console.log({singleValue})

            const userSymbol = singleValue.charAt(0)

            const hasSymbol = Object.keys(acceptedCurrencySymbols).filter((key: any) => {
                const checkMatch = acceptedCurrencySymbols[key] == userSymbol
                return checkMatch ? key : false
            })

            if (!!hasSymbol) {
                console.log({hasSymbol})
            }
        })
    }

    // check for different combination format ie 1£ in euro etc 
    // maybe via regex 
    // call api and return output
    // https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/gbp/eur.json


    return false
}