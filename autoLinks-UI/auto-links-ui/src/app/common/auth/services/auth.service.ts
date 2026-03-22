import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthBackendService } from './auth.backend.service';
import {
  IUser,
  ILoginRequest,
  ISignupRequest,
  IAuthResponse,
} from '../interfaces';

const TOKEN_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const USER_KEY = 'user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<IUser | null>(this.loadUser());

  readonly currentUser = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user() && !!this.getAccessToken());

  constructor(
    private backend: AuthBackendService,
    private router: Router,
  ) {}

  signup(data: ISignupRequest): Observable<IAuthResponse> {
    return this.backend.signup(data).pipe(
      tap((res) => this.storeSession(res)),
    );
  }

  login(data: ILoginRequest): Observable<IAuthResponse> {
    return this.backend.login(data).pipe(
      tap((res) => this.storeSession(res)),
    );
  }

  refresh(): Observable<{ token: string }> {
    return this.backend.refresh(this.getRefreshToken()!).pipe(
      tap((res) => localStorage.setItem(TOKEN_KEY, res.token)),
    );
  }

  logout(): void {
    this.backend.logout(this.getRefreshToken()!).subscribe({
      complete: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  private storeSession(res: IAuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this._user.set(res.user);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  private loadUser(): IUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
