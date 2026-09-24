export type StatusUsuario = 'ATIVO' | 'INATIVO';
export type TipoUsuario = 'ROLE_ADMIN' | 'ROLE_USUARIO';

export interface Usuario {
  id: number;
  cpf: string;
  nome: string;
  email: string;
  telefone: string;
  matricula?: string;
  setor?: string;
  statusUsuario: StatusUsuario;
  tipoUsuario?: TipoUsuario;
}

export type UsuarioPayload = Omit<Usuario, 'id' | 'statusUsuario'> & {
  senha?: string;
};
