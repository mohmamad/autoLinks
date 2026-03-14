export type ActionPlan = {
  action_name: string;
  description: string;
  inputs: ActionInput[];
  result: ExecutionResult[];
  diagram: string;
};

export type ActionInput = {
  id: string;
  description: string;
  url: string;
  method: string;
  payload?: Record<string, unknown>;
};

export type ExecutionResult = {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body: Record<string, unknown>;
};
