import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  email: string;
  clerkId?: string;
  isPro: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    clerkId: {
      type: String,
      sparse: true,
      index: true,
    },
    isPro: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
