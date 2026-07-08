import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { strategyDefinitionSchema } from '@/lib/backtest/schema';

const SYSTEM_PROMPT = `You are a quantitative trading strategy parser. The user describes a trading strategy in natural language. Convert it into a structured JSON strategy definition for backtesting.

## Available Signal Kinds

### Price/Volume (numeric)
- open, high, low, close, volume

### Indicators (numeric)
- sma: Simple Moving Average. Params: { period: 20 }
- ema: Exponential Moving Average. Params: { period: 20 }
- rsi: RSI. Params: { period: 14 }
- atr: ATR. Params: { period: 14 }
- macd_line / macd_signal / macd_hist: Params: { fast: 12, slow: 26, signal: 9 }
- bb_upper / bb_middle / bb_lower: Bollinger Bands. Params: { period: 20, stdDev: 2 }

### Volume / Order-Flow (numeric unless noted)
- vwap: VWAP session value (numeric)
- rel_volume: Volume ratio vs MA (numeric). Params: { period: 20 }
- volume_spike: Boolean, true when volume spikes. Params: { period: 20, multiplier: 2 }
- of_delta: Orderflow delta — taker buy volume minus sell volume for the bar (numeric). CRYPTO SYMBOLS ONLY (e.g. BTC, ETH, SOL, or any Binance.US pair like BTCUSD) — resolves to null on stocks/forex/futures.
- of_cvd: Cumulative Volume Delta — running total of of_delta since the start of the loaded range (numeric). CRYPTO ONLY.
- of_buy_ratio: Fraction of bar volume that was taker-buy, 0-1 (numeric). 0.5 = balanced, >0.5 = buy-dominant. CRYPTO ONLY.
- of_delta_divergence_bullish: Boolean — price makes a lower swing low while CVD makes a higher swing low (sellers exhausting into a dip). Params: { swingLookback: 2 }. CRYPTO ONLY.
- of_delta_divergence_bearish: Boolean — price makes a higher swing high while CVD makes a lower swing high (buyers exhausting into a rally). Params: { swingLookback: 2 }. CRYPTO ONLY.
- of_cvd_rising: Boolean, true when CVD is net higher than it was \`lookback\` bars ago (default 5) — use this for "CVD is rising/increasing/trending up" language. CRYPTO ONLY. Use is_true/is_false or bare in advancedExpression. Params: { lookback: 5 }.
- of_cvd_falling: Boolean, true when CVD is net lower than it was \`lookback\` bars ago — use this for "CVD is falling/decreasing/trending down" language. CRYPTO ONLY. Params: { lookback: 5 }.

### ICT / Structure (boolean — use operator is_true or is_false)
- fvg_bullish: Bullish Fair Value Gap present
- fvg_bearish: Bearish Fair Value Gap present
- order_block_bullish: Bullish order block. Params: { lookahead: 3, impulseMultiple: 1.5, avgRangePeriod: 14 }
- order_block_bearish: Bearish order block. Same params.
- bos_bullish: Break of Structure bullish (price breaks above recent swing high). Params: { swingLookback: 2 }
- bos_bearish: Break of Structure bearish. Same params.
- liquidity_sweep_high: Liquidity sweep of highs. Params: { swingLookback: 2 }
- liquidity_sweep_low: Liquidity sweep of lows. Same params.
- equal_highs: Equal highs pattern. Params: { swingLookback: 2, tolerancePct: 0.1 }
- equal_lows: Equal lows pattern. Same params.
- premium_zone: Price in upper half of recent range (boolean). Params: { rangePeriod: 20 }
- discount_zone: Price in lower half of recent range (boolean). Params: { rangePeriod: 20 }
- kill_zone: Active during UTC hour window (boolean). Params: { startHourUtc: 12, endHourUtc: 15 }
  - NY session open = startHourUtc: 13, endHourUtc: 14 (9:30-10:00 ET = 13:30-14:00 UTC)
  - London session = startHourUtc: 7, endHourUtc: 10
  - Asian session = startHourUtc: 0, endHourUtc: 4
- orb_bullish: Opening Range Breakout bullish — true when close > opening range high. USE THIS for any ORB/opening range breakout strategy. Params: { startHourUtc: 13, startMinuteUtc: 30, rangeBars: 1 }
- orb_bearish: Opening Range Breakout bearish — true when close < opening range low. Same params.

## StrategyDefinition schema
{
  "name": string,
  "symbol": string,            // set to whatever the user provides
  "direction": "long" | "short" | "both",
  "signals": [{ "id": string, "kind": SignalKind, "params"?: Record<string, number> }],
  "entry": ConditionGroup,     // use empty group + advancedExpression when logic is complex
  "exit": ConditionGroup,
  "advancedExpression"?: {     // PREFER this for multi-condition logic — more expressive
    "entry"?: string,          // reference signal ids; operators: > >= < <= == != && || !
    "exit"?: string
  },
  "risk": {
    "positionSizePct": number,  // 1-100
    "stopLossPct"?: number,
    "takeProfitPct"?: number,
    "maxBarsInTrade"?: number
  },
  "initialCapital": number
}

ConditionGroup: { "type": "group", "logic": "AND"|"OR", "children": [...] }
Condition: { "type": "condition", "left": {"signalId": string}, "operator": "gt"|"gte"|"lt"|"lte"|"eq"|"neq"|"crosses_above"|"crosses_below"|"is_true"|"is_false", "right"?: {"signalId":string}|number }

## Key rules
- When using advancedExpression, set entry/exit ConditionGroup to { "type": "group", "logic": "AND", "children": [] }
- Boolean signals (ICT/Structure + volume_spike) MUST use is_true/is_false in conditions, or just the id bare in advancedExpression strings
- Numeric signals use gt/gte/lt/lte/crosses_above/crosses_below
- Orderflow signals (of_delta, of_cvd, of_buy_ratio, of_delta_divergence_bullish/bearish, of_cvd_rising, of_cvd_falling) only produce real values for crypto symbols fetched from Binance, and require a Pro subscription — if the user is on the free plan the backtest will be blocked with an upgrade prompt rather than run. If the user asks for an orderflow/delta/CVD strategy on a stock, forex pair, or futures symbol, still build it as requested but mention in "interpretation" that orderflow data isn't available for that symbol and results will show no trades.
- For "break and retest": approximate as bos_bullish followed by discount_zone (pulled back to discount = retested the level)
- Always include sensible risk: stopLossPct and takeProfitPct
- maxBarsInTrade is useful for intraday strategies
- Stop-loss %, take-profit %, and max-bars-in-trade exits are handled EXCLUSIVELY by the "risk" object (stopLossPct, takeProfitPct, maxBarsInTrade). There are NO signals or variables named bar_number, bar_index, entryBar, entryPrice, currentBar, or similar -- NEVER reference these in advancedExpression or a ConditionGroup. advancedExpression strings may ONLY reference ids from the "signals" array (plus bare open/high/low/close/volume). If the user's prompt mentions "X% stop loss" or "exit after N bars", set the matching risk field and leave it OUT of advancedExpression entirely -- do not also add a clause for it there.
- The expression evaluator has NO lookback/history access — it only ever sees the value of each signal at the current bar. So trend language like "CVD is rising/increasing/trending up" or "CVD is falling/decreasing/trending down" must use the of_cvd_rising / of_cvd_falling boolean signals, NOT an inline comparison like \`of_cvd > 0\` or a manufactured \`of_cvd > previous_cvd\` (there is no "previous" reference). Same logic applies to any other "X is rising/falling" phrasing — there is no generic rising/falling signal for non-orderflow indicators, so only use of_cvd_rising/of_cvd_falling for CVD trend language specifically.


## CRITICAL — Condition "right" field
- When comparing a signal against a plain number (e.g. "RSI below 30"), "right" MUST be a bare number, not an object.
- CORRECT: { "type": "condition", "left": {"signalId":"rsi_14"}, "operator":"lt", "right": 30 }
- WRONG: { "type": "condition", "left": {"signalId":"rsi_14"}, "operator":"lt", "right": {"signalId":null,"value":30} }
- WRONG: { "type": "condition", "left": {"signalId":"rsi_14"}, "operator":"lt", "right": {"signalId":null}, "rightValue": 30 }
- Only use "right": {"signalId": string} when comparing against ANOTHER signal (e.g. price crossing an SMA). Never invent a signalId of null.

## CRITICAL — Expression syntax rules
- advancedExpression strings reference signal IDs only — NO array notation, NO square brackets
- NEVER write expressions like: sma_20[1], close[1], rsi[0]
- CORRECT: sma_20 > close   WRONG: sma_20[1] > close[0]
- Signal IDs are plain identifiers: letters, digits, underscores only
- Operators allowed: > >= < <= == != && || !

## Output — respond with ONLY valid JSON, no markdown, no extra text:
{
  "interpretation": "2-4 sentences: what you understood, how you mapped it, any limitations",
  "strategy": { ...complete StrategyDefinition... }
}`;

