/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import { createMockPrisma } from "./mock-prisma";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function isConnectionError(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message || "");
  const code = String(err.code || "");
  const name = String(err.name || "");
  return (
    name.includes("InitializationError") ||
    name.includes("KnownRequestError") ||
    name.includes("RustPanicError") ||
    code === "P1001" ||
    code === "ECONNREFUSED" ||
    msg.includes("Can't reach database server") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("connect ECONNREFUSED")
  );
}

function getPrismaClient(): PrismaClient {
  let realPrisma: PrismaClient | null = null;
  const isLocalhostDb =
    !process.env.DATABASE_URL ||
    process.env.DATABASE_URL.includes("localhost:5432") ||
    process.env.DATABASE_URL.includes("127.0.0.1:5432");

  if (!isLocalhostDb) {
    try {
      realPrisma = new PrismaClient();
    } catch {
      console.warn("[AI Studio] PrismaClient initialization failed — using mock");
    }
  }

  const mockPrisma = createMockPrisma();
  let dbFailed = isLocalhostDb;

  const proxy = new Proxy({} as any, {
    get(_, prop: string) {
      if (prop === "$transaction") {
        return async (arg: any) => {
          if (!dbFailed && realPrisma) {
            try {
              return await realPrisma.$transaction(arg);
            } catch (err: any) {
              if (isConnectionError(err)) {
                dbFailed = true;
                return (mockPrisma as any).$transaction(arg);
              }
              throw err;
            }
          }
          return (mockPrisma as any).$transaction(arg);
        };
      }
      if (prop === "$connect" || prop === "$disconnect") {
        return async () => {};
      }
      if (prop === "$queryRaw" || prop === "$executeRaw") {
        return async (...args: any[]) => {
          if (!dbFailed && realPrisma) {
            try {
              return await (realPrisma as any)[prop](...args);
            } catch (err: any) {
              if (isConnectionError(err)) {
                dbFailed = true;
                return [];
              }
              throw err;
            }
          }
          return [];
        };
      }

      return new Proxy({} as any, {
        get(__, action: string) {
          return async (...args: any[]) => {
            if (!dbFailed && realPrisma && (realPrisma as any)[prop]?.[action]) {
              try {
                return await (realPrisma as any)[prop][action](...args);
              } catch (err: any) {
                if (isConnectionError(err)) {
                  console.warn(`[AI Studio] Database not connected — using mock for ${prop}.${action}`);
                  dbFailed = true;
                  return (mockPrisma as any)[prop]?.[action]?.(...args);
                }
                throw err;
              }
            }
            return (mockPrisma as any)[prop]?.[action]?.(...args);
          };
        },
      });
    },
  });

  return proxy as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
