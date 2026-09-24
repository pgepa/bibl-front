import { StatusEmprestimo } from './emprestimo';

export interface ItemRelatorioEmprestimo {
  id: number;
  idTransacao?: string;
  livroId?: number;
  livroTitulo: string;
  livroRegistro?: string;
  livroAutor: string;
  usuarioId?: number;
  usuarioNome: string;
  usuarioMatricula?: string;
  usuarioSetor?: string;
  usuarioCpf?: string;
  dataEmprestimo: string;
  dataPrevistaDevolucao: string;
  dataDevolucao?: string | null;
  statusEmprestimo: StatusEmprestimo;
  quantidadeRenovacoes: number;
  nomeFuncionario?: string;
}

export interface ResumoUsuarioRelatorio {
  usuarioId: number;
  nome: string;
  matricula?: string;
  setor?: string;
  quantidadeEmprestimos: number;
}

export interface ResumoLivroRelatorio {
  livroId: number;
  titulo: string;
  registro?: string;
  autor: string;
  quantidadeEmprestimos: number;
}

export interface RelatorioEmprestimoResponse {
  emprestimosTotais: number;
  emprestimosAtivos: number;
  emprestimosConcluidos: number;
  emprestimosAtrasados: number;
  totalUsuariosAtendidos: number;
  totalObrasDistintas: number;
  dataInicio?: string | null;
  dataFim?: string | null;
  usuarioIdFiltro?: number | null;
  usuarioNomeFiltro?: string | null;
  itens: ItemRelatorioEmprestimo[];
  rankingUsuarios: ResumoUsuarioRelatorio[];
  rankingLivros: ResumoLivroRelatorio[];
}

export interface FiltrosRelatorio {
  usuarioId?: number | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  status?: StatusEmprestimo | null;
}
