export interface OperadoraDTO {
  id?: number;
  nome: string;
  emailContato?: string;
  telefoneContato?: string;
  responsaveltecnico?: string;
  ativo?: boolean;
  empresaId?: number; // o backend seta pela Auth, mas deixo aqui se precisar
}
