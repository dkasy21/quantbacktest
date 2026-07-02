import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { backtestRequestSchema } from '@/lib/backtest/schema';
import { runBacktest, validateStrategy } from '@/lib/backtest/engine';
import { fetchBars, DataFetchError } from '@/lib/data';
import { ensureQuotaAndConsume } from '@/lib/plan';
import type { StrategyDefinition } from '@/lib/backtest/types';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to run a backtest.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = backtestRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request.' },
      { status: 400 }
    );
  }
  const { strategy, startDate, endDate, interval } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  const quota = await ensureQuotaAndConsume(user);
  if (!quota.allowed) {
    return NextResponse.json(
      { error: 'Free plan monthly backtest limit reached. Upgrade to Pro for unlimited backtests.' },
      { status: 429 }
    );
  }

  try {
    validateStrategy(strategy as StrategyDefinition);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid strategy definition.' },
      { status: 400 }
    );
  }

  let bars;
  try {
    bars = await fetchBars({ symbol: strategy.symbol, interval, startDate, endDate });
  } catch (err) {
    if (err instanceof DataFetchError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch market data.' }, { status: 502 });
  }

  try {
    const result = runBacktest(bars, strategy as StrategyDefinition);
    return NextResponse.json({ result, bars, remainingQuota: quota.remaining });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Backtest failed.' },
      { status: 500 }
    );
  }
}
