import { IUser } from './user.interface';

export interface IAuthResponse {
  user: IUser;
  token: string;
  refreshToken: string;
}
