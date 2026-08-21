import { Usuario } from './usuario';
import { Livro } from './livro';

export type StatusReserva = 'AGUARDANDO' | 'CONCLUIDA' | 'CANCELADO';

export interface Reserva {
  id: number;
  usuario: Usuario;
  livro: Livro;
  data: string;
  statusReserva: StatusReserva;
}

export interface ReservaRequest {
  idUsuario: number;
  idLivro: number;
  data: string;
}
