import { Livro } from './livro';
import { Usuario } from './usuario';

export type StatusEmprestimo = 'ATIVO' | 'CONCLUIDO' | 'ATRASADO';

export interface Emprestimo {
  id: number;
  livro: Livro;
  usuario: Usuario;
  dataEmprestimo: string;
  dataPrevistaDevolucao: string;
  dataDevolucao: string | null;
  statusEmprestimo: StatusEmprestimo;
  quantidadeRenovacaoEmprestimo?: number;
  idTransacao?: string;
  nomeFuncionario?: string;
}

export interface EmprestimoPayload {
  livroId?: number;
  livroIds?: number[];
  usuarioId: number;
  dataPrevistaDevolucao: string;
  nomeFuncionario?: string;
}

