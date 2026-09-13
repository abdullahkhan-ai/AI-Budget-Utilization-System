import {
  Component,
  inject,
  OnInit,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';


@Component({
  selector: 'app-login',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
  ],

  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {

  private readonly authService =
    inject(AuthService);

  private readonly router =
    inject(Router);


  email = '';

  password = '';


  loading = false;

  errorMessage = '';


  /*
   * Warm up the Render backend as soon
   * as the login page is opened.
   *
   * This runs independently from the
   * actual login request.
   */

  ngOnInit(): void {

    this.authService
      .healthCheck()
      .subscribe();

  }


  login(): void {

    this.errorMessage = '';


    if (
      !this.email ||
      !this.password
    ) {

      this.errorMessage =
        'Email and password are required.';

      return;

    }


    this.loading = true;


    this.authService
      .login(
        this.email,
        this.password
      )
      .subscribe({

        next: () => {

          this.loading = false;

          this.router.navigate([
            '/dashboard',
          ]);

        },


        error: (error) => {

          this.loading = false;


          this.errorMessage =
            error?.error?.message ||
            'Login failed. Please check your credentials.';

        },

      });

  }

}