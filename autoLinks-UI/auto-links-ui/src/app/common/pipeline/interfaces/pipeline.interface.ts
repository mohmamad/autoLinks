import { ISubscriber } from './subscriber.interface';

export interface IPipeline {
  id: string;
  name: string;
  description: string;
  webhookUrl: string;
  subscribers: ISubscriber[];
}
