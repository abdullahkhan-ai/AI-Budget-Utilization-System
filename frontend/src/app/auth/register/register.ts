import {
  Component,
  inject,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';


@Component({
  selector: 'app-register',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
  ],

  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

  private readonly authService =
    inject(AuthService);

  readonly router =
    inject(Router);


  /*
   * ================================
   * FORM FIELDS
   * ================================
   */

  name = '';

  email = '';

  password = '';

  confirmPassword = '';

  role = '';


  /*
   * ================================
   * PUBLIC ROLES
   * ================================
   *
   * Admin is NOT available
   * through public registration.
   */

  readonly roles = [
    'Finance Officer',
    'Department Head',
  ];


  /*
   * ================================
   * UI STATE
   * ================================
   */

  loading = false;

  errorMessage = '';

  successMessage = '';


  /*
   * ================================
   * REGISTER
   * ================================
   */

  register(): void {

    this.errorMessage = '';

    this.successMessage = '';


    /*
     * BASIC VALIDATION
     */

    if (
      !this.name.trim() ||
      !this.email.trim() ||
      !this.password ||
      !this.confirmPassword ||
      !this.role
    ) {

      this.errorMessage =
        'Please fill in all required fields.';

      return;

    }


    /*
     * VALID ROLE
     */

    if (
      !this.roles.includes(this.role)
    ) {

      this.errorMessage =
        'Please select a valid role.';

      return;

    }


    /*
     * PASSWORD MATCH
     */

    if (
      this.password !==
      this.confirmPassword
    ) {

      this.errorMessage =
        'Passwords do not match.';

      return;

    }


    /*
     * PASSWORD LENGTH
     */

    if (
      this.password.length < 6
    ) {

      this.errorMessage =
        'Password must be at least 6 characters.';

      return;

    }


    /*
     * START REGISTRATION
     */

    this.loading = true;


    /*
     * IMPORTANT:
     *
     * No departmentId is sent.
     *
     * Public registration now sends
     * only:
     *
     * name
     * email
     * password
     * role
     */

    this.authService
      .register(
        this.name.trim(),
        this.email.trim().toLowerCase(),
        this.password,
        this.role
      )
      .subscribe({

        /*
         * SUCCESS
         */

        next: () => {

          this.loading = false;

          this.successMessage =
            'Account created successfully.';


          setTimeout(() => {

            this.router.navigate([
              '/dashboard',
            ]);

          }, 500);

        },


        /*
         * ERROR
         */

        error: (error) => {

          this.loading = false;

          this.errorMessage =
            error?.error?.message ||
            'Registration failed. Please try again.';

        },

      });

  }


  /*
   * ================================
   * BACK TO LOGIN
   * ================================
   */

  goToLogin(): void {

    this.router.navigate([
      '/login',
    ]);

  }

}