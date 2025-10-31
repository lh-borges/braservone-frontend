// login/service/auth-service.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthResponse } from '../model/auth-response.model';
import { Observable } from 'rxjs';
import { environment } from "../../../environments/environment"

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  getAuthToken(username: string, password: string): Observable<AuthResponse> {
    const url = `${environment.apiBaseUrl}/api/auth/login`;
    return this.http.post<AuthResponse>(url, { username, password });
  }
}
