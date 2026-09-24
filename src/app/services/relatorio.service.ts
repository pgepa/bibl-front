import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FiltrosRelatorio, RelatorioEmprestimoResponse } from '../models/relatorio';

@Injectable({
  providedIn: 'root'
})
export class RelatorioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/relatorios';

  gerarRelatorio(filtros?: FiltrosRelatorio): Observable<RelatorioEmprestimoResponse> {
    let params = new HttpParams();
    if (filtros?.usuarioId) {
      params = params.set('usuarioId', filtros.usuarioId.toString());
    }
    if (filtros?.dataInicio) {
      params = params.set('dataInicio', filtros.dataInicio);
    }
    if (filtros?.dataFim) {
      params = params.set('dataFim', filtros.dataFim);
    }
    if (filtros?.status) {
      params = params.set('status', filtros.status);
    }

    return this.http.get<RelatorioEmprestimoResponse>(`${this.apiUrl}/gerarRelatorio`, { params });
  }
}
