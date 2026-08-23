/**
 * Configurações globais não secretas do aplicativo.
 */
export const APP_CONFIG = {
  // URL pública oficial do aplicativo. 
  // Alterar aqui para mudar o domínio em todos os convites e links de acesso.
  publicAppUrl: 'https://comfy-coding-mate.lovable.app',
};

/**
 * Retorna a URL pública oficial configurada.
 * Lança erro se a URL não estiver definida, garantindo que convites não sejam enviados sem destino.
 */
export function getPublicAppUrl() {
  const url = APP_CONFIG.publicAppUrl;
  
  if (!url || url.includes('localhost') || url.includes('id-preview')) {
    throw new Error("URL pública do aplicativo não configurada corretamente no código. Contate o administrador do sistema.");
  }
  
  return url;
}
