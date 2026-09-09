import { CommonModule } from '@angular/common';

import {
  Component,
  inject,
} from '@angular/core';

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
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],

  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {

  private readonly authService =
    inject(AuthService);

  private readonly router =
    inject(Router);


  user =
    this.authService.getUser();


  logoutModalOpen = false;


  systemStatus:
    | 'online'
    | 'offline' =
    'online';


  constructor() {

    this.checkSystemStatus();

    window.addEventListener(
      'online',
      () => {
        this.systemStatus = 'online';
      }
    );

    window.addEventListener(
      'offline',
      () => {
        this.systemStatus = 'offline';
      }
    );
  }


  /*
   * =========================
   * LOGOUT MODAL
   * =========================
   */

  logout(): void {

    this.logoutModalOpen = true;
  }


  cancelLogout(): void {

    this.logoutModalOpen = false;
  }


  confirmLogout(): void {

    this.logoutModalOpen = false;

    this.authService.logout();

    this.router.navigate([
      '/login',
    ]);
  }


  /*
   * =========================
   * SYSTEM STATUS
   * =========================
   */

  private checkSystemStatus(): void {

    this.systemStatus =
      navigator.onLine
        ? 'online'
        : 'offline';
  }

}