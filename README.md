# Options Strategies Dashboard

A Persian-language web dashboard for monitoring Tehran Stock Exchange options and analyzing **Bull Call Spread** strategies. The application retrieves live market and order-book data from TSETMC, applies configurable filters, calculates spread metrics, and displays an interactive profit/loss chart.

## Features

- Live option-chain data from TSETMC
- Market and Bull Spread views
- Filtering by underlying asset, option symbol, moneyness, trading value, and days to expiration
- Sortable tables with persistent sorting during automatic refresh
- Bull Call Spread calculations, including maximum profit, maximum loss, break-even price, reward-to-risk ratio, and monthly return estimate
- Interactive expiration payoff chart with current price, strike, break-even, and hover details
- Buy, sell, and underlying order-book reports
- Automatic refresh while preserving the selected row
- Persian/Arabic symbol normalization for reliable symbol matching
- Three data-source modes: live, saved trading values, or saved trading values and order books
- End-of-session order-book snapshots captured between 12:25 and 12:35 Tehran time
- Responsive dark user interface

## Tech Stack

- Python
- Flask and Flask-CORS
- Requests
- pandas
- jdatetime
- Vanilla JavaScript, HTML, and CSS
- Native SVG charts

## Project Structure

```text
Options/
├── apptest.py                 # Enhanced/current Flask application
├── app.py                     # Original Flask application
├── templates/
│   ├── indextest.html         # Enhanced dashboard template
│   └── index.html             # Original dashboard template
├── static/
│   ├── scripttest.js          # Enhanced dashboard behavior
│   ├── script.js              # Original dashboard behavior
│   ├── style.css              # Shared dashboard styles
│   ├── logo.png
│   └── iransans.ttf
├── data/
│   ├── trade_value_snapshot.json
│   └── order_book_snapshot.json
└── Test/                      # Earlier test implementation
```

## Installation

Python 3.10 or newer is recommended.

1. Clone the repository:

```bash
git clone https://github.com/reza-mohammadvand/Options-Strategies.git
cd Options-Strategies
```

2. Create and activate a virtual environment:

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Linux or macOS:

```bash
source .venv/bin/activate
```

3. Install the dependencies:

```bash
pip install flask flask-cors requests pandas jdatetime
```

## Running the Application

Run the enhanced version:

```bash
python apptest.py
```

Open `http://localhost:5001` in your browser.

The original version can be started with `python app.py` and is available at `http://localhost:5000`.

## Saved Data Modes

| Mode | Trading values | Order books |
|---|---|---|
| Latest data | Live | Live |
| Previous trading values | Saved | Live |
| Previous trading values and orders | Saved | Saved |

Trading-value snapshots are stored in `data/trade_value_snapshot.json`. Order-book snapshots are updated during the 12:25–12:35 Tehran-time window. Updates received after that window do not overwrite the final captured snapshot.

## Data Sources

The application uses public TSETMC endpoints for Market Watch data and best bid/ask order books. Their availability and response formats may change without notice. An internet connection is required when using live-data modes.

## Notes

- The interface language is Persian and uses a right-to-left layout.
- Trading-value filters are displayed in million rials.
- This project is intended for market analysis and educational use. It is not financial advice and does not execute trades.

## License

No license has been specified yet. Add a license file before distributing or reusing the project publicly.
