
export interface Empresa {
    id: number;
    nome: string;
    cpnj: string;
  }
  
  export interface AuthResponse {
    token: string;
    nome:string;
    type: string;
    username: string;
    email: string;
    empresa: Empresa;
    roles: string[];
    tokenType: string;
    accessToken: string;
  }