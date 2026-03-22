import { SubscriberType } from '../enums';
import { IHttpConfig } from './http-config.interface';
import { IEmailConfig } from './email-config.interface';
import { ISlackConfig } from './slack-config.interface';

export interface ISubscriber {
  type: SubscriberType;
  config: IHttpConfig | IEmailConfig | ISlackConfig;
}
