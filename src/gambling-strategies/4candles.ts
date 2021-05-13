import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + '/../../.env' });

const binanceApiKey = (process.env.BINANCE_API_KEY as string)// check your profile on binance.com --> API Management
const binanceApiSecret = process.env.BINANCE_API_SECRET // check your profile on binance.com --> API Management
const test = process.argv[2] // if true - do not invest real money
const plot = process.argv[3] // if true - plot a graph on console
const symbol = 'ETHUSDT'

import { BinanceConnector } from "../binance/binance-connector"
import { plotGraph } from "./graph"
import * as colors from "colors"
const fs = require('fs-extra')
const file = 'trades.json'


export class BuyLowSellHighGambler {

    private binanceConnector: BinanceConnector

    private priceHistory: any[] = []
    private trades: any[] = []
    private xPosition = { positionAmt: 0, entryPrice: 0 }

    public constructor(apiKey: string, apiSecret: string) {
        this.binanceConnector = new BinanceConnector(apiKey, apiSecret)
    }

    public async investWisely(): Promise<void> {
        try {
            let price = await this.binanceConnector.getCurrentSymbolPrice(symbol)
            price = Number(price.toFixed(0))
            const accountData = await this.binanceConnector.getFuturesAccountData()


            if (this.priceHistory.length === 50) {
                this.priceHistory.shift()
            }
            this.priceHistory.push(price)

            const xPosition = test ? this.xPosition : accountData.positions.filter((entry: any) => entry.symbol === symbol)[0]
            const positionAmt = Number(Number(xPosition.positionAmt).toFixed(3))
            const pnl = positionAmt * (price - xPosition.entryPrice)

            let buySignal = this.priceHistory.length > 4 //start calculating signals after having 4 historical prices
            let sellSignal = this.priceHistory.length > 4 //start calculating signals after having 4 historical prices
            for (let i = this.priceHistory.length - 4; i < this.priceHistory.length; i++) {
                if (buySignal && this.priceHistory[i - 1] > this.priceHistory[i]) {
                    buySignal = false
                }
                if (sellSignal && this.priceHistory[i - 1] < this.priceHistory[i]) {
                    sellSignal = false
                }
            }


            if (buySignal && positionAmt == 0) {
                const amountToBeInvested = Number((Number(accountData.availableBalance) / price).toFixed(3))
                process.stdout.write(`\n Buy at ${price}`)

                if (test) {
                    xPosition.entryPrice = price
                    xPosition.positionAmt = amountToBeInvested
                } else {
                    await this.binanceConnector.buyFuture(symbol, amountToBeInvested)
                }
            }

            if (sellSignal && positionAmt > 0) {
                this.trades.push({ entryPrice: xPosition.entryPrice, exitPrice: price, amount: positionAmt, pnl })
                fs.outputJson(file, this.trades)

                process.stdout.write(`\n Sell at ${price}`)

                if (test) {
                    xPosition.entryPrice = 0
                    xPosition.positionAmt = 0
                } else {
                    await this.binanceConnector.sellFuture(symbol, positionAmt)
                }
            }

            const entryPrice = Number(Number(xPosition.entryPrice).toFixed(0))
            if (plot) {
                process.stdout.write(plotGraph(price, entryPrice, this.priceHistory))
            } else {
                process.stdout.write(`\n Position entry price - ${colors.bgBlue(entryPrice.toString())}  Current Price - ${colors.white(price.toString())}`)
            }

            if (positionAmt > 0) {
                process.stdout.write(`\n Sell signal = ${sellSignal}; Wait until price starts falling... Unrealized PnL ${pnl}`)
            } else {
                process.stdout.write(`\n Buy signal = ${buySignal}; Wait until price starts rising...`)
            }

            if (this.trades.length > 0) {
                let overallPnL = 0
                this.trades.map(trade => overallPnL += trade.pnl)
                process.stdout.write(`\n After ${this.trades.length} trades PnL is equals ${overallPnL}`)
                process.stdout.write(`\n Buy and Hold Strategy would produce PnL equals ${(price - this.trades[0].entryPrice) * this.trades[0].amount}`)
            }

        } catch (e) {
            console.error(e)
        }
    }
}

if (!binanceApiKey || !binanceApiSecret) {
    console.error(`Binamce Key and/or Secret are missing; Value is ${Object.keys(process.env)}`)
    process.exit(1)
}
const instance = new BuyLowSellHighGambler(binanceApiKey, binanceApiSecret)

setInterval(async () => {
    try {
        instance.investWisely()
    } catch (e) {
        // console.error(e)
    }

}, 11 * 1000)