import * as colors from "colors"
import * as readline from 'readline'

readline.cursorTo(process.stdout, 0, 0)
readline.clearScreenDown(process.stdout)

let topY = 100
const priceRange = 50

function plotFirstThird(previous: number, curent: number, indicator: number, interval?: number) {
    let symbol
    if (previous == indicator && curent == indicator) {
        symbol = `_`
    } else if (previous > indicator && curent <= indicator) {
        symbol = curent == indicator ? `\\` : `|`
    } else if (previous < indicator && curent >= indicator) {
        if (curent == indicator) {
            symbol = (indicator - previous) < 2 ? `_` : ` `
        } else {
            symbol = curent == (indicator + 1) ? `/` : `|`
        }
    } else {
        symbol = ` `
    }
    return symbol
}

function plotLastThird(next: number, curent: number, indicator: number, interval?: number) {
    let symbol
    if (next == indicator && curent == indicator) {
        symbol = `_`
    } else if (next > indicator && curent == indicator) {
        symbol = `/`
    } else if (next < indicator && curent == indicator) {
        symbol = `_`
    } else {
        symbol = ` `
    }
    return symbol
}

function plotInactivityWindow(symbol: string, interval: number, entryPrice: number, indicator: number) {
    if (symbol == ` `) {
        symbol = Math.abs(indicator - entryPrice) == interval ? colors.red(`_`) : symbol
    }
    return symbol
}

function createGraph(price: number, entryPrice: number = 0, history: number[], buyThreshold?: number, sellThreshold?: number, interval?: number) {
    const rows: string[] = []
    let botomY = topY - priceRange
    topY = botomY < price && price < topY ? topY : price + (priceRange / 2)
    botomY = topY - priceRange
    for (let index = 0; index < priceRange; index++) {
        let indicator = topY - index
        let row = ("      " + indicator).slice(-7)
        row = Number(indicator) == price ? colors.white(row) : row
        row = Number(indicator) == buyThreshold ? colors.green(row) : row
        row = Number(indicator) == sellThreshold ? colors.red(row) : row
        row = Number(indicator) == entryPrice ? colors.blue(row) : row
        row += ` |`
        rows.push(row)
    }
    rows.push(`---------`)
    rows.push(`     hh:|`)
    rows.push(`     mm:|`)
    rows.push(`     ss |`)
    for (let time = 0; time < history.length; time++) {
        const previous = history[time - 1]
        const curent = history[time]
        const next = history[time + 1]

        for (let index = 0; index < priceRange; index++) {
            let indicator = topY - index
            let symbol: string
            //first column
            symbol = plotFirstThird(previous, curent, indicator, interval)
            rows[index] += interval ? plotInactivityWindow(symbol, interval, entryPrice, indicator) : symbol

            //second column
            symbol = curent == indicator ? colors.white(`_`) : ` `
            rows[index] += interval ? plotInactivityWindow(symbol, interval, entryPrice, indicator) : symbol

            //third column
            symbol = plotLastThird(next, curent, indicator, interval)
            rows[index] += interval ? plotInactivityWindow(symbol, interval, entryPrice, indicator) : symbol
        }
        var date = new Date(Date.now() - ((history.length - time) * 11 * 1000))
        rows[rows.length - 4] += (`---`)
        rows[rows.length - 3] += (`${('0' + date.getHours()).slice(-2)}:`)
        rows[rows.length - 2] += (`${('0' + date.getMinutes()).slice(-2)}:`)
        rows[rows.length - 1] += (`${('0' + date.getSeconds()).slice(-2)} `)
    }
    // rows.push(` ${colors.bgBlue(entryPrice.toString())} - position entry price = Math.max(caterpillarsTail, entryPrice, highestPrice) - caterpillarLength`)
    // if (buyThreshold) {
    //     rows.push(` ${colors.green(buyThreshold.toString())} - buy thresold = lowestPrice + caterpillarLength`)
    // }
    // if (sellThreshold) {
    //     rows.push(` ${colors.red(sellThreshold.toString())} - sell thresold = Math.max(caterpillarsTail, entryPrice, highestPrice) - caterpillarLength`)
    // }
    return rows
}
export function plotGraph(price: number, entryPrice: number = 0, history: number[], buyThreshold?: number, sellThreshold?: number, interval?: number) {
    process.stdout.cursorTo(0, 0);
    const rows = createGraph(price, entryPrice, history, buyThreshold, sellThreshold, interval)
    const graph = `\r${rows.join('\n')}`
    // process.stdout.write(graph)
    return graph
}

// const history = [2932, 2933, 2935, 2933, 2936, 2937, 2936]
// plotGraph(2937, 2933, history, 5)
// process.stdout.write(rows.join('\n'))

// let tmrID = setInterval(() => {
//     // history.shift()
//     history.push(Number((2930 + Math.random() * 10).toFixed(0)))
//     rows = []
//     process.stdout.cursorTo(0, 0);
//     plotGraph(2937, 2933, history, 5)
//     const graph = `\r${rows.join('\n')}`
//     process.stdout.write(graph)

// }, 1000)

// setTimeout(() => {
//     clearInterval(tmrID)
//     console.log(`\rstop`)
// }, 13500)
