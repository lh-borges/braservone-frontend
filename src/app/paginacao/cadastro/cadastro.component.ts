import { Component, inject } from '@angular/core';
import { MenuLateralComponent } from '../utilities/menu-lateral/menu-lateral.component';
import { HeaderComponent } from '../utilities/header/header.component';
import { AuthState } from '../../auth/state/auth.state';
import { Store } from '@ngrx/store';
import { FormBuilder } from '@angular/forms';
import { UserService } from '../usuario/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cadastro',
  imports: [MenuLateralComponent,HeaderComponent,CommonModule],
  templateUrl: './cadastro.component.html',
  styleUrl: './cadastro.component.css'
})
export class CadastroComponent {
  users:any[] = [];

  private userService = inject(UserService);

  constructor(private store: Store<AuthState>,private fb: FormBuilder,){

  }

  ngOnInit() {
    this.userService.getAllUsers().subscribe(users => {
      this.users = users;
      console.log(this.users);
    });
  }

}
