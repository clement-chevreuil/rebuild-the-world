# SMTP Mailer

Client SMTP minimal pour **Node.js**, zéro dépendance externe (utilise uniquement les modules natifs `net` et `tls`). Fonctionne pour des scripts backend/cron — ne s'exécute pas dans un navigateur.

## Utilisation

```javascript
const { sendMail } = require("../../vendor-pack/vendor/mail/smtp-mailer.js");

await sendMail({
  host: "smtp.example.com",
  port: 587,          // 587 (STARTTLS) ou 465 (TLS implicite)
  secure: false,       // true si port 465
  user: "compte@example.com",
  pass: "motdepasse",
  from: "compte@example.com",
  to: "destinataire@example.com",
  subject: "Sujet du mail",
  text: "Version texte brut",
  html: "<p>Version HTML (optionnelle)</p>",
});
```

## Notes

- Supporte l'authentification `AUTH LOGIN` (la plus répandue chez les fournisseurs SMTP classiques).
- Gère automatiquement le `STARTTLS` sur les ports non-465, et le TLS implicite sur le port 465.
- Ne gère pas les pièces jointes (non nécessaire pour des alertes texte/HTML simples). À étendre si besoin.
- En cas d'erreur SMTP (code inattendu), lève une `Error` avec le message du serveur.
