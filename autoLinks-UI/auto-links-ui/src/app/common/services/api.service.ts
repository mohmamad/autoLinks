import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(this.url(path));
  }

  post<T>(path: string, body: object = {}): Observable<T> {
    return this.http.post<T>(this.url(path), body);
  }

  postText(path: string, body: object = {}): Observable<string> {
    return this.http.post(this.url(path), body, { responseType: 'text' });
  }

  put<T>(path: string, body: object = {}): Observable<T> {
    return this.http.put<T>(this.url(path), body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path));
  }

  postWithHeaders<T>(
    path: string,
    body: object,
    headers: HttpHeaders,
  ): Observable<T> {
    return this.http.post<T>(this.url(path), body, { headers });
  }

  private url(path: string): string {
    return `${this.baseUrl}${path}`;
  }
}
