import { TipoUsuario } from './usuario';

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface AuthResponse {
  token: string;
  id: number;
  nome: string;
  email: string;
  matricula?: string;
  setor?: string;
  tipoUsuario: TipoUsuario;
}

export interface UsuarioLogado {
  id: number;
  nome: string;
  email: string;
  matricula?: string;
  setor?: string;
  tipoUsuario: TipoUsuario;
}
