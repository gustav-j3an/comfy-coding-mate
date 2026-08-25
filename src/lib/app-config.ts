/**
 * Configurações globais não secretas do aplicativo.
 */
export const APP_CONFIG = {
  publicAppUrl: import.meta.env['VITE_PUBLIC_APP_URL'] || 'http://localhost:3000',
};

/**
 * Retorna a URL pública oficial configurada.
 * Lança erro se a URL não estiver definida, garantindo que convites não sejam enviados sem destino.
 */
export function getPublicAppUrl() {
  const url = APP_CONFIG.publicAppUrl;
  
  if (!url || url.includes('id-preview')) {
    throw new Error("URL pública do aplicativo não configurada corretamente. Defina VITE_PUBLIC_APP_URL.");
  }
  
  return url;
}
