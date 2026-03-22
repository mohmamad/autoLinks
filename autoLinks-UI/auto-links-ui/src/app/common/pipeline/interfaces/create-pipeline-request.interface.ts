import { ISubscriber } from './subscriber.interface';

export interface ICreatePipelineRequest {
  name: string;
  description: string;
  subscribers: ISubscriber[];
}
