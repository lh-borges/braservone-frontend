// src/app/core/interceptors/api-error.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { normalizeApiError } from '../../model/api-error.model';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err) => {
      const apiErr = normalizeApiError(err);
      return throwError(() => apiErr); // repropaga já normalizado
    })
  );
