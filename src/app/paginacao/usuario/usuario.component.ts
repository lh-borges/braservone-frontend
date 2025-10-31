import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../utilities/header/header.component';
import { MenuLateralComponent } from '../utilities/menu-lateral/menu-lateral.component';

import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, filter, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';

import { AuthResponse } from '../../login/model/auth-response.model';
import { RootState } from '../../auth/state/auth.state';
import { selectUserDetails } from '../../auth/state/app.selector';

import { UserService } from './user.service';
import { Usuario } from '../../model/usuario';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [
    HeaderComponent,
    MenuLateralComponent,
    NgIf,
    FormsModule
  ],
  templateUrl: './usuario.component.html',
  styleUrls: ['./usuario.component.css']
})
export class UsuarioComponent {

  private store = inject<Store<RootState>>(Store as any);
  private uService = inject(UserService);

  user!: Usuario;

  // Atualizar usuário
  loading = false;
  saveSuccess = false;
  saveError = '';

  // Trocar senha
  pwdLoading = false;
  pwdSuccess = false;
  pwdError = '';

  // forms de senha (template-driven)
  oldPassword: string = '';
  password: string = '';
  confirmPassword: string = '';

  userDetails$: Observable<AuthResponse | null> = this.store.select(selectUserDetails);

  constructor() {
    // Quando tiver username no store, busca o usuário na API e popula this.user
    this.store.select(selectUserDetails).pipe(
      map(v => v?.username ?? null),
      filter((username): username is string => !!username),
      distinctUntilChanged(),
      tap(() => { this.loading = true; this.saveError = ''; this.saveSuccess = false; }),
      switchMap(username => this.uService.getUserById(username)),
      tap(() => this.loading = false)
    ).subscribe({
      next: (userApi) => { this.user = userApi; },
      error: (err) => {
        this.loading = false;
        this.saveError = err?.error?.message ?? 'Falha ao carregar usuário';
      }
    });
  }

  updateUser(): void {
    if (!this.user) return;

    this.loading = true;
    this.saveSuccess = false;
    this.saveError = '';

    this.uService.updateUser(this.user.username, this.user.nome, this.user.email).subscribe({
      next: (res) => {
        this.user = res;
        this.loading = false;
        this.saveSuccess = true;
        setTimeout(() => (this.saveSuccess = false), 3000);
      },
      error: (err) => {
        this.loading = false;
        this.saveError = err?.error?.message ?? 'Erro ao atualizar usuário';
      },
    });
  }

  changePassword(): void {
    if (!this.password || !this.confirmPassword || this.password !== this.confirmPassword) return;

    this.pwdLoading = true;
    this.pwdSuccess = false;
    this.pwdError = '';

    this.uService.changePassword(this.oldPassword, this.password).subscribe({
      next: () => {
        this.pwdLoading = false;
        this.pwdSuccess = true;
        setTimeout(() => (this.pwdSuccess = false), 3000);
      },
      error: (err) => {
        this.pwdLoading = false;
        // mostra a mensagem vinda do body
        this.pwdError = err?.error?.message ?? 'Falha ao alterar senha';
      }
    });
  }
}