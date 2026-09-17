# Execution Report: Phase 2 and 3

## Summary of Actions Taken
- Setup the Prisma client initialization by writing `src/lib/db.ts` to manage standard database connectivity globally without hitting max connections in Next.js development.
- Implemented `src/app/api/market-data/route.ts` as a Next.js App Router API endpoint serving as a proxy between the frontend client and the public Binance REST API.
- Implemented Technical Analysis (TA) Engine (`src/lib/ta-engine.ts`) with functions to calculate EMA, MACD, RSI, and ATR indicators using `technicalindicators` and process trading signals as per defined PRD logic.
- Built Risk Calculator utility (`src/lib/risk-calculator.ts`) encapsulating Stop Loss, Take Profit, and Position Sizing capabilities based on capital input and trailing volatility (ATR).

## Dependencies Installed
- `@prisma/client`: Database ORM client (installed in Phase 1).
- `prisma`: Database tool for schema building (installed in Phase 1).
- `technicalindicators`: Used for resolving TA mathematics.
- Native `fetch` is being utilized to connect with Binance to keep bundle size lightweight.

## File Structure Changes
- **New Files**:
  - `src/lib/db.ts`
  - `src/app/api/market-data/route.ts`
  - `src/lib/ta-engine.ts`
  - `src/lib/risk-calculator.ts`
  - `execution_reports/report_phase_2_and_3.md`

## Technical Details
- **Binance Proxy API**: 
  - Defined standard TS interfaces (`BinanceKline`).
  - Utilizes Next.js App Router standards (`NextRequest`, `NextResponse`).
  - Fetches from `https://api.binance.com/api/v3/klines`.
  - Formats data into a structured schema compatible directly with `lightweight-charts` (time mapped into seconds via UNIX timestamp, numbers converted to float).
- **TA Engine**: 
  - Extracts series structures from the OHLCV array.
  - Generates series arrays using `technicalindicators` for EMA(50), EMA(200), RSI(14), MACD(12, 26, 9), and ATR(14). 
  - Uses a `padStart` padding function since trailing indicators truncate output lengths based on their lag period. Padding standardizes index mapping.
  - The `generateSignal` function correlates the crossover logic alongside bounded RSI filters.

## Issues/Blockers
- **Prisma Client CLI Hanging**: Running `npx prisma init` and `npx prisma generate` hung abruptly during execution possibly due to script-blocking settings within the environment or node downloading binaries. I mitigated this by skipping `init` and writing `prisma/schema.prisma` natively, as well as providing the global instance manually inside `db.ts`. The types generated alongside `@prisma/client` allowed the project to continue securely without requiring interactive Prisma commands at this time.
