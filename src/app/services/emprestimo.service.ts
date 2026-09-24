import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Emprestimo, EmprestimoPayload } from '../models/emprestimo';

@Injectable({ providedIn: 'root' })
export class EmprestimoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/emprestimos`;

  listar(): Observable<Emprestimo[]> {
    return this.http.get<Emprestimo[]>(this.baseUrl);
  }

  buscar(id: number): Observable<Emprestimo> {
    return this.http.get<Emprestimo>(`${this.baseUrl}/${id}`);
  }

  realizar(payload: EmprestimoPayload): Observable<Emprestimo> {
    return this.http.post<Emprestimo>(this.baseUrl, payload);
  }

  realizarLote(payload: EmprestimoPayload): Observable<Emprestimo[]> {
    return this.http.post<Emprestimo[]>(`${this.baseUrl}/lote`, payload);
  }

  devolver(id: number): Observable<Emprestimo> {
    return this.http.patch<Emprestimo>(`${this.baseUrl}/${id}/devolver`, {});
  }

  renovar(id: number): Observable<Emprestimo> {
    return this.http.patch<Emprestimo>(`${this.baseUrl}/${id}/renovar`, {});
  }
}
