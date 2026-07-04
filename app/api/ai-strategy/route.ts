import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { strategyDefinitionSchema } from '@/lib/backtest/schema';

const SYSTEM_PROMPT = `You are a quantitative trading strategy parser. The user describes a trading strategy in natural language. Convert it into a structured JSON strategy definition for backtesting.

## Available Signal Kinds

### Price/Volume (numeric): open, high, low, close, volume

### Indicators (numeric)
- sma: Simple Moving Average. Params: { period: 20 }
- ema: Exponential Moving Average. Params: { period: 20 }
- rsi: RSI. Params: { period: 14 }
- atr: ATR. Params: { period: 14 }
- macd_line / macd_signal / macd_hist. Params: { fast: 12, slow: 26, signal: 9 }
- bb_upper / bb_middle / bb_lower: Bollinger Bands. Params: { period: 20, stdDev: 2 }

### Volume / Order-Flow
- vwap: VWAP session value (numeric)
- rel_volume: Volume ratio vs MA (numeric). Params: { period: 20 }
- volume_spike: Boolean. Params: { period: 20, multiplier: 2 }

### ICT / Structure (all boolean - use is_true/is_false in conditions)
- fvg_bullish, fvg_bearish: Fair Value Gaps
- order_block_bullish, order_block_bearish. Params: { lookahead: 3, impulseMultiple: 1.5, avgRangePeriod: 14 }
- bos_bullish, bos_bearish: Break of Structure. Params: { swingLookback: 2 }
- liquidity_sweep_high, liquidity_sweep_low. Params: { swingLookback: 2 }
- equal_highs, equal_lows. Params: { swingLookback: 2, tolerancePct: 0.1 }
- premium_zone, discount_zone. Params: { rangePeriod: 20 }
- kill_zone: UTC hour window. Params: { startHourUtc: 12, endHourUtc: 15 }
  NY open = startHourUtc:13, endHourUtc:14. London = 7-10. Asian = 0-4.

## StrategyDefinition Schema
{
  "name": string,
  "symbol": string,
  "direction": "long" | "short" | "both",
  "signals": [{ "id": string, "kind": SignalKind, "params"?: Record<string, number> }],
  "entry": ConditionGroup,
  "exit": ConditionGroup,
  "advancedExpression"?: { "entry"?: string, "exit"?: string },
  "risk": { "positionSizePct": number, "stopLossPct"?: number, "takeProfitPct"?: number, "maxBarsInTrade"?: number },
  "initialCapital": number
}

ConditionGroup: { "type": "group", "logic": "AND"|"OR", "children": [...] }
Condition: { "type": "condition", "left": {"signalId": string}, "operator": "gt"|"gte"|"lt"|"lte"|"eq"|"neq"|"crosses_above"|"crosses_below"|"is_true"|"is_false", "right"?: {"signalId":string}|number }

## Rules
- Prefer advancedExpression for complex multi-signal logic. When using it, set entry/exit ConditionGroup to { "type":"group","logic":"AND","children":[] }
- Boolean signals: use is_true/is_false in Condition objects OR bare signal id in advancedExpression strings
- For opening range breakout: kill_zone + bos_bullish/bos_bearish for the break, discount_zone/premium_zone for the retest
- Always include stopLossPct and takeProfitPct
- For intraday strategies: include maxBarsInTrade

## Output — ONLY valid JSON, no markdown fences, no extra text:
{ "interpretation": "2-4 sentences explaining what you understood and any approximations made", "strategy": { ...complete StrategyDefinition... } }`;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json(
    { error: 'AI strategy parsing not configured. Add ANTHROPIC_API_KEY to Vercel environment variables.' },
    { status: 500 }
  );

  let body: { prompt: string; symbol: string; interval: string; startDate: string; endDate: string; initialCapital: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }

  const { prompt, symbol, interval, startDate, endDate, initialCapital } = body;
  if (!prompt?.trim()) return NextResponse.json({ error: 'Please describe your strategy.' }, { status: 400 });

  const userMessage = `Strategy: "${prompt.trim()}"
Symbol: ${symbol || 'SPY'}
Interval: ${interval || '1d'}
Start: ${startDate}
End: ${endDate}
Capital: ${initialCapital || 10000}

Convert to a complete StrategyDefinition JSON. Set symbol="${symbol || 'SPY'}" and initialCapital=${initialCapital || 10000}.`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!r.ok) {
      console.error('Anthropic error:', await r.text());
      return NextResponse.json({ error: 'AI service error. Please try again.' }, { status: 502 });
    }

    const d = await r.json();
    const text: string = d.content?.[0]?.text ?? '';

    let parsed: { interpretation: string; strategy: unknown };
    try {
      const cleaned = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse AI response:', text);
      return NextResponse.json({ error: 'AI returned an unparseable response. Try rephrasing your strategy.' }, { status: 502 });
    }

    const v = strategyDefinitionSchema.safeParse(parsed.strategy);
    if (!v.success) {
      console.error('AI strategy failed validation:', v.error.issues);
      return NextResponse.json(
        { error: 'AI produced an invalid strategy structure. Try being more specific.', details: v.error.issues[0]?.message },
        { status: 422 }
      );
    }

    return NextResponse.json({ interpretation: parsed.interpretation ?? '', strategy: v.data });
  } catch (err) {
    console.error('AI strategy route error:', err);
    return NextResponse.json({ error: 'Failed to parse strategy. Please try again.' }, { status: 500 });
  }
}
