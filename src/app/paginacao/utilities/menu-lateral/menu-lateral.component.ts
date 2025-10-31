// src/app/menu-lateral/menu-lateral.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-menu-lateral',
  standalone: true,                                    // ✅ standalone
  imports: [CommonModule, RouterModule],               // ✅ necessários para routerLink e diretivas comuns
  templateUrl: './menu-lateral.component.html',
  styleUrls: ['./menu-lateral.component.css']          // ✅ plural
})
export class MenuLateralComponent {

  expanded = {
    operacoes: true,
    cimentacao: true,
    transporte: true,
  };

  toggle(key: keyof typeof this.expanded) {
    this.expanded[key] = !this.expanded[key];
    // opcional: persistir no localStorage
    // localStorage.setItem('menu-expanded', JSON.stringify(this.expanded));
  }
}
