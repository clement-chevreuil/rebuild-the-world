import { isValidUrl, validateHeaders, validateBody, handleResponse, NetworkError } from './utils.js';

/**
 * Effectue une requête PUT
 * @param {string} url - L'URL cible
 * @param {string|object} body - Corps de la requête
 * @param {object} options - Options optionnelles
 * @param {object} options.headers - En-têtes HTTP personnalisés
 * @returns {Promise<object>} Réponse formatée
 */
export async function put(url, body, options = {}) {
  if (!isValidUrl(url)) {
    throw new NetworkError('Invalid URL', null, { url });
  }

  if (body === null || body === undefined) {
    throw new NetworkError('Body is required for PUT', null, { url });
  }

  try {
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    validateBody(bodyStr);

    const headers = options.headers ? validateHeaders(options.headers) : {};

    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: headers,
      body: bodyStr,
      signal: options.signal
    });

    return await handleResponse(response);
  } catch (error) {
    if (error.name === 'NetworkError') throw error;
    throw new NetworkError(error.message, null, { url });
  }
}
