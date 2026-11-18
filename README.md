# Spendulum 2.0

> Next-generation AI-powered personal finance and wealth management platform engineered for Indian banking and everyday financial transactions.

Built with a high-performance **FastAPI** backend and an animated, responsive **React + Tailwind** interface featuring components from [React Bits](https://github.com/DavidHDev/react-bits).

---

## ⚡ One-Command Quick Start (All Platforms)

```bash
python start.py
```

That's it. `start.py` will:
1. Check Python 3.9+
2. Create a virtual environment (`venv/`)
3. Install all Python packages from `requirements.txt`
4. Install npm packages & build the React frontend (if Node.js 18+ is present)
5. Initialise the SQLite database with demo data
6. Launch the server and open your browser at **http://localhost:8000**

> **Windows users:** You can also just double-click **`run.bat`**  
> **macOS / Linux users:** `chmod +x run.sh && ./run.sh`

### CLI flags

| Flag | Effect |
|------|--------|
| `python start.py --dev` | Hot-reload mode (backend reload + Vite dev server at `:5173`) |
| `python start.py --reset` | Reseed demo data & force frontend rebuild |

---

## Prerequisites

| Requirement | Minimum | Where to get it |
|------------|---------|-----------------|
| **Python** | 3.9+ | https://python.org/downloads |
| **Node.js + npm** | 18+ | https://nodejs.org |
| **Tesseract OCR** | any | *Optional* — only for receipt photo scanning |

> **No Tesseract?** The app falls back to text-based receipt parsing automatically. All other features work without it.

### Tesseract Installation (optional)

| Platform | Command |
|----------|---------|
| Windows | Download installer from https://github.com/UB-Mannheim/tesseract/wiki |
| macOS | `brew install tesseract` |
| Ubuntu/Debian | `sudo apt install tesseract-ocr` |
| Arch/Fedora | `sudo pacman -S tesseract` / `sudo dnf install tesseract` |

---

## Manual Setup (step by step)

```bash
# 1. Clone the repository
git clone https://github.com/vedansh17-star/Spendulum.git
cd Spendulum

# 2. Python virtual environment
python -m venv venv

# Activate — choose your platform:
source venv/bin/activate          # macOS / Linux
venv\Scripts\activate             # Windows CMD
venv/Scripts/Activate.ps1        # Windows PowerShell

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Build the React frontend
cd frontend
npm install
npm run build
cd ..

# 5. Launch
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

Open **http://localhost:8000** in your browser.

---

## Development Mode

Run the backend and frontend separately for hot-reload:

```bash
# Terminal 1 — FastAPI backend with auto-reload
python -m uvicorn backend.main:app --port 8000 --reload

# Terminal 2 — Vite dev server (React, hot module reload)
cd frontend && npm run dev
```

Frontend dev server: **http://localhost:5173**  
Backend / API docs: **http://localhost:8000/docs**

---

## Running Tests

```bash
# Activate venv first, then:
python -m pytest tests/ -v
```

✅ 68 automated tests covering classifier accuracy, SMS extraction, OCR parsing, budget forecasting, and all REST endpoints.

---

## What's New in 2.0

| Feature | Description |
|---------|-------------|
| **FastAPI Backend** | Clean REST API with Swagger docs (`/docs`), async endpoints, unified SPA delivery |
| **React Bits UI** | `SpotlightCard` cursor reflections, animated `CountUp`, floating `PillNav`, `FadeContent` transitions |
| **SMS & UPI Parser** | Regex + NLP parser for SBI, HDFC, ICICI, Axis, Kotak, Paytm, PhonePe, GPay, CRED |
| **Receipt OCR** | Image/text receipt scanner — store name, date, itemized rows, taxes, totals |
| **Subscriptions** | Autopay tracker with billing cycle toggles, renewal countdowns, monthly drain gauge |
| **Investments** | Asset allocation: MF/SIP, Equities, FD, Gold, EPF/PPF, Crypto |
| **Predictive Budgeting** | Daily spend velocity, month-end projected spend, category pacing, anomaly alerts |
| **Hybrid AI Categorization** | 3-tier: User Feedback rules → Merchant KB (44 entities) → Linear SVM |
| **Automated Tests** | 68 unit & integration tests |

---

## System Architecture

```
Spendulum/
├── start.py                        # ← One-command cross-platform launcher
├── run.bat                         # ← Windows double-click launcher
├── run.sh                          # ← macOS/Linux shell launcher
├── .env.example                    # ← Environment config template
├── requirements.txt
├── backend/
│   ├── main.py                     # FastAPI core — CORS, static SPA serving
│   ├── database.py                 # SQLite layer (8 tables + demo seeder)
│   ├── services/
│   │   ├── sms_parser.py           # Indian bank SMS & UPI extractor
│   │   ├── receipt_parser.py       # Receipt OCR & itemized text analyzer
│   │   ├── predictive_engine.py    # Daily velocity & run-rate forecasting
│   │   └── ml_bridge.py            # Hybrid SVM + Merchant KB connector
│   └── routers/
│       ├── transactions.py         # Transaction CRUD, search, CSV import/export
│       ├── analytics.py            # Balances, category breakdowns, time-series
│       ├── budgets.py              # Category monthly caps & utilization
│       ├── subscriptions.py        # Autopays, renewal dates, cycle management
│       ├── investments.py          # Portfolio holdings, asset allocation, net worth
│       ├── sms_upi.py              # SMS batch parser & bulk commit
│       ├── receipts.py             # Receipt scanner & itemizer
│       ├── predictive.py           # Real-time velocity & projections
│       ├── classifier.py           # AI studio & user feedback learning
│       ├── settings.py             # App settings & preferences
│       └── profile.py              # User profile management
├── frontend/                       # React 19 + Vite + Tailwind + React Bits SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── react-bits/         # SpotlightCard, CountUp, PillNav, FadeContent, ShinyText
│   │   │   ├── Navbar.jsx
│   │   │   └── AddTransactionModal.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Transactions.jsx
│   │   │   ├── SmsUpiParser.jsx
│   │   │   ├── ReceiptScanner.jsx
│   │   │   ├── Subscriptions.jsx
│   │   │   ├── Investments.jsx
│   │   │   ├── PredictiveBudget.jsx
│   │   │   └── AiStudio.jsx
│   │   └── services/api.js
│   └── dist/                       # Production build (auto-generated)
├── ml/                             # Pre-trained models & merchant dataset
├── tests/
│   ├── test_spendulum.py           # Core tests (60)
│   └── test_v2_features.py         # v2.0 feature tests (8)
└── data/                           # SQLite DB (auto-created, gitignored)
```

---

## API Reference

After starting the app, visit **http://localhost:8000/docs** for the full interactive Swagger UI.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/transactions` | GET/POST | List & add transactions |
| `/api/analytics/summary` | GET | Balance, income, expense summary |
| `/api/budgets` | GET/POST | Budget caps & utilization |
| `/api/subscriptions` | GET/POST | Active autopays |
| `/api/investments` | GET/POST | Portfolio holdings |
| `/api/sms/parse` | POST | Parse Indian bank SMS |
| `/api/receipts/scan` | POST | OCR receipt itemizer |
| `/api/predict/runrate` | GET | Month-end spend forecast |
| `/api/classify` | POST | AI transaction categorizer |
| `/api/health` | GET | Health check |

---

## Troubleshooting

### `ModuleNotFoundError: No module named 'fastapi'`
Make sure your virtual environment is **activated** before running:
```bash
source venv/bin/activate    # macOS/Linux
venv\Scripts\activate       # Windows
```

### Frontend not loading (blank page)
The React app needs to be built first:
```bash
cd frontend && npm install && npm run build
```

### Port 8000 already in use
```bash
python -m uvicorn backend.main:app --port 8080
# Then open http://localhost:8080
```

### `tesseract is not installed` warning
This only affects the Receipt OCR page. Install Tesseract (see above) or ignore the warning — all other features work normally.

---

## Team

| Name | Roll No. |
|------|----------|
| Shruti Kamnani | 25070521147 |
| Ashmit Upadhyay | 25070521129 |
| Vedansh Dwivedi | 25070521140 |

**Guide:** Prof. Nisha Gongal  
**Institution:** Symbiosis Institute of Technology, Nagpur

---

## License

MIT © 2024 Spendulum Team — SIT Nagpur
