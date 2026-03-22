import { ISubscriber } from './subscriber.interface';

export interface IPipeline {
  id: string;
  name: string;
  description: string;
  status: string;
  webhookUrl: string;
  subscribers: ISubscriber[];
}
