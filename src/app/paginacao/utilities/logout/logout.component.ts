// src/app/auth/logout/logout.component.ts
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { logoutUser } from '../../../auth/state/app.action';
import { Router } from '@angular/router';

@Component({
  selector: 'app-logout',
  standalone: true,
  template: '' // nada pra renderizar
})
export class LogoutComponent implements OnInit {
  constructor(private store: Store, private router: Router) {}
  ngOnInit(): void {
   this.store.dispatch(logoutUser());
    this.router.navigateByUrl('/'); // ⬅️
  }
}
