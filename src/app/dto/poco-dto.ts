// src/app/dto/poco-dto.ts
export interface PocoDTO {
  codANP: string;       // o back devolve assim no DTO
  bacia?: string;
  status?: string;
  fluido?: string;
  nomeCampo?: string;
  local?: string;
  latitude?: number | null;
  longitude?: number | null;
}
