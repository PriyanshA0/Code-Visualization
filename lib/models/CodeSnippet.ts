import mongoose, { Document, Schema } from "mongoose";

export interface ICodeSnippet extends Document {
  userId: string;
  title: string;
  code: string;
  language: "javascript" | "python" | "java";
  description?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CodeSnippetSchema = new Schema<ICodeSnippet>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      enum: ["javascript", "python", "java"],
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.CodeSnippet ||
  mongoose.model<ICodeSnippet>("CodeSnippet", CodeSnippetSchema);
