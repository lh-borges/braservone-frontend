// src/app/model/api-error.model.ts
export interface ApiError {
  message: string;
  status: number;
}

export function normalizeApiError(err: any): ApiError {
  const status = err?.status ?? 0;
  const body = err?.error ?? err;

  const message =
    body?.mensage ??        // ← back padronizado PT-BR
    body?.message ??        // ← fallback comum
    err?.message ??         // ← HttpErrorResponse.message
    'Erro ao processar a requisição.';

  return { message: String(message), status: Number(status) };
}
