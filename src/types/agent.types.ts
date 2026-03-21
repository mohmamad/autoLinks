export type ActionPlan = {
  result: Record<string, unknown>;
  diagram: string;
};

export type ActionInput = {
  id: string;
  description: string;
  url: string;
  method: string;
  payload?: Record<string, unknown>;
};
