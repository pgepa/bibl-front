export interface Usuario {
  id: number;
  cpf: string;
  nome: string;
  email: string;
  telefone: string;
}

export type UsuarioPayload = Omit<Usuario, 'id'>;
