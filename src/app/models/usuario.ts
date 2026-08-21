export type StatusUsuario = 'ATIVO' | 'INATIVO';

export interface Usuario {
  id: number;
  cpf: string;
  nome: string;
  email: string;
  telefone: string;
  statusUsuario: StatusUsuario;
}

export type UsuarioPayload = Omit<Usuario, 'id' | 'statusUsuario'>;