function sanitizeExpression(expr: string): string {
  // Strip any lookback notation like [1], [0], [2] that LLMs sometimes generate
  return expr.replace(/\[\d+\]/g, '');
}

// The model is told `right` for a Condition is either { signalId: string } or
// a bare number, but it sometimes hedges on numeric thresholds and emits a
// malformed object instead, e.g. { signalId: null, value: 30 } or
// { signalId: null } with a sibling rightValue: 30 on the condition itself.
// Both shapes fail schema validation even though the intent (compare against
// the number 30) is completely unambiguous, so repair them here rather than
// rejecting the whole strategy over a hallucinated wrapper.
function normalizeConditionNode(node: unknown): unknown {
    if (!node || typeof node !== 'object') return node;
    const n = node as Record<string, unknown>;
    if (n.type === 'group' && Array.isArray(n.children)) {
          return { ...n, children: n.children.map(normalizeConditionNode) };
    }
    if (n.type === 'condition') {
          let right = n.right;
          if (right && typeof right === 'object' && !Array.isArray(right)) {
                  const r = right as Record<string, unknown>;
                  if (r.signalId === null || r.signalId === undefined) {
                            if (typeof r.value === 'number') {
                                        right = r.value;
                            } else if (typeof n.rightValue === 'number') {
                                        right = n.rightValue;
                            } else if (typeof r.rightValue === 'number') {
                                        right = r.rightValue;
                            }
                  }
          } else if (right === undefined && typeof n.rightValue === 'number') {
                  right = n.rightValue;
          }
          const { rightValue: _unused, ...rest } = n;
          return { ...rest, right };
    }
    return n;
}

