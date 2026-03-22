import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../common/auth/services/auth.service';

const PUBLIC_PATHS = ['/users/login', '/users/signup', '/users/refresh', '/users/logout'];

/**
 * Interceptor to add authentication headers to requests and refresh tokens when needed.
 * @param req - The HTTP request to intercept.
 * @param next - The HTTP handler to pass the request to.
 * @returns - The HTTP response from the next handler.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const auth = inject(AuthService);

  const isPublic = PUBLIC_PATHS.some((p) => req.url.includes(p));
  const token = auth.getAccessToken();

  const authReq =
    !isPublic && token
    // We clone because Angular HTTP requests are immutable -- you can't modify them directly, you must create a new copy with changes.
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isPublic) {
        return auth.refresh().pipe(
          switchMap((res) => {
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${res.token}` },
            });
            return next(retryReq);
          }),
          catchError(() => {
            auth.logout();
            return throwError(() => error);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
