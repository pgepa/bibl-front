import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Livro, LivroPayload } from '../models/livro';

@Injectable({ providedIn: 'root' })
export class LivroService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/livros`;

  listar(): Observable<Livro[]> {
    return this.http.get<Livro[]>(this.baseUrl);
  }

  buscar(id: number): Observable<Livro> {
    return this.http.get<Livro>(`${this.baseUrl}/${id}`);
  }

  cadastrar(payload: LivroPayload): Observable<Livro> {
    return this.http.post<Livro>(this.baseUrl, payload);
  }

  atualizar(id: number, payload: LivroPayload): Observable<Livro> {
    return this.http.put<Livro>(`${this.baseUrl}/${id}`, payload);
  }

  remover(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
