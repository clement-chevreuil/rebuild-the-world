// Script de vérification quotidienne des péremptions — lit food/food.db directement
// (pas de serveur, pas de navigateur) et envoie un mail si des aliments sont périmés.
// Lancé par une tâche planifiée Windows (voir cron/run-check.bat).

"use strict";
const fs = require("fs");
const path = require("path");

const initSqlJs = require(path.join(__dirname, "..", "..", "vendor-pack", "vendor", "sqlite", "sql-wasm.js"));
const SQL_WASM_BASE64 = require(path.join(__dirname, "..", "..", "vendor-pack", "vendor", "sqlite", "sql-wasm-base64.js"));
const { sendMail } = require(path.join(__dirname, "..", "..", "vendor-pack", "vendor", "mail", "smtp-mailer.js"));

const DB_PATH = path.join(__dirname, "..", "food.db");
const ENV_PATH = path.join(__dirname, "..", "..", ".env");

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function loadEnv(envPath) {
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  const content = fs.readFileSync(envPath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  });
  return env;
}

function loadConfig() {
  const env = loadEnv(ENV_PATH);
  const config = {
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT || 587),
    secure: env.SMTP_SECURE === "true",
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.MAIL_FROM || env.SMTP_USER,
    to: env.MAIL_TO,
  };
  const missing = ["host", "user", "pass", "to"].filter((k) => !config[k]);
  if (missing.length > 0) {
    throw new Error(
      `Configuration SMTP incomplète dans ${ENV_PATH} (manquant : ${missing.join(", ")}). Voir .env.example.`
    );
  }
  return config;
}

function base64ToUint8Array(base64) {
  return new Uint8Array(Buffer.from(base64, "base64"));
}

async function loadDatabase(dbPath) {
  const wasmBinary = base64ToUint8Array(SQL_WASM_BASE64);
  const SQL = await initSqlJs({ wasmBinary });
  const fileBuffer = fs.readFileSync(dbPath);
  return new SQL.Database(new Uint8Array(fileBuffer));
}

function getExpiredItems(db) {
  const res = db.exec(
    "SELECT nom, quantite, type, emplacement, peremption FROM aliments WHERE statut='actif' AND date(peremption) <= date('now') ORDER BY peremption ASC"
  );
  if (res.length === 0) return [];
  const [{ columns, values }] = res;
  return values.map((row) => Object.fromEntries(row.map((v, i) => [columns[i], v])));
}

function buildEmail(items) {
  const subject = `🧊 ${items.length} aliment${items.length > 1 ? "s" : ""} périmé${items.length > 1 ? "s" : ""} dans le frigo`;

  const lines = items.map(
    (i) => `- ${i.nom}${i.quantite ? ` (${i.quantite})` : ""} — ${i.type}, ${i.emplacement} — périmé le ${i.peremption}`
  );
  const text = `Aliments périmés :\n\n${lines.join("\n")}`;

  const rows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e6ddcd;">${escapeHtml(i.nom)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e6ddcd;">${escapeHtml(i.quantite || "")}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e6ddcd;">${escapeHtml(i.type)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e6ddcd;">${escapeHtml(i.emplacement)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e6ddcd;">${escapeHtml(i.peremption)}</td>
      </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:sans-serif;color:#2b2420;">
      <h2 style="color:#c1502e;">🧊 Aliments périmés</h2>
      <table style="border-collapse:collapse;width:100%;max-width:600px;">
        <thead>
          <tr style="text-align:left;background:#f0ddc9;">
            <th style="padding:6px 10px;">Nom</th>
            <th style="padding:6px 10px;">Quantité</th>
            <th style="padding:6px 10px;">Catégorie</th>
            <th style="padding:6px 10px;">Emplacement</th>
            <th style="padding:6px 10px;">Péremption</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

  return { subject, text, html };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function main() {
  if (!fs.existsSync(DB_PATH)) {
    log(`Aucune base trouvée à ${DB_PATH} — rien à vérifier (activez la sauvegarde disque dans l'app).`);
    return;
  }

  const config = loadConfig();
  const db = await loadDatabase(DB_PATH);
  const items = getExpiredItems(db);

  if (items.length === 0) {
    log("Aucun aliment périmé.");
    return;
  }

  const { subject, text, html } = buildEmail(items);
  await sendMail({ ...config, subject, text, html });
  log(`Email envoyé pour ${items.length} aliment(s) périmé(s).`);
}

main().catch((err) => {
  console.error(`[${new Date().toISOString()}] Erreur : ${err.message}`);
  process.exitCode = 1;
});
