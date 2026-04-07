import { connectToDB } from "@/lib/mongodb";
import UserSubscription, { PlanType } from "@/lib/models/UserSubscription";

const DEFAULT_FREE_LIMIT = 2;
const PURCHASE_CREDIT_PACK = 10;

type MemoryQuota = {
  planType: PlanType;
  monthlyFreeLimit: number;
  monthlyFreeUsed: number;
  paidCreditsTotal: number;
  paidCreditsRemaining: number;
  resetAt: Date;
  isPaid: boolean;
};

const memoryQuotaStore = new Map<string, MemoryQuota>();

export interface QuotaDecision {
  allowed: boolean;
  requiresPayment: boolean;
  planType: PlanType;
  quotaMode: "free" | "paid";
  freeLimit: number;
  freeUsed: number;
  freeRemaining: number;
  paidCreditsTotal: number;
  paidCreditsRemaining: number;
  resetAt: string;
}

function getNextResetDate(from = new Date()) {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1, 0, 0, 0));
}

function toDecision(input: {
  allowed: boolean;
  monthlyFreeLimit: number;
  monthlyFreeUsed: number;
  paidCreditsTotal: number;
  paidCreditsRemaining: number;
  resetAt: Date;
}) {
  const freeRemaining = Math.max(input.monthlyFreeLimit - input.monthlyFreeUsed, 0);
  const paidCreditsTotal = Math.max(input.paidCreditsTotal, 0);
  const paidCreditsRemaining = Math.max(input.paidCreditsRemaining, 0);
  const quotaMode = paidCreditsTotal > 0 ? "paid" : "free";

  return {
    allowed: input.allowed,
    requiresPayment: !input.allowed,
    planType: quotaMode === "paid" ? "pro" : "free",
    quotaMode,
    freeLimit: input.monthlyFreeLimit,
    freeUsed: input.monthlyFreeUsed,
    freeRemaining,
    paidCreditsTotal,
    paidCreditsRemaining,
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
      paidCreditsTotal: 0,
      paidCreditsRemaining: 0,
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
  const legacyPaidWithoutCredits =
    (fallback.planType !== "free" || fallback.isPaid) && fallback.paidCreditsTotal === 0;

  if (legacyPaidWithoutCredits) {
    fallback.planType = "pro";
    fallback.isPaid = true;
    fallback.paidCreditsTotal = PURCHASE_CREDIT_PACK;
    fallback.paidCreditsRemaining = Math.max(fallback.paidCreditsRemaining, PURCHASE_CREDIT_PACK);
  }

  const hasPaidWallet = fallback.paidCreditsTotal > 0;

  if (hasPaidWallet) {
    if (fallback.paidCreditsRemaining <= 0) {
      return toDecision({
        allowed: false,
        monthlyFreeLimit: fallback.monthlyFreeLimit,
        monthlyFreeUsed: fallback.monthlyFreeUsed,
        paidCreditsTotal: fallback.paidCreditsTotal,
        paidCreditsRemaining: fallback.paidCreditsRemaining,
        resetAt: fallback.resetAt,
      });
    }

    if (consumeAttempt) {
      fallback.paidCreditsRemaining -= 1;
    }

    return toDecision({
      allowed: true,
      monthlyFreeLimit: fallback.monthlyFreeLimit,
      monthlyFreeUsed: fallback.monthlyFreeUsed,
      paidCreditsTotal: fallback.paidCreditsTotal,
      paidCreditsRemaining: fallback.paidCreditsRemaining,
      resetAt: fallback.resetAt,
    });
  }

  if (fallback.monthlyFreeUsed >= fallback.monthlyFreeLimit) {
    return toDecision({
      allowed: false,
      monthlyFreeLimit: fallback.monthlyFreeLimit,
      monthlyFreeUsed: fallback.monthlyFreeUsed,
      paidCreditsTotal: fallback.paidCreditsTotal,
      paidCreditsRemaining: fallback.paidCreditsRemaining,
      resetAt: fallback.resetAt,
    });
  }

  if (consumeAttempt) {
    fallback.monthlyFreeUsed += 1;
  }

  return toDecision({
    allowed: true,
    monthlyFreeLimit: fallback.monthlyFreeLimit,
    monthlyFreeUsed: fallback.monthlyFreeUsed,
    paidCreditsTotal: fallback.paidCreditsTotal,
    paidCreditsRemaining: fallback.paidCreditsRemaining,
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
      paidCreditsTotal: 0,
      paidCreditsRemaining: 0,
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

    let paidCreditsTotal = Math.max(record.paidCreditsTotal ?? 0, 0);
    let paidCreditsRemaining = Math.max(record.paidCreditsRemaining ?? 0, 0);
    const isLegacyPaidWithoutCredits =
      (record.planType !== "free" || record.isPaid) && paidCreditsTotal === 0;

    if (isLegacyPaidWithoutCredits) {
      paidCreditsTotal = PURCHASE_CREDIT_PACK;
      paidCreditsRemaining = Math.max(paidCreditsRemaining, PURCHASE_CREDIT_PACK);
      await UserSubscription.updateOne(
        { _id: record._id },
        {
          $set: {
            planType: "pro",
            isPaid: true,
            paidCreditsTotal,
            paidCreditsRemaining,
          },
        }
      );
    }

    const hasPaidWallet = paidCreditsTotal > 0;
    const freeLimit = Math.max(record.monthlyFreeLimit ?? DEFAULT_FREE_LIMIT, 0);
    const freeUsed = Math.max(record.monthlyFreeUsed ?? 0, 0);
    const resetAt =
      record.resetAt instanceof Date && !Number.isNaN(record.resetAt.getTime())
        ? record.resetAt
        : getNextResetDate();

    if (hasPaidWallet) {
      if (paidCreditsRemaining <= 0) {
        return toDecision({
          allowed: false,
          monthlyFreeLimit: freeLimit,
          monthlyFreeUsed: freeUsed,
          paidCreditsTotal,
          paidCreditsRemaining,
          resetAt,
        });
      }

      if (consumeAttempt) {
        const decrementResult = await UserSubscription.updateOne(
          { _id: record._id, paidCreditsRemaining: { $gt: 0 } },
          {
            $set: { planType: "pro", isPaid: true, resetAt },
            $inc: { paidCreditsRemaining: -1 },
          }
        );

        if (decrementResult.modifiedCount === 0) {
          return toDecision({
            allowed: false,
            monthlyFreeLimit: freeLimit,
            monthlyFreeUsed: freeUsed,
            paidCreditsTotal,
            paidCreditsRemaining: 0,
            resetAt,
          });
        }

        paidCreditsRemaining -= 1;
      }

      return toDecision({
        monthlyFreeLimit: freeLimit,
        monthlyFreeUsed: freeUsed,
        paidCreditsTotal,
        paidCreditsRemaining,
        allowed: true,
        resetAt,
      });
    }

    if (freeUsed >= freeLimit) {
      return toDecision({
        allowed: false,
        monthlyFreeLimit: freeLimit,
        monthlyFreeUsed: freeUsed,
        paidCreditsTotal,
        paidCreditsRemaining,
        resetAt,
      });
    }

    if (consumeAttempt) {
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

    if (!consumeAttempt) {
      record.monthlyFreeUsed = freeUsed;
      record.monthlyFreeLimit = freeLimit;
      record.resetAt = resetAt;
    }

    return toDecision({
      allowed: true,
      monthlyFreeLimit: record.monthlyFreeLimit,
      monthlyFreeUsed: record.monthlyFreeUsed,
      paidCreditsTotal,
      paidCreditsRemaining,
      resetAt: record.resetAt,
    });
  } catch (error) {
    console.error("Quota DB fallback triggered:", error);
    return decisionFromMemory(userId, consumeAttempt);
  }
}