import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    //make HttpClient available for injection everywhere in the app.
    //withInterceptors([authInterceptor]) - interceptors are applied to all HTTP requests.
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
