import { prisma } from './prisma';

export const FREE_WEEKLY_LIMIT = 1;

export const FUTURES_SYMBOLS = new Set([
  'MNQ','NQ','MES','ES','YM','MYM','RTY','M2K',
  'XAUUSD','GOLD','GC','XAGUSD','SILVER','SI',
  'CL','WTI','CRUDE','OIL','NG','HG',
  'ZN','ZB','SPX','NDX','DJI','RUT','VIX','DXY',
]);

export function isFuturesSymbol(symbol: string): boolean {
  const s = symbol.toUpperCase();
  return FUTURES_SYMBOLS.has(s) || s.endsWith('=F') || s.startsWith('^') || s.startsWith('DX-');
}

/** Read-only quota check — does NOT consume a backtest. */
export async function getQuota(user: {
  id: string;
  plan: string;
  backtestCount: number;
  backtestCountResetAt: Date | string | null;
}) {
  if (user.plan === 'pro') {
    return { plan: 'pro' as const, remaining: null, limit: null, resetAt: null };
  }
  const now = new Date();
  const resetAt = user.backtestCountResetAt
    ? new Date(user.backtestCountResetAt as string)
    : new Date(0);
  const daysSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60 * 24);
  const needsReset = daysSinceReset >= 7;
  const count = needsReset ? 0 : user.backtestCount;
  const remaining = Math.max(0, FREE_WEEKLY_LIMIT - count);
  const nextReset = new Date(resetAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    plan: 'free' as const,
    remaining,
    limit: FREE_WEEKLY_LIMIT,
    resetAt: needsReset ? null : nextReset.toISOString(),
  };
}

export async function ensureQuotaAndConsume(user: {
  id: string;
  plan: string;
  backtestCount: number;
  backtestCountResetAt: Date | string | null;
}) {
  if (user.plan === 'pro') return { allowed: true, remaining: Infinity };

  const now = new Date();
  const resetAt = user.backtestCountResetAt ? new Date(user.backtestCountResetAt) : new Date(0);
  const daysSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60 * 24);
  const needsReset = daysSinceReset >= 7;
  const count = needsReset ? 0 : user.backtestCount;

  if (count >= FREE_WEEKLY_LIMIT) {
    const nextReset = new Date(resetAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    const daysLeft = Math.ceil((nextReset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      allowed: false,
      remaining: 0,
      message: `Free plan limit reached (1 backtest/week). Resets in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Upgrade to Pro for unlimited backtests on all instruments including futures.`,
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      backtestCount: count + 1,
      backtestCountResetAt: needsReset
        ? now
        : (user.backtestCountResetAt ? new Date(user.backtestCountResetAt as string) : now),
    },
  });

  return { allowed: true, remaining: FREE_WEEKLY_LIMIT - (count + 1) };
}import { prisma } from './prisma';

export const FREE_WEEKLY_LIMIT = 1;

// Symbols that require Pro (futures & major indices)
export const FUTURES_SYMBOLS = new Set([
  'MNQ','NQ','MES','ES','YM','MYM','RTY','M2K',
  'XAUUSD','GOLD','GC','XAGUSD','SILVER','SI',
  'CL','WTI','CRUDE','OIL','NG','HG',
  'ZN','ZB','SPX','NDX','DJI','RUT','VIX','DXY',
]);

export function isFuturesSymbol(symbol: string): boolean {
  const s = symbol.toUpperCase();
  return FUTURES_SYMBOLS.has(s) || s.endsWith('=F') || s.startsWith('^') || s.startsWith('DX-');
}

export async function ensureQuotaAndConsume(user: {
  id: string;
  plan: string;
  backtestCount: number;
  backtestCountResetAt: Date | string | null;
}) {
  if (user.plan === 'pro') return { allowed: true, remaining: Infinity };

  const now = new Date();
  const resetAt = user.backtestCountResetAt ? new Date(user.backtestCountResetAt) : new Date(0);
  const daysSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60 * 24);
  const needsReset = daysSinceReset >= 7;
  const count = needsReset ? 0 : user.backtestCount;

  if (count >= FREE_WEEKLY_LIMIT) {
    const nextReset = new Date(resetAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    const daysLeft = Math.ceil((nextReset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      allowed: false,
      remaining: 0,
      message: `Free plan limit reached (1 backtest/week). Resets in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Upgrade to Pro for unlimited backtests on all instruments including futures.`,
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      backtestCount: count + 1,
      backtestCountResetAt: needsReset ? now : (user.backtestCountResetAt ? new Date(user.backtestCountResetAt as string) : now),
    },
  });

  return { allowed: true, remaining: FREE_WEEKLY_LIMIT - (count + 1) };
}
