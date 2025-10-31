import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        /*// Verifica se o erro é 404 ou se está no protocolo 5xx
        if (error.status === 404 || (error.status >= 500 && error.status < 600)) {
          // Redireciona para a página 404
          this.router.navigate(['/404']);
        }*/
        return throwError(error);
      })
    );
  }
}