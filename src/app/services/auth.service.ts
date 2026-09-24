import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, UsuarioLogado } from '../models/auth';

const TOKEN_KEY = 'bibl_auth_token';
const USER_KEY = 'bibl_auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _currentUser = signal<UsuarioLogado | null>(this.obterUsuarioSalvo());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);
  readonly isAdmin = computed(() => this._currentUser()?.tipoUsuario === 'ROLE_ADMIN');

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/login', credentials).pipe(
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.token);
        const user: UsuarioLogado = {
          id: res.id,
          nome: res.nome,
          email: res.email,
          matricula: res.matricula,
          setor: res.setor,
          tipoUsuario: res.tipoUsuario,
        };
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this._currentUser.set(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private obterUsuarioSalvo(): UsuarioLogado | null {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
}
