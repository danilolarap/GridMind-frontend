import { isAxiosError } from 'axios';

export function getErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string }>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message) return message;
    if (!error.response) return 'No se pudo conectar con el servidor. Verifica tu conexión.';
  }
  return fallback;
}
