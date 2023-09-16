import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal, OnInit } from '@angular/core';
import { Observable, catchError, delay, map, of, tap, throwError } from 'rxjs';
import { environments } from 'src/environments/environments';
import { AuthStatus, CheckTokenResponse, LoginResponse, User } from '../interfaces';
import { RegisterResponse } from '../interfaces/register-response.interface';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService{


  private readonly baseUrl: string = environments.baseUrl;
  private http = inject (HttpClient);

  private _currentUser = signal<User|null>(null);
  private _authStatus = signal<AuthStatus>(AuthStatus.checking);

  public currentUser = computed ( () => this._currentUser());
  public authStatus = computed ( () => this._authStatus());

  constructor(public route: ActivatedRoute) {
    this.checkAuthStatus().subscribe()
  }



  private setAuthentication(user: User, token: string): boolean {
    this._currentUser.set(user);
    this._authStatus.set( AuthStatus.authenticated);
    localStorage.setItem('token', token);

    return true;
  }

  login( email: string, password: string): Observable<boolean> {

    const url = `${this.baseUrl}/login`;
    const body = { email: email, password: password}
    // const body = { email, password}

    return this.http.post<LoginResponse>(url, body)
      .pipe(
        map( ({user, token}) => this.setAuthentication(user, token)),
        catchError( err => {
          return throwError( () => err.error.message)
        })
      )

    // return of(true);
  }

  register(nombre: string, email: string, password: string) {
    const url = `${this.baseUrl}/register`;
    const body = {name: nombre, email: email, password: password}

    return this.http.post<RegisterResponse>(url, body)
      .pipe(
        catchError( err => {
          return throwError( () => err.error.message)
        })
      )
  }

  checkAuthStatus(): Observable<boolean> {
    const url = `${this.baseUrl}/check-token`;
    const token = localStorage.getItem('token');

    if(!token) {
      this.logout();
      return of(false);
    }

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`);

    return this.http.get<CheckTokenResponse>(url, {headers: headers})
      .pipe(

        map(({token, user}) => this.setAuthentication(user, token)),
        catchError(() => {
          this._authStatus.set(AuthStatus.notAuthenticated);
          return of(false);
        })
      )

  }


  logout() {
    localStorage.removeItem('token');
    this._currentUser.set(null);
    this._authStatus.set( AuthStatus.notAuthenticated );
  }
}
