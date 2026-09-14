import { isValidUrl, validateHeaders, handleResponse, NetworkError } from './utils.js';

/**
 * Effectue une requête DELETE
 * @param {string} url - L'URL cible
 * @param {object} options - Options optionnelles
 * @param {object} options.headers - En-têtes HTTP personnalisés
 * @param {string|object} options.body - Corps optionnel de la requête
 * @returns {Promise<object>} Réponse formatée
 */
export async function del(url, options = {}) {
  if (!isValidUrl(url)) {
    throw new NetworkError('Invalid URL', null, { url });
  }

  try {
    const headers = options.headers ? validateHeaders(options.headers) : {};

    const fetchOptions = {
      method: 'DELETE',
      headers: headers,
      signal: options.signal
    };

    // DELETE peut avoir un body optionnel
    if (options.body !== undefined && options.body !== null) {
      const bodyStr = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
      fetchOptions.body = bodyStr;
    }

    const response = await fetch(url, fetchOptions);
    return await handleResponse(response);
  } catch (error) {
    if (error.name === 'NetworkError') throw error;
    throw new NetworkError(error.message, null, { url });
  }
}
