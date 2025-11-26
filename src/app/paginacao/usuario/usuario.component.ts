import { Component, inject, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../utilities/header/header.component';
import { MenuLateralComponent } from '../utilities/menu-lateral/menu-lateral.component';

import { Store } from '@ngrx/store';
import { switchMap, filter, take } from 'rxjs/operators';

import { RootState } from '../../auth/state/auth.state';
import { selectUserDetails } from '../../auth/state/app.selector';
import { UserService } from './user.service';
import { Usuario } from '../../model/usuario';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [HeaderComponent, MenuLateralComponent, NgIf, FormsModule],
  templateUrl: './usuario.component.html',
  styleUrls: ['./usuario.component.css']
})
export class UsuarioComponent implements OnInit {

  private store = inject<Store<RootState>>(Store as any);
  private uService = inject(UserService);

  // Objeto principal que será exibido no HTML
  user: Usuario | null = null;

  // Variáveis de controle de loading e erro
  loading = false;
  errorMsg = '';

  // Variáveis para atualização (mantidas caso queira usar depois)
  saveSuccess = false;
  
  // Variáveis de senha
  oldPassword = '';
  password = '';
  confirmPassword = '';
  pwdSuccess = false;
  pwdError = '';

  ngOnInit(): void {
    this.loading = true;

    // FLUXO PRINCIPAL: Store -> Service -> View
    this.store.select(selectUserDetails).pipe(
      // 1. Garante que temos um usuário logado na Store com username válido
      filter(auth => !!auth && !!auth.username), 
      // 2. Pega apenas o primeiro valor emitido (para não recarregar se a store mudar por outros motivos)
      take(1),
      // 3. Usa o username para buscar os dados completos no backend
      switchMap(auth => this.uService.getUserByUsername(auth!.username))
    ).subscribe({
      next: (dadosUsuario) => {
        this.user = dadosUsuario; // Popula o formulário
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao buscar usuário', err);
        this.errorMsg = 'Não foi possível carregar os dados do usuário.';
        this.loading = false;
      }
    });
  }

  updateUser(): void {
    if (!this.user?.username) return;

    this.uService.updateUser(this.user.username, this.user.nome, this.user.email)
      .subscribe({
        next: (res) => {
          this.user = res;
          this.saveSuccess = true;
          setTimeout(() => this.saveSuccess = false, 3000);
        },
        error: (err) => alert('Erro ao atualizar: ' + (err.error?.message || 'Erro desconhecido'))
      });
  }

  changePassword(): void {
    if (this.password !== this.confirmPassword) return;
    
    this.uService.changePassword(this.oldPassword, this.password).subscribe({
      next: () => {
        this.pwdSuccess = true;
        this.oldPassword = ''; this.password = ''; this.confirmPassword = '';
        setTimeout(() => this.pwdSuccess = false, 3000);
      },
      error: (err) => this.pwdError = err?.error?.message || 'Erro ao trocar senha'
    });
  }
}