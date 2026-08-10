import { Livro } from './livro';
import { Usuario } from './usuario';

export type StatusEmprestimo = 'ATIVO' | 'CONCLUIDO';

export interface Emprestimo {
  id: number;
  livro: Livro;
  usuario: Usuario;
  dataEmprestimo: string;
  dataPrevistaDevolucao: string;
  dataDevolucao: string | null;
  statusEmprestimo: StatusEmprestimo;
}

export interface EmprestimoPayload {
  livroId: number;
  usuarioId: number;
  dataPrevistaDevolucao: string;
}