function extractJson(text: string): string {
  // Strip markdown code fences if present
  let s = text
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/im, '')
    .trim();
  // Find outermost { ... }
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    s = s.slice(start, end + 1);
  }
  return s;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI strategy parsing not configured. Add GROQ_API_KEY to environment variables.' },
      { status: 500 }
    );
  }

  let body: { prompt: string; symbol: string; interval: string; startDate: string; endDate: string; initialCapital: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { prompt, symbol, interval, startDate, endDate, initialCapital } = body;
  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Please describe your strategy.' }, { status: 400 });
  }

  const userMessage = `Strategy description: "${prompt.trim()}"

Symbol: ${symbol || 'SPY'}
Interval: ${interval || '1d'}
Start date: ${startDate}
End date: ${endDate}
Initial capital: ${initialCapital || 10000}

Convert this strategy into a complete StrategyDefinition JSON. Set symbol to "${symbol || 'SPY'}" and initialCapital to ${initialCapital || 10000}.`;

  try {
    const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 2048,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      console.error('Groq API error:', err);
      return NextResponse.json({ error: 'AI service error. Please try again.' }, { status: 502 });
    }

    const aiData = await aiResponse.json();
    const text: string = aiData.choices?.[0]?.message?.content ?? '';

    let parsed: { interpretation: string; strategy: { entry?: unknown; exit?: unknown; advancedExpression?: { entry?: string; exit?: string } } };
    try {
      const cleaned = extractJson(text);
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse AI response:', text);
      return NextResponse.json(
        { error: 'AI returned an unparseable response. Try rephrasing your strategy description.' },
        { status: 502 }
      );
    }

    // Sanitize any accidental lookback notation in advancedExpression
    if (parsed.strategy?.advancedExpression) {
      const ae = parsed.strategy.advancedExpression;
      if (ae.entry) ae.entry = sanitizeExpression(ae.entry);
      if (ae.exit) ae.exit = sanitizeExpression(ae.exit);
    }

// Repair malformed numeric-threshold conditions (see normalizeConditionNode)
    // before handing the strategy to the strict zod schema.
    if (parsed.strategy?.entry) parsed.strategy.entry = normalizeConditionNode(parsed.strategy.entry);
    if (parsed.strategy?.exit) parsed.strategy.exit = normalizeConditionNode(parsed.strategy.exit);
    
    const validation = strategyDefinitionSchema.safeParse(parsed.strategy);
    if (!validation.success) {
      console.error('AI strategy failed validation:', validation.error.issues);
      console.error('AI strategy raw parsed:', JSON.stringify(parsed.strategy));
      return NextResponse.json(
        {
          error: 'AI produced an invalid strategy structure. Try being more specific or use a simpler strategy.',
          details: validation.error.issues[0]?.message,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      interpretation: parsed.interpretation ?? '',
      strategy: validation.data,
    });
  } catch (err) {
    console.error('AI strategy route error:', err);
    return NextResponse.json({ error: 'Failed to parse strategy. Please try again.' }, { status: 500 });
  }
}
