// src/app/model/poco.ts
export interface Poco {
  codigoAnp: string;

  /**
   * Mapeia diretamente o enum TipoPoco do backend:
   * POCO_EXPLORATORIO_PIONEIRO, POCO_EXPLORATORIO_ESTRATIGRAFICO, ...
   */
  tipoPoco?: string; // obrigatório na criação/edição; opcional aqui p/ não quebrar dados antigos

  // campos do modelo enxuto
  nomeCampo?: string;
  bacia?: string;        // enum Bacia no back
  status?: string;       // enum StatusPoco
  fluido?: string;       // enum TipoFluido
  local?: string;

  latitude?: number | null;
  longitude?: number | null;
}
