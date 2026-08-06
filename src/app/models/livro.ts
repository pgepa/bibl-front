export interface Livro {
  id: number;
  titulo: string;
  autor: string;
  isbn: string;
  anoLancamento: number;
  disponivel: boolean;
}

export type LivroPayload = Omit<Livro, 'id' | 'disponivel'>;
