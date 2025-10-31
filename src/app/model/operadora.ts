export interface Operadora {
  id: number;
  nome: string;
  siglas: string;
  pais: string;
  endereco: Endereco | null;
  emailContato: string;
  telefoneContato: string;
  responsaveltecnico: string;
  ativo: boolean;
}

export interface Endereco {
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
}