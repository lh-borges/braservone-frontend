export interface Poco {
  codigoAnp: string;

  // campos do modelo enxuto
  nomeCampo?: string;
  bacia?: string;        // ou enum 'Bacia' se você tipar
  status?: string;       // ou enum 'StatusPoco'
  fluido?: string;       // ou enum 'TipoFluido'
  local?: string;

  // use number ou string conforme sua preferência; se vier BigDecimal no back, mantenha number no front
  latitude?: number | null;
  longitude?: number | null;
}