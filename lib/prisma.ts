import { PrismaClient } from '@prisma/client';

const g = globalThis as unknown as { _prisma?: PrismaClient };

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    if (!g._prisma) {
      g._prisma = new PrismaClient();
    }
    const val = Reflect.get(g._prisma, prop);
    return typeof val === 'function' ? val.bind(g._prisma) : val;
  },
});
