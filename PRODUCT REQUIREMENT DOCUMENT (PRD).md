# PRODUCT REQUIREMENT DOCUMENT (PRD)

**Project Name:** CryptoSignal Pro (Web-Based Crypto Analytics & Recommendation Platform)
**Document Owner:** Senior Product Manager & Software Architect
**Target Audience:** AI Developer (Antigravity), Frontend/Backend Engineers

---

## 1. EXECUTIVE SUMMARY & MVP SCOPE

**Product Description**
CryptoSignal Pro adalah aplikasi web analitik yang dirancang untuk membantu *retail crypto traders* dalam mengambil keputusan. Aplikasi ini secara otomatis memproses data OHLCV (Open, High, Low, Close, Volume), menjalankan algoritma Analisis Teknikal (TA), dan memberikan rekomendasi Buy/Sell objektif lengkap dengan level *Take Profit* (TP) dan *Stop Loss* (SL).

**MVP (Minimum Viable Product) Scope:**

* **Data Source:** Mendukung top 50 pasang aset kripto terhadap USDT (contoh: BTC/USDT, ETH/USDT) menggunakan integrasi *public API* (Binance API).
* **Timeframes:** Terbatas pada *intraday* dan *swing timeframes* (15m, 1h, 4h, 1D).
* **Core Feature:** Interactive chart dengan overlay indikator, *Automated Signal Engine* berbasis aturan (Rule-based TA), dan *Position Size Calculator*.
* **User Account:** Registrasi dasar untuk menyimpan *Watchlist* dan *Trading Journal/History*.
* **Out of Scope untuk MVP:** Eksekusi order langsung ke *Exchange* (Trading Bot / API Trading), integrasi Web3 Wallet (Metamask), dan fitur *on-chain analysis*.

---

## 2. USER PERSONA & WORKFLOW

### User Persona

* **The Analytical Trader (Target Utama):** Membutuhkan efisiensi waktu. Ingin sistem yang melakukan *screening* dan menghitung *risk-reward ratio* secara otomatis sebelum ia mengambil keputusan final.
* **The Beginner Trader:** Kesulitan menentukan di mana harus meletakkan Stop Loss agar tidak terkena *liquidation* atau *whipsaw*. Membutuhkan panduan visual yang jelas.

### User Workflow

1. **Authentication:** Pengguna *login* ke dalam dashboard.
2. **Asset Selection:** Pengguna mencari *ticker* (misal: SOLUSDT) melalui *search bar* dan memilih *timeframe* (misal: 1h).
3. **Chart Initialization:** Sistem me-render *candlestick chart* secara *real-time*.
4. **Signal Generation:** Pengguna menekan tombol "Analyze". Sistem menarik data historis (klines), menjalankan kalkulasi TA di *backend*, dan menampilkan *marker* **BUY/SELL** langsung di atas *chart*.
5. **Risk Calculation:** Panel di sisi kanan menampilkan *Card Rekomendasi*:
* *Entry Price* (Harga saat ini atau level *breakout*).
* *Stop Loss* (Dihitung otomatis berdasarkan indikator *Average True Range* / ATR).
* *Take Profit 1 & 2* (Berdasarkan *Risk:Reward Ratio* 1:1.5 dan 1:2).


6. **Position Sizing:** Pengguna memasukkan total modal (misal: $1000) dan risiko per *trade* (misal: 1%). Sistem menghitung berapa USDT/Lot yang aman untuk dibeli.
7. **Save Action:** Pengguna menyimpan setup tersebut ke dalam *Watchlist* atau *History*.

---

## 3. FUNCTIONAL REQUIREMENTS

### 3.1. Charting Library Integration

* **Library:** TradingView Lightweight Charts (karena ringan, *open-source*, dan performa *rendering* Canvas sangat cepat untuk web).
* **Requirements:**
* Mampu menampilkan *Candlestick Series* dan *Volume Series*.
* Mendukung penambahan *Line Series* secara dinamis (untuk menampilkan garis TP hijau dan garis SL merah membentang horizontal di *chart*).
* *Live update* harga (*tick-by-tick*) menggunakan WebSocket tanpa harus me-refresh seluruh data historis.



### 3.2. Automated Technical Analysis (Signal Engine)

* **Data Aggregation:** Sistem harus mengambil 200 *candle* terakhir (batasan untuk *Moving Average*) melalui REST API.
* **Trigger Rules (Contoh Logika MVP):**
* **BUY Signal:** Jika `EMA(50)` *crosses above* `EMA(200)` **DAN** `RSI(14)` berada di antara 40 - 65 **DAN** `MACD Line` > `Signal Line`.
* **SELL Signal:** Jika `EMA(50)` *crosses below* `EMA(200)` **DAN** `RSI(14)` berada di antara 35 - 60 **DAN** `MACD Line` < `Signal Line`.


* **Indicator Library:** Menggunakan *library* TA berbasis matematika seperti `technicalindicators` (Node.js) untuk menghindari kalkulasi manual dari nol.

### 3.3. Risk Management & Position Calculator

