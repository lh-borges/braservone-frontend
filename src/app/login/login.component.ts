// login.component.ts
import { Component, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

import { RootState } from '../auth/state/auth.state';          // <<< ajuste aqui
import { loginStart } from '../auth/state/app.action';
import { selectAuthLoading, selectAuthError } from '../auth/state/app.selector';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [ReactiveFormsModule, CommonModule]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private store = inject<Store<RootState>>(Store as any);      // <<< ajuste aqui

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-zA-Z0-9]+$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // Estado vindo da Store
  loading$: Observable<boolean> = this.store.select(selectAuthLoading);
  error$: Observable<any> = this.store.select(selectAuthError);

  fazerLogin() {
    if (this.loginForm.invalid) return;
    const { username, password } = this.loginForm.value;
    this.store.dispatch(loginStart({ username, password }));
  }

  get username() { return this.loginForm.get('username'); }
  get password() { return this.loginForm.get('password'); }
}
