export interface OperacaoDTO {
  id: number;
  pocoCodigoAnp: string;
  nomeOperacao: string;
  operadoraId: number;
  operadoraNome: string;
  status: boolean;
  dataInicio?: string; // ISO
  dataFinal?: string;  // ISO
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // página atual (0-based)
}