* **Dynamic SL Logic:** Stop loss tidak menggunakan persentase statis, melainkan volatilitas pasar.
* `SL Price (Long)` = `Entry Price - (ATR(14) * 1.5)`
* `SL Price (Short)` = `Entry Price + (ATR(14) * 1.5)`


* **Dynamic TP Logic:**
* `TP Price` = `Entry Price + (Absolute(Entry - SL) * Target_RR)`


* **Position Sizing Formula:**
* `Risk Amount (USD)` = `Account Balance * (Risk % / 100)`
* `Position Size (Coins)` = `Risk Amount / Absolute(Entry - SL)`



---

## 4. NON-FUNCTIONAL REQUIREMENTS

### 4.1. Performance & Latency

* **Real-time Data Fetching:** Harga di *chart* tidak boleh memiliki *delay* lebih dari 200ms dari *exchange* (harus via WebSocket connection, bukan HTTP Polling).
* **Calculation Speed:** Eksekusi Signal Engine di *backend* harus selesai di bawah 300ms setelah *request* diterima agar UI terasa instan.
* **Bundle Size:** *Frontend payload* harus dioptimalkan (Lazy loading untuk komponen *chart*).

### 4.2. Security & Rate Limiting

* **API Management:** Token dan API Key *exchange* (Binance API) di-*host* dengan aman di *backend* via Environment Variables (`.env`). *Frontend* TIDAK BOLEH memanggil Binance API secara langsung untuk menghindari eksploitasi CORS dan limit IP.
* **Authentication:** Menggunakan JWT (JSON Web Tokens) dengan *short-lived access tokens* (15 menit) dan *HttpOnly refresh tokens*.
* **Rate Limiting:** Endpoint `/api/analyze` dibatasi maksimal 10 *request* per menit per user untuk mencegah *abuse* CPU pada *backend*.

---

## 5. TECH STACK & ARCHITECTURE PROPOSAL

Pendekatan arsitektur ini memisahkan *Client-side* (visualisasi) dan *Server-side* (komputasi data) agar aplikasi *scalable* dan aman.

| Layer | Teknologi Pilihan | Alasan Pemilihan |
| --- | --- | --- |
| **Frontend Framework** | Next.js 14 (React, TypeScript) | Mendukung API Routes untuk *BFF (Backend for Frontend)*, optimalisasi *routing*, dan *developer experience* tinggi. |
| **Styling & UI Components** | Tailwind CSS + Shadcn UI | Mempercepat *development* UI yang terlihat modern dan konsisten. |
| **State Management** | Zustand | Sangat ringan, terhindar dari *boilerplate* berlebih seperti Redux, cocok untuk *real-time state* (harga/ticker). |
| **Charting Library** | TradingView Lightweight Charts | Native HTML5 Canvas, interaktif, dokumentasi sangat lengkap untuk TS. |
| **Backend / API** | Node.js + Express (TypeScript) | Eksekusi kalkulasi TA (`technicalindicators`) sangat efisien. |
| **Data Provider** | Binance REST API & WebSocket | Gratis, *rate limit* cukup longgar untuk OHLCV, data paling likuid. |
| **Database & ORM** | PostgreSQL + Prisma ORM | Relasional DB sempurna untuk *user management* dan riwayat *trading*. Prisma memberikan *type-safety*. |
| **Caching (Opsional)** | Redis | Menyimpan hasil kalkulasi TA sementara (TTL 1 menit) agar *request* dengan *pair* dan *timeframe* yang sama tidak perlu dihitung ulang. |

---

## 6. DATABASE SCHEMA

Menggunakan **PostgreSQL**. Desain di bawah ini berfokus pada modularitas.

### Tabel: `users`

| Column | Type | Constraints / Notes |
| --- | --- | --- |
| `id` | UUID | Primary Key, Default `uuid_generate_v4()` |
| `email` | VARCHAR | Unique, Not Null |
| `password_hash` | VARCHAR | Not Null |
| `account_balance` | DECIMAL | Default 0.00 (Untuk kalkulator risiko) |
| `risk_preference` | DECIMAL | Default 1.00 (Risk % per trade) |
| `created_at` | TIMESTAMP | Default `NOW()` |

### Tabel: `watchlists`

| Column | Type | Constraints / Notes |
| --- | --- | --- |
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key -> `users.id`, On Delete Cascade |
| `symbol` | VARCHAR | Cth: 'BTCUSDT' |
| `added_at` | TIMESTAMP | Default `NOW()` |
| **Index** |  | `UNIQUE(user_id, symbol)` |

### Tabel: `analysis_history` (Trading Journal)

| Column | Type | Constraints / Notes |
| --- | --- | --- |
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key -> `users.id` |
| `symbol` | VARCHAR | Cth: 'ETHUSDT' |
| `timeframe` | VARCHAR | Cth: '1h', '4h' |
| `signal_type` | ENUM | 'BUY', 'SELL', 'NEUTRAL' |
| `entry_price` | DECIMAL | Harga saat sinyal di-generate |
| `sl_price` | DECIMAL | Kalkulasi Stop Loss |
| `tp_price` | DECIMAL | Kalkulasi Take Profit |
| `position_size` | DECIMAL | Kalkulasi ukuran Lot/Coin |
| `created_at` | TIMESTAMP | Default `NOW()` |