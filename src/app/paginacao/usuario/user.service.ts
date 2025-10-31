// src/app/service/user.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

import { environment } from '../../../environments/environment'; // ✅ mantém o caminho informado
import { RootState } from '../../auth/state/auth.state';
import { selectUserDetails } from '../../auth/state/app.selector';
import { AuthResponse } from '../../login/model/auth-response.model';
import { Usuario } from '../../model/usuario';

@Injectable({ providedIn: 'root' })
export class UserService {
  
  
  private http = inject(HttpClient);
  private store = inject<Store<RootState>>(Store as any);
  private readonly base = environment.apiBaseUrl; // ex.: http://localhost:8080

getUserById(id: string): Observable<AuthResponse> {
  return this.http.get<AuthResponse>(this.url(`/api/user/${id}`));
}

  /** Helper para montar URLs sem // duplicado */
  private url(path: string): string {
    const b = this.base.endsWith('/') ? this.base.slice(0, -1) : this.base;
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${b}${p}`;
  }

  /** Troca a senha do usuário autenticado. PATCH /user/password */
  changePassword(oldPassword: string, newPassword: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/api/user/password`, { oldPassword, newPassword });
  }

  /** Usuário logado (direto da Store) */
  userLogado(): Observable<AuthResponse | null> {
    return this.store.select(selectUserDetails);
  }

  /** Resolve o empresaId do usuário logado (uma única vez) */
  private empresaId$(): Observable<number> {
    return this.store.select(selectUserDetails).pipe(
      take(1),
      map((u: AuthResponse | null) => {
        const id = u?.empresa?.id;
        if (id == null) {
          throw new Error('Dados do usuário ou empresa não encontrados');
        }
        return id;
      })
    );
  }

  /** Lista todos os usuários da empresa do usuário logado */
  getAllUsers(): Observable<any[]> {
    return this.empresaId$().pipe(
      switchMap((empresaId) =>
        this.http.get<any[]>(
          this.url(`/api/user/empresa/${empresaId}`)
          // , { withCredentials: true }
        )
      )
    );
  }

  /** (Opcional) Mesma consulta permitindo informar empresaId externamente */
  getAllUsersByEmpresa(empresaId?: number): Observable<any[]> {
    const source$ = empresaId != null ? of(empresaId) : this.empresaId$();
    return source$.pipe(
      switchMap((id) =>
        this.http.get<any[]>(
          this.url(`/api/user/empresa/${id}`)
          // , { withCredentials: true }
        )
      )
    );
  }

  /** Atualiza parcialmente (PATCH) nome e/ou email e retorna o usuário atualizado */
  updateUser(
    idUsuario: string,
    nomeUsuario?: string,
    emailUsuario?: string
  ): Observable<Usuario> {
    const body: Partial<Usuario> = {};
    if (nomeUsuario !== undefined) body.nome = nomeUsuario;
    if (emailUsuario !== undefined) body.email = emailUsuario;

    return this.http.patch<Usuario>(
      this.url(`/api/user/${idUsuario}`),
      body
      // , { withCredentials: true }
    );
  }

  
}
