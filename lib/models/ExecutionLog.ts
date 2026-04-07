import mongoose, { Document, Schema, Types } from "mongoose";

export interface ExecutionStep {
  line: number;
  variables: Record<string, any>;
  callStack: any[];
  output: string;
  timestamp: number;
}

export interface IExecutionLog extends Document {
  snippetId?: Types.ObjectId;
  userId: string;
  language: "javascript" | "python" | "java";
  code: string;
  executionTrace: ExecutionStep[];
  totalSteps: number;
  executionTime: number;
  error?: string;
  output: string;
  createdAt: Date;
}

const ExecutionLogSchema = new Schema<IExecutionLog>(
  {
    snippetId: {
      type: Schema.Types.ObjectId,
      ref: "CodeSnippet",
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    language: {
      type: String,
      enum: ["javascript", "python", "java"],
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    executionTrace: {
      type: Schema.Types.Mixed,
      default: [],
    },
    totalSteps: {
      type: Number,
      default: 0,
    },
    executionTime: {
      type: Number,
      default: 0,
    },
    error: String,
    output: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.models.ExecutionLog ||
  mongoose.model<IExecutionLog>("ExecutionLog", ExecutionLogSchema);
