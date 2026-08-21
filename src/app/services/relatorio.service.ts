import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RelatorioEmprestimoResponse } from '../models/relatorio';

@Injectable({
  providedIn: 'root'
})
export class RelatorioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/relatorios';

  gerarRelatorio(): Observable<RelatorioEmprestimoResponse> {
    return this.http.get<RelatorioEmprestimoResponse>(`${this.apiUrl}/gerarRelatorio`);
  }
}
