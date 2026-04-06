import { connectToDB } from "@/lib/mongodb";
import UserSubscription, { PlanType } from "@/lib/models/UserSubscription";

const DEFAULT_FREE_LIMIT = 2;

type MemoryQuota = {
  planType: PlanType;
  monthlyFreeLimit: number;
  monthlyFreeUsed: number;
  resetAt: Date;
  isPaid: boolean;
};

const memoryQuotaStore = new Map<string, MemoryQuota>();

export interface QuotaDecision {
  allowed: boolean;
  requiresPayment: boolean;
  planType: PlanType;
  freeLimit: number;
  freeUsed: number;
  freeRemaining: number;
  resetAt: string;
}

function getNextResetDate(from = new Date()) {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1, 0, 0, 0));
}

function toDecision(input: {
  allowed: boolean;
  planType: PlanType;
  monthlyFreeLimit: number;
  monthlyFreeUsed: number;
  resetAt: Date;
}) {
  const freeRemaining = Math.max(input.monthlyFreeLimit - input.monthlyFreeUsed, 0);

  return {
    allowed: input.allowed,
    requiresPayment: !input.allowed,
    planType: input.planType,
    freeLimit: input.monthlyFreeLimit,
    freeUsed: input.monthlyFreeUsed,
    freeRemaining,
    resetAt: input.resetAt.toISOString(),
  } satisfies QuotaDecision;
}

function maybeResetMemoryQuota(quota: MemoryQuota) {
  const now = new Date();
  if (quota.resetAt <= now) {
    quota.monthlyFreeUsed = 0;
    quota.resetAt = getNextResetDate(now);
  }
}

function getOrCreateMemoryQuota(userId: string) {
  let current = memoryQuotaStore.get(userId);
  if (!current) {
    current = {
      planType: "free",
      monthlyFreeLimit: DEFAULT_FREE_LIMIT,
      monthlyFreeUsed: 0,
      resetAt: getNextResetDate(),
      isPaid: false,
    };
    memoryQuotaStore.set(userId, current);
  }

  maybeResetMemoryQuota(current);
  return current;
}

function decisionFromMemory(userId: string, consumeAttempt: boolean) {
  const fallback = getOrCreateMemoryQuota(userId);
  const isUnlimited = fallback.planType !== "free" || fallback.isPaid;

  if (!isUnlimited) {
    if (fallback.monthlyFreeUsed >= fallback.monthlyFreeLimit) {
      return toDecision({
        allowed: false,
        planType: fallback.planType,
        monthlyFreeLimit: fallback.monthlyFreeLimit,
        monthlyFreeUsed: fallback.monthlyFreeUsed,
        resetAt: fallback.resetAt,
      });
    }

    if (consumeAttempt) {
      fallback.monthlyFreeUsed += 1;
    }
  }

  return toDecision({
    allowed: true,
    planType: fallback.planType,
    monthlyFreeLimit: fallback.monthlyFreeLimit,
    monthlyFreeUsed: fallback.monthlyFreeUsed,
    resetAt: fallback.resetAt,
  });
}

async function getOrCreateDbQuota(userId: string) {
  const now = new Date();

  let record = await UserSubscription.findOne({ userId });
  if (!record) {
    record = await UserSubscription.create({
      userId,
      planType: "free",
      monthlyFreeLimit: DEFAULT_FREE_LIMIT,
      monthlyFreeUsed: 0,
      resetAt: getNextResetDate(now),
      isPaid: false,
    });
    return record;
  }

  if (record.resetAt <= now) {
    record.monthlyFreeUsed = 0;
    record.resetAt = getNextResetDate(now);
    await record.save();
  }

  return record;
}

export async function checkAndConsumeExecutionQuota(userId: string): Promise<QuotaDecision> {
  return evaluateExecutionQuota(userId, true);
}

export async function checkExecutionQuota(userId: string): Promise<QuotaDecision> {
  return evaluateExecutionQuota(userId, false);
}

async function evaluateExecutionQuota(
  userId: string,
  consumeAttempt: boolean
): Promise<QuotaDecision> {
  const connection = await connectToDB();

  if (!connection) {
    return decisionFromMemory(userId, consumeAttempt);
  }

  try {
    const record = await getOrCreateDbQuota(userId);
    const isUnlimited = record.planType !== "free" || record.isPaid;
    const freeLimit = Math.max(record.monthlyFreeLimit ?? DEFAULT_FREE_LIMIT, 0);
    const freeUsed = Math.max(record.monthlyFreeUsed ?? 0, 0);
    const resetAt =
      record.resetAt instanceof Date && !Number.isNaN(record.resetAt.getTime())
        ? record.resetAt
        : getNextResetDate();

    if (!isUnlimited && freeUsed >= freeLimit) {
      return toDecision({
        allowed: false,
        planType: record.planType,
        monthlyFreeLimit: freeLimit,
        monthlyFreeUsed: freeUsed,
        resetAt,
      });
    }

    if (!isUnlimited && consumeAttempt) {
      await UserSubscription.updateOne(
        { _id: record._id },
        {
          $set: { resetAt },
          $inc: { monthlyFreeUsed: 1 },
        }
      );

      record.monthlyFreeUsed = freeUsed + 1;
      record.monthlyFreeLimit = freeLimit;
      record.resetAt = resetAt;
    }

    if (!isUnlimited && !consumeAttempt) {
      record.monthlyFreeUsed = freeUsed;
      record.monthlyFreeLimit = freeLimit;
      record.resetAt = resetAt;
    }

    return toDecision({
      allowed: true,
      planType: record.planType,
      monthlyFreeLimit: record.monthlyFreeLimit,
      monthlyFreeUsed: record.monthlyFreeUsed,
      resetAt: record.resetAt,
    });
  } catch (error) {
    console.error("Quota DB fallback triggered:", error);
    return decisionFromMemory(userId, consumeAttempt);
  }
}