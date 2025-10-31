// src/app/paginacao/utilities/header/header.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,                         // ✅ standalone
  imports: [CommonModule, RouterModule],    // ✅ preciso para [routerLink]
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']     // ✅ plural
})
export class HeaderComponent {}
