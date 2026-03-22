import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { ILoginRequest, ISignupRequest, IAuthResponse } from '../interfaces';

@Injectable({ providedIn: 'root' })
export class AuthBackendService {
  constructor(
    private http: HttpClient,
    private api: ApiService,
  ) {}

  signup(_data: ISignupRequest): Observable<IAuthResponse> {
    return this.api.post<IAuthResponse>('/users/signup', _data);
  }

  login(_data: ILoginRequest): Observable<IAuthResponse> {
    return this.api.post<IAuthResponse>('/users/login', _data);
  }

  refresh(_refreshToken: string): Observable<{ token: string }> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${_refreshToken}`,
    });
    return this.api.postWithHeaders<{ token: string }>('/users/refresh', {}, headers);
  }

  logout(_refreshToken: string): Observable<object> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${_refreshToken}`,
    });
    return this.api.postWithHeaders<object>('/users/logout', {}, headers);
  }
}
