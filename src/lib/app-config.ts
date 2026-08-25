/**
 * Configurações globais não secretas do aplicativo.
 */
export const APP_CONFIG = {
  publicAppUrl: import.meta.env['VITE_PUBLIC_APP_URL'] || '',
};

const OFFICIAL_APP_URL = 'https://rota-promotor.vercel.app';

/**
 * Retorna a URL pública oficial configurada.
 * Lança erro se a URL não estiver definida, garantindo que convites não sejam enviados sem destino.
 */
export function getPublicAppUrl() {
  const serverUrl = typeof process !== 'undefined' ? process.env['PUBLIC_APP_URL'] : undefined;
  const url = serverUrl || APP_CONFIG.publicAppUrl;

  if (url !== OFFICIAL_APP_URL) {
    throw new Error('URL pública do aplicativo não configurada. Defina PUBLIC_APP_URL como https://rota-promotor.vercel.app no Vercel.');
  }

  return url.replace(/\/$/, '');
}
