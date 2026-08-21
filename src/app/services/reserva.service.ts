import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Reserva, ReservaRequest } from '../models/reserva';

@Injectable({
  providedIn: 'root'
})
export class ReservaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/reservas';

  listarTodas(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(this.apiUrl);
  }

  fazerReserva(payload: ReservaRequest): Observable<Reserva> {
    return this.http.post<Reserva>(this.apiUrl, payload);
  }
}
