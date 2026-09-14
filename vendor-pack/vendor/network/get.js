import { isValidUrl, validateHeaders, handleResponse, NetworkError } from './utils.js';

/**
 * Effectue une requête GET
 * @param {string} url - L'URL cible
 * @param {object} options - Options optionnelles
 * @param {object} options.headers - En-têtes HTTP personnalisés
 * @returns {Promise<object>} Réponse formatée
 */
export async function get(url, options = {}) {
  if (!isValidUrl(url)) {
    throw new NetworkError('Invalid URL', null, { url });
  }

  try {
    const headers = options.headers ? validateHeaders(options.headers) : {};

    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      signal: options.signal
    });

    return await handleResponse(response);
  } catch (error) {
    if (error.name === 'NetworkError') throw error;
    throw new NetworkError(error.message, null, { url });
  }
}
