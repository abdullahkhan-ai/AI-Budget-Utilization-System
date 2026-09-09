import { Injectable, inject } from '@angular/core';

import {
  HttpClient,
} from '@angular/common/http';

import {
  BehaviorSubject,
  Observable,
  catchError,
  map,
  of,
  tap,
  throwError,
} from 'rxjs';


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


export type SystemStatus =
  | 'online'
  | 'offline';


@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly http =
    inject(HttpClient);


  private readonly apiUrl =
    'https://ai-budget-utilization-system.onrender.com/api/auth';


  /*
   * SYSTEM STATUS
   *
   * online  = network available + valid session
   * offline = no network OR invalid/expired session
   */

  private readonly systemStatusSubject =
    new BehaviorSubject<SystemStatus>(
      this.getInitialSystemStatus()
    );


  readonly systemStatus$ =
    this.systemStatusSubject.asObservable();


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

          localStorage.setItem(
            'token',
            response.token
          );

          localStorage.setItem(
            'user',
            JSON.stringify(response.user)
          );

          this.setSystemStatus(
            'online'
          );

        })

      );

  }


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

          localStorage.setItem(
            'token',
            response.token
          );

          localStorage.setItem(
            'user',
            JSON.stringify(response.user)
          );

          this.setSystemStatus(
            'online'
          );

        })

      );

  }


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


  getToken(): string | null {

    return localStorage.getItem(
      'token'
    );

  }


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


  isLoggedIn(): boolean {

    return !!this.getToken();

  }


  getRole(): string | null {

    return (
      this.getUser()?.role ??
      null
    );

  }


  getSystemStatus():
    SystemStatus {

    return this.systemStatusSubject.value;

  }


  /*
   * Called by Layout when the application
   * starts and whenever the browser comes
   * back online.
   *
   * The dashboard endpoint is protected,
   * so a 401 means the JWT session is no
   * longer valid.
   */

  checkSession(): Observable<boolean> {

    if (!navigator.onLine) {

      this.setSystemStatus(
        'offline'
      );

      return of(false);

    }


    const token =
      this.getToken();


    if (!token) {

      this.setSystemStatus(
        'offline'
      );

      return of(false);

    }


    return this.http
      .get(
        'https://ai-budget-utilization-system.onrender.com/api/dashboard'
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
           * 401 = expired/invalid JWT
           */

          if (
            error?.status === 401
          ) {

            this.logout();

            return of(false);

          }


          /*
           * Network/server unavailable
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
           * A server error does not
           * automatically mean the
           * session is expired.
           *
           * The browser still has
           * network connectivity.
           */

          this.setSystemStatus(
            'online'
          );

          return of(true);

        })

      );

  }


  setSystemStatus(
    status: SystemStatus
  ): void {

    this.systemStatusSubject.next(
      status
    );

  }


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