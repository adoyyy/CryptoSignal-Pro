# CryptoSignal Pro

CryptoSignal Pro is a web-based crypto analytics MVP. It provides real-time market data, automated technical analysis (TA), dynamic risk calculation, and a personal trading journal.

## Core Features
- **Real-time Binance WebSockets**: Streams live candlestick data for selected crypto pairs.
- **Automated TA Engine**: Computes technical indicators (e.g., RSI, MACD, Bollinger Bands) to generate automated BUY/SELL/NEUTRAL signals.
- **Dynamic Risk Calculator**: Automatically calculates Stop Loss (SL), Take Profit (TP), and position sizing based on your account balance and risk percentage.
- **JWT Authentication**: Secure user registration and login utilizing NextAuth.js and bcrypt.
- **Trading Journal & Watchlist**: Save trading signals directly to your journal and keep a watchlist of your favorite pairs.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Shadcn UI
- **State Management**: Zustand
- **Charting**: TradingView Lightweight Charts (v5)
- **Backend/API**: Next.js Route Handlers
- **Data Source**: Binance REST API & WebSocket (Public endpoints)
- **Database**: PostgreSQL
- **ORM**: Prisma

## Local Setup Guide

Follow these instructions to run the project locally.

### 1. Clone the repository
```bash
git clone https://github.com/adoyyy/CryptoSignal-Pro.git
cd CryptoSignal-Pro
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory (you can copy from `.env.example`) and configure your PostgreSQL connection string and NextAuth variables.
```bash
cp .env.example .env
```

### 4. Database Setup
Push the Prisma schema to your PostgreSQL database and generate the client.
```bash
npx prisma db push
npx prisma generate
```

### 5. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
