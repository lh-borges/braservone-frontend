// src/app/paginacao/home/home.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MenuLateralComponent } from '../utilities/menu-lateral/menu-lateral.component';
import { HeaderComponent } from '../utilities/header/header.component';

import { RootState } from '../../auth/state/auth.state';
import { selectUserDetails } from '../../auth/state/app.selector';
import { AuthResponse } from '../../login/model/auth-response.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MenuLateralComponent, HeaderComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  private store = inject<Store<RootState>>(Store as any);

  // expõe para o template
  userDetails$: Observable<AuthResponse | null> = this.store.select(selectUserDetails);

  constructor() {
    // log (opcional) com unsubscribe automático
    this.userDetails$.pipe(takeUntilDestroyed()).subscribe(v => {
      console.log('userDetails', v);
    });
  }
}
