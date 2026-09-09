import { Component, inject } from '@angular/core';

import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,

  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],

  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  user = this.authService.getUser();

  logout(): void {
    this.authService.logout();

    this.router.navigate(['/login']);
  }
}