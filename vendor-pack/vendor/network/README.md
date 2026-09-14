# Network Manager

Une petite librairie JS simple et sécurisée pour gérer les requêtes HTTP (GET, POST, PUT, PATCH, DELETE).

## Caractéristiques

- ✅ Zéro dépendance externe
- ✅ Validation d'URL et d'en-têtes
- ✅ Gestion des erreurs explicite
- ✅ Réponses formatées et structurées
- ✅ Modules séparés par méthode HTTP

## Structure

```
network/
├── index.js       # Point d'entrée (exporte tous les modules)
├── utils.js       # Fonctions utilitaires et validation
├── get.js         # Requêtes GET
├── post.js        # Requêtes POST
├── put.js         # Requêtes PUT
├── patch.js       # Requêtes PATCH
├── delete.js      # Requêtes DELETE
└── README.md      # Cette documentation
```

## Utilisation

### GET

```javascript
import { get } from './network/index.js';

// Simple
const response = await get('https://api.example.com/users');

// Avec headers personnalisés
const response = await get('https://api.example.com/users', {
  headers: {
    'Authorization': 'Bearer token123',
    'X-Custom-Header': 'value'
  }
});

console.log(response);
// {
//   status: 200,
//   statusText: 'OK',
//   headers: { ... },
//   body: { ... },
//   ok: true
// }
```

### POST

```javascript
import { post } from './network/index.js';

// Avec objet (converti en JSON)
const response = await post('https://api.example.com/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// Avec chaîne personnalisée
const response = await post('https://api.example.com/data', 'custom data', {
  headers: {
    'Content-Type': 'text/plain'
  }
});
```

### PUT

```javascript
import { put } from './network/index.js';

const response = await put('https://api.example.com/users/123', {
  name: 'Jane Doe',
  email: 'jane@example.com'
});
```

### PATCH

```javascript
import { patch } from './network/index.js';

// Mise à jour partielle
const response = await patch('https://api.example.com/users/123', {
  email: 'newemail@example.com'
});
```

### DELETE

```javascript
import { del as delete } from './network/index.js';

// Simple
const response = await delete('https://api.example.com/users/123');

// Avec headers personnalisés
const response = await delete('https://api.example.com/users/123', {
  headers: {
    'Authorization': 'Bearer token123'
  }
});

// Avec body optionnel
const response = await delete('https://api.example.com/resource', {
  body: { reason: 'cleanup' }
});
```

## Format des réponses

Toutes les requêtes retournent un objet structuré :

```javascript
{
  status: 200,              // Code HTTP
  statusText: 'OK',         // Message du statut
  headers: {                // En-têtes de réponse
    'content-type': 'application/json',
    ...
  },
  body: { ... },            // Corps (JSON ou texte)
  ok: true                  // true si status 200-299
}
```

## Gestion des erreurs

```javascript
import { get, NetworkError } from './network/index.js';

try {
  const response = await get('invalid-url');
} catch (error) {
  if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
    console.error('Status:', error.statusCode);
    console.error('Details:', error.details);
  }
}
```

## Sécurité

- ✅ Validation stricte des URLs
- ✅ Validation des en-têtes (pas de caractères invalides)
- ✅ Pas de sérialisation dangereuse
- ✅ Gestion explicite des erreurs
- ✅ Support des signaux d'annulation

```javascript
// Annulation avec AbortController
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

try {
  const response = await get('https://api.example.com/users', {
    signal: controller.signal
  });
} finally {
  clearTimeout(timeout);
}
```

## Exemples pratiques

### Fetch avec timeout

```javascript
import { get } from './network/index.js';

async function getWithTimeout(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await get(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

const response = await getWithTimeout('https://api.example.com/users');
```

### Pagination

```javascript
import { get } from './network/index.js';

async function fetchAllPages(baseUrl) {
  const results = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await get(`${baseUrl}?page=${page}`);
    
    if (!response.ok) break;
    
    results.push(...response.body.data);
    hasMore = response.body.hasMore;
    page++;
  }

  return results;
}
```

### Upload avec progress

```javascript
import { post } from './network/index.js';

const data = { files: ['file1.txt', 'file2.txt'] };
const response = await post('https://api.example.com/upload', data, {
  headers: {
    'X-Client': 'v1.0',
    'Authorization': 'Bearer token'
  }
});
```

## Notes

- Le Content-Type par défaut est `application/json` pour POST, PUT et PATCH
- GET n'accepte pas de body (ignoré s'il est fourni)
- DELETE peut avoir un body optionnel (non standard mais supporté)
- Tous les en-têtes personnalisés sont validés pour éviter les injections
