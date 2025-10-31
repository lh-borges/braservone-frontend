export interface Endereco {
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null; // UF (2 chars)
  cep: string | null;
}