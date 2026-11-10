import { runBars } from './vendor/makefun-bars.ts';

// A deterministic, long-only paper bot. It opens one bounded core position on the
// first cbBTC bar, then holds through short-term noise. A hard loss limit and a
// wide trailing guard protect capital; the replay itself handles final flattening.
const SYMBOL = 'CBBTC';
const MAX_ALLOCATION_BPS = 9_500;
const HARD_STOP_BPS = 2_000;
const TRAILING_STOP_BPS = 1_800;
const MAX_SLIPPAGE_BPS = 100;

let entered = false;
let entryPrice = 0n;
let peakPrice = 0n;
let stopped = false;

await runBars({
  onBatch(state, batch) {
    const bar = batch.bars.find((candidate) => candidate.symbol === SYMBOL);
    if (bar === undefined) return [];
    const close = BigInt(bar.c);
    const held = state.positions.get(SYMBOL);

    if (held !== undefined) {
      if (close > peakPrice) peakPrice = close;
      const hardStop = close * 10_000n <= entryPrice * BigInt(10_000 - HARD_STOP_BPS);
      const trailingStop = close * 10_000n <= peakPrice * BigInt(10_000 - TRAILING_STOP_BPS);
      if (hardStop || trailingStop) {
        stopped = true;
        return [{ side: 'sell', symbol: SYMBOL, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
      }
      return [];
    }

    // A single entry avoids churn and ensures the bot records a qualifying trade.
    if (entered || stopped) return [];
    const { caps, fees } = state.hello;
    const weight = Math.min(MAX_ALLOCATION_BPS, caps.max_weight_bps);
    const notional = state.equity * BigInt(weight) / 10_000n;
    const amount = state.cash < notional ? state.cash : notional;
    if (amount < BigInt(fees.min_notional_quote_units)) return [];
    entered = true;
    entryPrice = close;
    peakPrice = close;
    return [{ side: 'buy', symbol: SYMBOL, notional_quote_units: amount, max_slippage_bps: MAX_SLIPPAGE_BPS }];
  },
});
