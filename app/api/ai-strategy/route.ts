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
- For "opening range breakout" strategies: use kill_zone for the session, bos_bullish/bos_bearish for the breakout, discount_zone/premium_zone for the retest
- For "break and retest": approximate as bos_bullish followed by discount_zone (pulled back to discount = retested the level)
- Always include sensible risk: stopLossPct and takeProfitPct
- maxBarsInTrade is useful for intraday strategies

## Output — respond with ONLY valid JSON, no markdown, no extra text:
{
  "interpretation": "2-4 sentences: what you understood, how you mapped it, any limitations",
  "strategy": { ...complete StrategyDefinition... }
}`;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI strategy parsing not configured. Add GROQ_API_KEY to Vercel environment variables.' },
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

    let parsed: { interpretation: string; strategy: unknown };
    try {
      const cleaned = text
        .replace(/^```(?:json)?\s*/m, '')
        .replace(/\s*```\s*$/m, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse AI response:', text);
      return NextResponse.json(
        { error: 'AI returned an unparseable response. Try rephrasing your strategy description.' },
        { status: 502 }
      );
    }

    const validation = strategyDefinitionSchema.safeParse(parsed.strategy);
    if (!validation.success) {
      console.error('AI strategy failed validation:', validation.error.issues);
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
