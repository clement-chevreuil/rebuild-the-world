// Validation et utilitaires pour les requêtes réseau

export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidJson(str) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export function parseJson(str, defaultValue = null) {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
}

export function isObject(obj) {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
}

export function validateHeaders(headers) {
  if (!isObject(headers)) {
    throw new Error('Headers must be an object');
  }

  for (const [key, value] of Object.entries(headers)) {
    if (typeof key !== 'string' || typeof value !== 'string') {
      throw new Error(`Invalid header: ${key} => ${value}`);
    }
    if (/[\r\n]/.test(key) || /[\r\n]/.test(value)) {
      throw new Error('Header contains invalid characters');
    }
  }

  return headers;
}

export function validateBody(body) {
  if (typeof body !== 'string') {
    throw new Error('Body must be a string');
  }
  return body;
}

export function formatResponse(data, isJson = false) {
  if (isJson) {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }
  return String(data);
}

export class NetworkError extends Error {
  constructor(message, statusCode = null, details = null) {
    super(message);
    this.name = 'NetworkError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export async function handleResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  let body;

  if (contentType.includes('application/json')) {
    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }
  } else {
    body = await response.text();
  }

  return {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers),
    body: body,
    ok: response.ok
  };
}
