import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, tap } from 'rxjs';

import { AuthREsponse } from '@auth/interfaces/auth-response.interface';
import { User } from '@auth/interfaces/user.interface';
import { environment } from 'src/environments/environment';


type AuthStatus = 'checking' | 'authenticated' | 'not-authenticated';
const baseUrl = environment.baseUrl;

@Injectable({ providedIn: 'root' })
export class AuthService {



  private _authStatus = signal<AuthStatus>('checking');

  private _user = signal<User | null>(null);

  private _token = signal<string | null>(localStorage.getItem('token'));

  // inject los usamos para injectar dependencias y no usamos el constructor.
  private http = inject(HttpClient);

  checkStatusResource = rxResource({
    loader: () => this.checkStatus(),
  })

  // getter en angular usamos computed
  authStatus = computed<AuthStatus>(() => {
    if (this._authStatus() === 'checking') {
      return 'checking';
    }

    if (this._user()) {
      return 'authenticated';
    }

    return 'not-authenticated';
  });


  user = computed<User | null>(() => this._user());
  token = computed<string | null>(() => this._token());
  // reactivo, se actualiza cuando cambia el valor de _user
  isAdmin = computed<boolean>(() => this._user()?.roles.includes('admin') ?? false);

  login(email: string, password: string): Observable<boolean> {
    return this.http.post<AuthREsponse>(`${baseUrl}/auth/login`,
      {
        email,
        password,
      }
    ).pipe(
      map((resp) => this.handleAuthSuccess(resp)),
      catchError((err: any) => this.handleAuthError(err))
    );
  }

  register (email: string, fullName: string, password: string ): Observable<boolean>  {
    return this.http.post<AuthREsponse>(`${baseUrl}/auth/register`, {
      email,
      fullName,
      password,

    }).pipe(
      map((resp) => this.handleAuthSuccess(resp)),
      catchError((err: any) => this.handleAuthError(err))
    )
  }

   // TODO: podemos implementar un caché
  checkStatus(): Observable<boolean> {

    const token = localStorage.getItem('token');
    if (!token) {
      this.logout();
      return of(false);
    }
    return this.http.get<AuthREsponse>(`${baseUrl}/auth/check-status`, {
      // headers: {
      //   Authorization: `Bearer ${token}`, // se pasa con interceptor
      // }
    }).pipe(
      map((resp) => this.handleAuthSuccess(resp)),
      catchError((err: any) => this.handleAuthError(err))
    )
  }

  logout() {
    this._user.set(null);
    this._token.set(null);
    this._authStatus.set('not-authenticated');
    localStorage.removeItem('token');
  }

  private handleAuthSuccess({ token, user }: AuthREsponse) {

    this._user.set(user);
    this._authStatus.set('authenticated');
    this._token.set(token);

    localStorage.setItem('token', token);
    return true;
  }

  private handleAuthError(err: any) {
    this.logout();
    return of(false);
  }

}
