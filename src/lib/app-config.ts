/**
 * Configurações globais não secretas do aplicativo.
 */
const OFFICIAL_APP_URL = 'https://rota-promotor.vercel.app';

/**
 * Retorna a URL pública oficial configurada.
 * Lança erro se a URL não estiver definida, garantindo que convites não sejam enviados sem destino.
 */
export function getPublicAppUrl() {
  const url = process.env['PUBLIC_APP_URL']?.trim().replace(/\/$/, '');

  if (url !== OFFICIAL_APP_URL) {
    throw new Error('URL pública do aplicativo não configurada. Defina PUBLIC_APP_URL como https://rota-promotor.vercel.app no Vercel.');
  }

  return url;
}
