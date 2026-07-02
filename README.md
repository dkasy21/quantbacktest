# QuantBacktest

A no-code strategy backtesting product: users describe a trading strategy (classic indicators, ICT structural concepts, volume/order-flow proxies, or a free-form expression) and get an instant backtest with a price chart, equity curve, trade log, and stats (win rate, profit factor, drawdown, Sharpe).

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Prisma + SQLite (dev) — swap to Postgres for production
- NextAuth (credentials/email+password)
- Stripe (subscriptions)
- lightweight-charts for price/equity charts
- yahoo-finance2 for historical OHLCV data

## Before you do anything else: read this
