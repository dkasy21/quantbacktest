import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { backtestRequestSchema } from '@/lib/backtest/schema';
import { runBacktest, validateStrategy } from '@/lib/backtest/engine';
import { fetchBars, DataFetchError } from '@/lib/data';
import { ensureQuotaAndConsume } from '@/lib/plan';
export async function POST(req) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  let body; try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }
  const parsed = backtestRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });
  const { strategy, startDate, endDate, interval } = parsed.data;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  const quota = await ensureQuotaAndConsume(user);
  if (!quota.allowed) return NextResponse.json({ error: 'Free plan limit reached. Upgrade to Pro for unlimited backtests.' }, { status: 429 });
  try { validateStrategy(strategy); } catch (err) { return NextResponse.json({ error: err instanceof Error ? err.message : 'Invalid strategy.' }, { status: 400 }); }
  let bars; try { bars = await fetchBars({ symbol: strategy.symbol, interval, startDate, endDate }); } catch (err) { return NextResponse.json({ error: err instanceof DataFetchError ? err.message : 'Failed to fetch market data.' }, { status: 502 }); }
  try { const result = runBacktest(bars, strategy); return NextResponse.json({ result, bars, remainingQuota: quota.remaining }); } catch (err) { return NextResponse.json({ error: err instanceof Error ? err.message : 'Backtest failed.' }, { status: 500 }); }
}
