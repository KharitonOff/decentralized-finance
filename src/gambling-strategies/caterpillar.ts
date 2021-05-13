import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + '/../../.env' });
// console.log(__dirname + '../../.env')

const binanceApiKey = (process.env.BINANCE_API_KEY as string)// check your profile on binance.com --> API Management
const binanceApiSecret = process.env.BINANCE_API_SECRET // check your profile on binance.com --> API Management
const caterpillarLength = Number(process.argv[2]) // how long should the interval be
const symbol = 'ETHUSDT'

import { BinanceConnector } from "../binance/binance-connector"
// import * as colors from "colors"
import { plotGraph } from "./graph"
import * as colors from "colors"
import { Player } from "./player"
import { getHighestPriceOfRecentXIntervals, getLowestPriceOfRecentXIntervals } from "./utils"


export class BuyLowSellHighGambler {

    private binanceConnector: BinanceConnector

    private caterpillar: any[] = []
    private priceHistory: any[] = []
    private lowestPrice: number = 9999999
    private highestPrice: number = 0
    private xPosition = { positionAmt: 0, entryPrice: 0 }

    public constructor(apiKey: string, apiSecret: string) {
        this.binanceConnector = new BinanceConnector(apiKey, apiSecret)
    }


    public async investWisely(): Promise<void> {

        // this.intervalIndexCounter++
        try {
            let price = await this.binanceConnector.getCurrentSymbolPrice(symbol)
            price = Number(price.toFixed(0))
            const accountData = await this.binanceConnector.getFuturesAccountData()


            if (this.priceHistory.length === 50) {
                this.priceHistory.shift()
            }
            this.priceHistory.push(price)
            if (this.caterpillar.length === caterpillarLength) {
                this.caterpillar.shift()
            }
            this.caterpillar.push(price)
            this.lowestPrice = Math.min(this.lowestPrice, price)
            this.highestPrice = Math.max(this.highestPrice, price)

            // const xPosition = accountData.positions.filter((entry: any) => entry.symbol === symbol)[0]
            let xPosition = this.xPosition
            const positionAmt = Number(Number(xPosition.positionAmt).toFixed(3))

            let buyThreshold = this.lowestPrice + caterpillarLength
            let sellThreshold = Math.max(this.caterpillar[0], xPosition.entryPrice, this.highestPrice) - caterpillarLength
            let significatChange = Math.abs(xPosition.entryPrice - price) > caterpillarLength // don't want to sell if price change too low, it costs too much fees 
            // console.log(`Current Price of ${symbol}: ${colors.bgBlue(price.toString())}; highest: ${this.highestPrice}, lowest: ${this.lowestPrice}`)

            if (positionAmt == 0) {
                // console.log(`will buy at x > ${buyThreshold}`)
            } else {
                // console.log(`will sell at x < ${sellThreshold} and ( x < ${xPosition.entryPrice - caterpillarLength} ... ${xPosition.entryPrice + this.caterpillar.length} < x )`)
            }


            if (price > buyThreshold && positionAmt == 0) {
                // console.log(`current price is higher than buy threshold ${buyThreshold} => buy for ${price}`)
                // console.log(`available amount of USDT: ${accountData.availableBalance}`)

                const amountToBeInvested = Number((Number(accountData.availableBalance) / price).toFixed(3))
                // await this.binanceConnector.buyFuture(symbol, amountToBeInvested)
                xPosition.entryPrice = price
                xPosition.positionAmt = amountToBeInvested
                this.highestPrice = price
                process.stdout.write(`\n Buy at ${price}`)

            } else if (price < sellThreshold && significatChange && positionAmt > 0) {
                // console.log(`current price is lower than sell threshold ${sellThreshold} => sell for ${price}`)

                // console.log(`I'll sell ${positionAmt} ${symbol}`)
                // console.log(await this.binanceConnector.sellFuture(symbol, positionAmt))
                xPosition.entryPrice = 0
                xPosition.positionAmt = 0
                process.stdout.write(`\n Sell at ${price}`)
                // await this.binanceConnector.sellFuture(symbol, positionAmt)
                this.lowestPrice = price
            } else {
                if (positionAmt > 0) {
                    // console.log(`Wait until price starts falling... Unrealized PnL ${positionAmt * (sellThreshold - xPosition.entryPrice)}`)
                } else {
                    // console.log(`Wait until price starts rising...`)
                }
            }
            const entryPrice = Number(Number(xPosition.entryPrice).toFixed(0))
            process.stdout.write(plotGraph(price, entryPrice, this.priceHistory, buyThreshold, sellThreshold, caterpillarLength))
            process.stdout.write(`\n Position entry price - ${colors.bgBlue(entryPrice.toString())}  `)
            process.stdout.write(`\n Buy above ${colors.green(buyThreshold.toString())} = lowestPrice + caterpillarLength`)
            process.stdout.write(`\n Sell under ${colors.red(sellThreshold.toString())} = Math.max(caterpillarsTail, entryPrice, highestPrice) - caterpillarLength`)
            if (positionAmt > 0) {
                process.stdout.write(`\n Wait until price starts falling... Unrealized PnL ${positionAmt * (sellThreshold - xPosition.entryPrice)}`)
            } else {
                process.stdout.write(`\n Wait until price starts rising...`)
            }
        } catch (e) {
            console.error(e)
        }


    }

}

if (!binanceApiKey || !binanceApiSecret) {
    // console.error(`Bimamce Key and/or Secret are missing; Value is ${Object.keys(process.env)}`)
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