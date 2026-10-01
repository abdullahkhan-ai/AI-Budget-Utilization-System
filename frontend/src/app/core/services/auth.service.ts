import { Injectable, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import {
  BehaviorSubject,
  Observable,
  catchError,
  map,
  of,
  tap,
} from 'rxjs';


/*
 * =========================================
 * LOGIN RESPONSE
 * =========================================
 */

interface LoginResponse {

  message: string;

  user: {

    id: string;

    name: string;

    email: string;

    role: string;

    departmentId: string | null;

  };

  token: string;

}


/*
 * =========================================
 * REGISTER RESPONSE
 * =========================================
 */

interface RegisterResponse {

  message: string;

  user: {

    id: string;

    name: string;

    email: string;

    role: string;

    departmentId: string | null;

  };

  token: string;

}


/*
 * =========================================
 * SYSTEM STATUS
 * =========================================
 */

export type SystemStatus =
  | 'online'
  | 'offline';


/*
 * =========================================
 * AUTH SERVICE
 * =========================================
 */

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly http =
    inject(HttpClient);


  /*
   * =========================================
   * API URLS
   * =========================================
   */

  private readonly apiUrl =
    'https://ai-budget-utilization-system.onrender.com/api/auth';

  private readonly healthUrl =
    'https://ai-budget-utilization-system.onrender.com/api/health';

  private readonly dashboardUrl =
    'https://ai-budget-utilization-system.onrender.com/api/dashboard';


  /*
   * =========================================
   * SYSTEM STATUS
   * =========================================
   */

  private readonly systemStatusSubject =
    new BehaviorSubject<SystemStatus>(
      this.getInitialSystemStatus()
    );


  readonly systemStatus$ =
    this.systemStatusSubject.asObservable();


  /*
   * =========================================
   * LOGIN
   * =========================================
   */

  login(
    email: string,
    password: string
  ): Observable<LoginResponse> {

    return this.http
      .post<LoginResponse>(
        `${this.apiUrl}/login`,
        {
          email,
          password,
        }
      )
      .pipe(

        tap((response) => {

          /*
           * Save JWT
           */

          localStorage.setItem(
            'token',
            response.token
          );


          /*
           * Save user information
           */

          localStorage.setItem(
            'user',
            JSON.stringify(response.user)
          );


          /*
           * System is online
           */

          this.setSystemStatus(
            'online'
          );

        })

      );

  }


  /*
   * =========================================
   * REGISTER
   * =========================================
   *
   * PUBLIC REGISTRATION
   *
   * Allowed roles:
   *
   * Finance Officer
   * Department Head
   *
   * Admin is NOT created from the
   * public registration page.
   *
   * No department-loading request
   * happens here.
   * =========================================
   */

  register(
    name: string,
    email: string,
    password: string,
    role: string,
    departmentId: string | null = null
  ): Observable<RegisterResponse> {

    return this.http
      .post<RegisterResponse>(
        `${this.apiUrl}/register`,
        {
          name,
          email,
          password,
          role,
          departmentId,
        }
      )
      .pipe(

        tap((response) => {

          /*
           * Save JWT
           */

          localStorage.setItem(
            'token',
            response.token
          );


          /*
           * Save user
           */

          localStorage.setItem(
            'user',
            JSON.stringify(response.user)
          );


          /*
           * System is online
           */

          this.setSystemStatus(
            'online'
          );

        })

      );

  }


  /*
   * =========================================
   * HEALTH CHECK
   * =========================================
   *
   * Used to wake the Render backend
   * when the login page opens.
   * =========================================
   */

  healthCheck(): Observable<boolean> {

    return this.http
      .get<{ status: string }>(
        this.healthUrl
      )
      .pipe(

        map((response) => {

          const isHealthy =
            response?.status === 'ok';


          if (isHealthy) {

            this.setSystemStatus(
              'online'
            );

          }


          return isHealthy;

        }),


        catchError(() => {

          this.setSystemStatus(
            'offline'
          );

          return of(false);

        })

      );

  }


  /*
   * =========================================
   * LOGOUT
   * =========================================
   */

  logout(): void {

    localStorage.removeItem(
      'token'
    );

    localStorage.removeItem(
      'user'
    );


    this.setSystemStatus(
      'offline'
    );

  }


  /*
   * =========================================
   * GET TOKEN
   * =========================================
   */

  getToken(): string | null {

    return localStorage.getItem(
      'token'
    );

  }


  /*
   * =========================================
   * GET USER
   * =========================================
   */

  getUser():
    LoginResponse['user'] | null {

    const user =
      localStorage.getItem(
        'user'
      );


    if (!user) {

      return null;

    }


    try {

      return JSON.parse(
        user
      );

    } catch {

      return null;

    }

  }


  /*
   * =========================================
   * CHECK LOGIN
   * =========================================
   */

  isLoggedIn(): boolean {

    return !!this.getToken();

  }


  /*
   * =========================================
   * GET ROLE
   * =========================================
   */

  getRole(): string | null {

    return (
      this.getUser()?.role ??
      null
    );

  }


  /*
   * =========================================
   * GET SYSTEM STATUS
   * =========================================
   */

  getSystemStatus():
    SystemStatus {

    return this.systemStatusSubject.value;

  }


  /*
   * =========================================
   * CHECK SESSION
   * =========================================
   *
   * Checks whether the stored JWT
   * is still valid.
   * =========================================
   */

  checkSession(): Observable<boolean> {

    /*
     * Browser has no internet
     */

    if (!navigator.onLine) {

      this.setSystemStatus(
        'offline'
      );

      return of(false);

    }


    /*
     * No JWT
     */

    const token =
      this.getToken();


    if (!token) {

      this.setSystemStatus(
        'offline'
      );

      return of(false);

    }


    /*
     * Check protected dashboard
     */

    return this.http
      .get(
        this.dashboardUrl
      )
      .pipe(

        map(() => {

          this.setSystemStatus(
            'online'
          );

          return true;

        }),


        catchError((error) => {

          /*
           * 401 means JWT is invalid
           * or expired.
           */

          if (
            error?.status === 401
          ) {

            this.logout();

            return of(false);

          }


          /*
           * Network unavailable
           */

          if (
            error?.status === 0
          ) {

            this.setSystemStatus(
              'offline'
            );

            return of(false);

          }


          /*
           * Server error does not
           * automatically mean that
           * the JWT is invalid.
           */

          this.setSystemStatus(
            'online'
          );

          return of(true);

        })

      );

  }


  /*
   * =========================================
   * SET SYSTEM STATUS
   * =========================================
   */

  setSystemStatus(
    status: SystemStatus
  ): void {

    this.systemStatusSubject.next(
      status
    );

  }


  /*
   * =========================================
   * INITIAL SYSTEM STATUS
   * =========================================
   */

  private getInitialSystemStatus():
    SystemStatus {

    if (
      !navigator.onLine ||
      !this.getToken()
    ) {

      return 'offline';

    }


    return 'online';

  }

}