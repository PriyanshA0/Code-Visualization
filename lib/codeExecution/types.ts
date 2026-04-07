export interface ExecutionStep {
  description: string;
  line: number;
  column?: number;
  variables: Record<string, any>;
  callStack: CallFrameInfo[];
  output: string;
  timestamp: number;
}

export interface CallFrameInfo {
  functionName: string;
  parameters: Record<string, any>;
  localVariables: Record<string, any>;
}

export interface ExecutionTrace {
  steps: ExecutionStep[];
  output: string;
  errors: string | null;
  totalSteps: number;
  executionTime: number; // milliseconds
}

export interface CodeExecutionRequest {
  code: string;
  language: "javascript" | "python" | "java";
  timeout?: number; // milliseconds, default 5000
}
