#!/usr/bin/env node

import YahooFinance from 'yahoo-finance2';
import { Command } from 'commander';
import chalk from 'chalk';
import { table, getBorderCharacters } from 'table';
import fs from 'fs';

const yahooFinance = new YahooFinance({
  suppressNotices: ['ripHistorical']
});

const program = new Command();

program
  .name('stock-tops')
  .description('Stock tops analysis vs 200 SMA')
  .version('2.1.5')
  .argument('<ticker>', 'Stock ticker')
  .option('-p, --period <days>', 'Historical days', '2500')
  .option('-t, --threshold <percent>', 'Minimum % above 200 SMA', '10')
  .option('-w, --window <days>', 'Peak detection window', '18')
  .option('--top <number>', 'Show top N highest % days', '0')
  .option('--current', 'Show current price')
  .option('--json', 'Export to JSON file')
  .option('--csv', 'Export to CSV file')
  .action(async (ticker, options) => {
    try {
      console.log(chalk.blue(`Fetching data for ${ticker.toUpperCase()}...`));

      const result = await yahooFinance.historical(ticker, {
        period1: Math.floor(Date.now() / 1000) - (parseInt(options.period) * 86400),
        period2: Math.floor(Date.now() / 1000),
        interval: '1d'
      });

      if (result.length < 300) {
        console.error(chalk.red('Not enough historical data.'));
        process.exit(1);
      }

      const data = result.sort((a, b) => new Date(a.date) - new Date(b.date));

      const closes = data.map(d => d.close);
      const sma200 = calculateSMA(closes, 200);

      const enriched = [];
      for (let i = 200; i < data.length; i++) {
        const price = data[i].close;
        const sma = sma200[i - 200];
        const percentAbove = ((price - sma) / sma) * 100;

        enriched.push({
          date: data[i].date.toISOString().split('T')[0],
          price: parseFloat(price.toFixed(2)),
          sma200: parseFloat(sma.toFixed(2)),
          percentAbove: parseFloat(percentAbove.toFixed(2))
        });
      }

      const latest = enriched[enriched.length - 1];

      if (options.current) {
        console.log(chalk.cyan(`\nCurrent ${ticker.toUpperCase()}:`));
        console.log(`Price   : $${latest.price}`);
        console.log(`SMA200  : $${latest.sma200}`);
        console.log(`% Above : ${chalk.bold(latest.percentAbove)}%`);
      }

      let finalTops = [];

      if (parseInt(options.top) > 0) {
        finalTops = [...enriched]
          .sort((a, b) => b.percentAbove - a.percentAbove)
          .slice(0, parseInt(options.top));
        console.log(chalk.magenta(`\nTop ${options.top} highest % above 200 SMA:`));
      } else {
        const peaks = findSignificantPeaks(enriched, parseInt(options.window));
        finalTops = peaks.filter(t => t.percentAbove >= parseFloat(options.threshold));
        console.log(chalk.green(`\nFound ${finalTops.length} significant peaks (window = ${options.window} days)`));
      }

      if (finalTops.length === 0) {
        console.log(chalk.yellow('No results found.'));
        return;
      }

      // === TABLE OUTPUT ===
      const tableData = [['Date', 'Price', 'SMA 200', '% Above'].map(h => chalk.bold(h))];

      finalTops.forEach(top => {
        const color = top.percentAbove >= 35 ? chalk.red.bold :
                      top.percentAbove >= 22 ? chalk.yellow.bold : chalk.green;
        tableData.push([
          top.date,
          '$' + top.price,
          '$' + top.sma200,
          color(top.percentAbove + '%')
        ]);
      });

      console.log(table(tableData, {
        border: getBorderCharacters('norc'),
        columns: {
          0: { alignment: 'left' },
          1: { alignment: 'right' },
          2: { alignment: 'right' },
          3: { alignment: 'right' }
        }
      }));

      // Summary
      const percents = finalTops.map(t => t.percentAbove);
      console.log(chalk.cyan('\nSummary:'));
      console.log(`Average : ${(percents.reduce((a,b)=>a+b,0)/percents.length).toFixed(2)}%`);
      console.log(`Highest : ${Math.max(...percents).toFixed(2)}%`);

      // === EXPORTS ===
      const filenameBase = ticker.toUpperCase();

      if (options.json) {
        fs.writeFileSync(`${filenameBase}_tops.json`, JSON.stringify(finalTops, null, 2));
        console.log(chalk.green(`\n✅ Exported: ${filenameBase}_tops.json`));
      }

      if (options.csv) {
        const csvHeader = 'Date,Price,SMA200,PercentAbove\n';
        const csvRows = finalTops.map(t => 
          `${t.date},${t.price},${t.sma200},${t.percentAbove}`
        ).join('\n');
        
        fs.writeFileSync(`${filenameBase}_tops.csv`, csvHeader + csvRows);
        console.log(chalk.green(`✅ Exported: ${filenameBase}_tops.csv`));
      }

    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
    }
  });

function calculateSMA(prices, period) {
  const sma = [];
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
}

function findSignificantPeaks(data, windowSize) {
  const peaks = [];
  for (let i = windowSize; i < data.length - windowSize; i++) {
    const current = data[i];
    let isPeak = true;
    for (let j = i - windowSize; j <= i + windowSize; j++) {
      if (j === i) continue;
      if (data[j].price > current.price + 0.01) {
        isPeak = false;
        break;
      }
    }
    if (isPeak) peaks.push(current);
  }
  return peaks;
}

program.parse();
