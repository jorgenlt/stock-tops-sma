# stock-tops

A Node.js CLI tool to analyze **stock tops relative to the 200-day Simple Moving Average (SMA)**.

Find out how extended a stock was above its 200 SMA at those tops.

---

## Features

- Fetches historical price data using `yahoo-finance2`
- Calculates accurate **200-day SMA**
- Peak detection using rolling window
- Option to show **absolute highest % above SMA** days (not just peaks)
- Current price & percentage above 200 SMA
- Export results to **JSON** or **CSV**

---

## Installation

```bash
# Clone or go to your project folder
npm install

# Make the script executable
chmod +x index.js

# Optional: Install globally for easy use
sudo npm link
```

---

## Usage

```bash
node index.js <TICKER> [options]
```

### Examples

```bash
# Basic usage
node index.js SOXX

# With custom settings
node index.js AAPL --window 20 --period 3000 --threshold 15

# Show current price status
node index.js TSLA --current

# Show top 10 highest % above 200 SMA (regardless of peaks)
node index.js SMH --top 10

# Full featured
node index.js NVDA --window 25 --period 4000 --current --top 8 --json --csv
```

---

## Options

| Option                | Alias     | Default     | Description |
|-----------------------|-----------|-------------|-----------|
| `--period <days>`     | `-p`      | `2500`      | How many days of historical data to fetch |
| `--threshold <%>`     | `-t`      | `10`        | Minimum % above 200 SMA to show |
| `--window <days>`     | `-w`      | `18`        | Peak detection sensitivity (higher = fewer, stronger peaks) |
| `--top <number>`      |           | `0`         | Show top N highest % above SMA days (ignores peak detection) |
| `--current`           |           | `false`     | Show current price and % above 200 SMA |
| `--json`              |           | `false`     | Export results to `{TICKER}_tops.json` |
| `--csv`               |           | `false`     | Export results to `{TICKER}_tops.csv` |

---

## Recommended Settings

- **General analysis**: `--window 18 --period 2500`
- **Major tops only**: `--window 25 --threshold 20`
- **Finding blow-off tops**: `--top 15 --period 4000`
- **Semiconductor ETFs** (SOXX, SMH, etc.): `--window 20 --period 5000`

---

## Output Example

The tool displays:

- Clean formatted table with Date, Price, SMA 200, and % Above
- Color coding (Green → Yellow → Red) based on how extended the stock was
- Summary statistics (Average & Highest %)
- Current status (if requested)

---

## Global Installation (Recommended)

After installing dependencies, run:

```bash
sudo npm link
```

Then you can use it anywhere like this:

```bash
stock-tops SOXX --window 20 --current
stock-tops AAPL --top 10
```
