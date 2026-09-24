export interface Livro {
  id: number;
  titulo: string;
  autor: string;
  isbn?: string;
  anoLancamento: number;
  disponivel: boolean;
  registro?: string;
  classificacao?: string;
  tipoDocumental?: string;
  localPublicacao?: string;
  editora?: string;
  edicao?: number;
  idioma?: string;
  paginas?: number;
  descritores?: string;
}

export type LivroPayload = Omit<Livro, 'id' | 'disponivel'>;
