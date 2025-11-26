import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RootState } from '../../auth/state/auth.state';
import { selectUserDetails } from '../../auth/state/app.selector';
import { AuthResponse } from '../../login/model/auth-response.model';
import { Usuario } from '../../model/usuario';

@Injectable({ providedIn: 'root' })
export class UserService {
  
  private http = inject(HttpClient);
  private store = inject<Store<RootState>>(Store as any);
  private readonly base = environment.apiBaseUrl;

  private url(path: string): string {
    const b = this.base.endsWith('/') ? this.base.slice(0, -1) : this.base;
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${b}${p}`;
  }

  
  getUserByUsername(username: string): Observable<Usuario> {
    
    return this.http.get<Usuario>(this.url(`/api/user/${username}`));
  }


  createUser(usuario: Usuario): Observable<any> {
    return this.http.post(this.url('/api/user'), usuario);
  }


  updateUser(
    usernameId: string, 
    nome?: string, 
    email?: string
  ): Observable<Usuario> {
   
    const body: { nome?: string; email?: string } = {};
    if (nome !== undefined) body.nome = nome;
    if (email !== undefined) body.email = email;

    return this.http.patch<Usuario>(
      this.url(`/api/user/${usernameId}`),
      body
    );
  }

 
  changePassword(oldPassword: string, newPassword: string): Observable<void> {
    return this.http.patch<void>(
      this.url('/api/user/password'), 
      { oldPassword, newPassword }
    );
  }

  userLogado(): Observable<AuthResponse | null> {
    return this.store.select(selectUserDetails);
  }

  getAllUsers(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.url('/api/user'));
  }
}