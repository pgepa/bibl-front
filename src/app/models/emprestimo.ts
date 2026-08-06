import { Livro } from './livro';
import { Usuario } from './usuario';

export type StatusEmprestimo = 'ATIVO' | 'DEVOLVIDO';

export interface Emprestimo {
  id: number;
  livro: Livro;
  usuario: Usuario;
  dataEmprestimo: string;
  dataDevolucao: string | null;
  statusEmprestimo: StatusEmprestimo;
}

export interface EmprestimoPayload {
  livroId: number;
  usuarioId: number;
}
