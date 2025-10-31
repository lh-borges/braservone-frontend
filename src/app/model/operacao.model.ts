export interface OperacaoDTO {
  id?: number;
  nomeOperacao: string;
  // duas formas de enviar o Poço:
  // 1) pelo código ANP (quando o PK do Poço é o código ANP no back)
  pocoCodigoAnp?: string;

  // 2) pelo id do Poço (se tiver id numérico no back)
  pocoId?: number;

  // retorno expandido (opcional)
  poco?: {
    codigoAnp?: string;
    id?: number;
    // adicione outros campos se quiser exibir no card
  };
}
