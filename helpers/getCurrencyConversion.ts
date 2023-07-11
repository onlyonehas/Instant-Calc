import { acceptedCurrencySymbols } from '../currencies'

export const isCurrency = async (name: string) => {
    let withToCode: string | boolean  = false
    const hasIn = name.includes("in")
    if (hasIn) {
        const expression = name.split("in").map((item) => item.trim().replace(/\,/g, '').toLowerCase());

        let currencyValue = ""
        let userCurrencyCode: string[] = []

        expression.map(singleValue => {
            let userSymbolMatcher = singleValue.match(/[£$€]/)
            let userCurrencyCodeMatcher = singleValue.match(/[a-z]\D*/)
            let usercurrencyValueMatcher = singleValue.match(/[0-9]\d*/)

            if (userSymbolMatcher) {
                userCurrencyCode.push(acceptedCurrencySymbols[userSymbolMatcher[0]])
            }

            if (userCurrencyCodeMatcher) {
                const checkEuro = userCurrencyCodeMatcher[0] == "euro" ? "eur" : userCurrencyCodeMatcher[0]
                userCurrencyCode.push(checkEuro)
            }

            if (usercurrencyValueMatcher) {
                currencyValue = usercurrencyValueMatcher[0]
            }
        })

        if(userCurrencyCode){
            const from =  userCurrencyCode[0];
            const to = userCurrencyCode[1];
            const liveCurrencyValue = await fetchLiveCurrencyRate(currencyValue, from, to)
            withToCode = `${liveCurrencyValue.toFixed(2)} ${to}`
        }  
    }
    return withToCode;
}

// TODO: cache result
// validate currency code against currencies.json
const fetchLiveCurrencyRate = async (currencyValue: string, from: string, to: string) => {
    const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/${from}/${to}.json`

    let rate = 0;
    let finalCurrecyValue = 0;

    try {
        const response: any = await fetch(url);
        const data = await response.json()
        rate = data[to]
        finalCurrecyValue = rate? rate*Number(currencyValue) : 0
    } catch (error) {
        console.error('Currency exhange error: ', error);
    }
    return finalCurrecyValue;
}

