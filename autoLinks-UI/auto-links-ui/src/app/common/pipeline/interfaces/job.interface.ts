export interface IPipelineJob {
  id: string;
  status: string;
  payload: string | null;
  pipelineName: string;
  createdAt: string;
}
