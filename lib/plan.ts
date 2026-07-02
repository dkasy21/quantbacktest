import { prisma } from './prisma';
export const FREE_PLAN_MONTHLY_LIMIT = 20;
export async function ensureQuotaAndConsume(user) {
  if (user.plan === 'pro') return { allowed: true, remaining: Infinity };
  const now = new Date();
  const resetAt = new Date(user.backtestCountResetAt);
  const needsReset = now.getUTCFullYear()!==resetAt.getUTCFullYear() || now.getUTCMonth()!==resetAt.getUTCMonth();
  let count = needsReset ? 0 : user.backtestCount;
  if (count >= FREE_PLAN_MONTHLY_LIMIT) {
    if (needsReset) await prisma.user.update({ where: { id: user.id }, data: { backtestCount: 0, backtestCountResetAt: now } });
    return { allowed: false, remaining: 0 };
  }
  await prisma.user.update({ where: { id: user.id }, data: { backtestCount: count+1, backtestCountResetAt: needsReset?now:user.backtestCountResetAt } });
  return { allowed: true, remaining: FREE_PLAN_MONTHLY_LIMIT-(count+1) };
}
