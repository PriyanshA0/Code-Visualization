import mongoose, { Document, Schema } from "mongoose";

export type PlanType = "free" | "pro";

export interface IUserSubscription extends Document {
  userId: string;
  planType: PlanType;
  monthlyFreeLimit: number;
  monthlyFreeUsed: number;
  paidCreditsTotal: number;
  paidCreditsRemaining: number;
  resetAt: Date;
  isPaid: boolean;
  paymentProvider?: "polar";
  providerCustomerId?: string;
  lastProcessedPolarEventId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSubscriptionSchema = new Schema<IUserSubscription>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    planType: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },
    monthlyFreeLimit: {
      type: Number,
      default: 2,
      min: 0,
    },
    monthlyFreeUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidCreditsTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidCreditsRemaining: {
      type: Number,
      default: 0,
      min: 0,
    },
    resetAt: {
      type: Date,
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paymentProvider: {
      type: String,
      enum: ["polar"],
    },
    providerCustomerId: String,
    lastProcessedPolarEventId: String,
  },
  { timestamps: true }
);

export default mongoose.models.UserSubscription ||
  mongoose.model<IUserSubscription>("UserSubscription", UserSubscriptionSchema);