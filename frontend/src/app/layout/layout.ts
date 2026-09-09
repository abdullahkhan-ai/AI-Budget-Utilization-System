import { CommonModule } from '@angular/common';

import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';

import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

import {
  Subscription,
} from 'rxjs';

import {
  AuthService,
  SystemStatus,
} from '../core/services/auth.service';


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
export class Layout
  implements OnInit, OnDestroy {


  private readonly authService =
    inject(AuthService);


  private readonly router =
    inject(Router);


  private statusSubscription:
    Subscription | null = null;


  user =
    this.authService.getUser();


  systemStatus:
    SystemStatus =
      this.authService.getSystemStatus();


  ngOnInit(): void {

    /*
     * Listen for status changes
     * from AuthService.
     */

    this.statusSubscription =
      this.authService
        .systemStatus$
        .subscribe((status) => {

          this.systemStatus =
            status;

        });


    /*
     * Check the current JWT session
     * when the layout starts.
     */

    this.checkSystemStatus();

  }


  ngOnDestroy(): void {

    this.statusSubscription?.unsubscribe();

  }


  /*
   * Browser reports that the computer
   * has lost network connectivity.
   */

  @HostListener(
    'window:offline'
  )
  handleOffline(): void {

    this.authService.setSystemStatus(
      'offline'
    );

  }


  /*
   * Browser reports that network
   * connectivity has returned.
   */

  @HostListener(
    'window:online'
  )
  handleOnline(): void {

    this.checkSystemStatus();

  }


  private checkSystemStatus(): void {

    if (!navigator.onLine) {

      this.authService.setSystemStatus(
        'offline'
      );

      return;

    }


    this.authService
      .checkSession()
      .subscribe((valid) => {

        if (!valid) {

          /*
           * If there is no valid session,
           * do not keep the authenticated
           * layout visible.
           */

          if (
            !this.authService.getToken()
          ) {

            this.router.navigate([
              '/login',
            ]);

          }

          return;

        }


        /*
         * Refresh the displayed user in
         * case the local session changed.
         */

        this.user =
          this.authService.getUser();

      });

  }


  logout(): void {

    this.authService.logout();

    this.router.navigate([
      '/login',
    ]);

  }

}