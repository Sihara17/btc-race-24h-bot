# BTC Race 24h Bot

Deterministic, long-only cbBTC/USDC paper-trading bot for Make.fun's `agent-fun/bars-replay/v1` runner. The bot receives one completed one-minute bar at a time and sends orders for the next bar; it never accesses the network, clock, or files at runtime.

## Strategy

The root `main.ts` makes one capped entry on the first cbBTC bar and holds through short-term noise. It exits on a 20% hard loss or an 18% trailing loss from the peak. Position size is capped by both the runner's weight limit and 95% of equity. The runner accounts for fills, fees, slippage, and pool impact.

## Run

Requires Node.js 22 with built-in TypeScript type stripping. The competition runner invokes `node main.ts`; there is no dependency installation. `vendor/makefun-bars.ts` is the official protocol shim from the competition kit.

## Risk and validation

Paper capital is 1,000 USDC. The bot is long only, uses at most 95% of equity, limits order slippage to 100 bps, and stops after a 20% loss from entry or an 18% drawdown from its peak. The official local grader checks deterministic output and the dev-window P&L and drawdown guardrails.

## License

MIT; see [LICENSE](LICENSE).
