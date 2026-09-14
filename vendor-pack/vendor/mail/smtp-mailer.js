// Client SMTP minimal pour Node.js — zéro dépendance (utilise uniquement net/tls natifs).
// Supporte : port 465 (TLS implicite) ou 587/25 (STARTTLS), AUTH LOGIN, texte + HTML.
// Usage : const { sendMail } = require(".../vendor/mail/smtp-mailer.js");
//         await sendMail({ host, port, secure, user, pass, from, to, subject, text, html });

"use strict";
const net = require("net");
const tls = require("tls");

function readReply(socket) {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const onData = (chunk) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r\n/).filter(Boolean);
      const last = lines[lines.length - 1];
      // Une réponse SMTP se termine par une ligne "CODE " (espace), pas "CODE-" (continuation)
      if (last && /^\d{3} /.test(last)) {
        cleanup();
        resolve(buffer);
      }
    };
    const onError = (err) => {
      cleanup();
      reject(err);
    };
    const cleanup = () => {
      socket.removeListener("data", onData);
      socket.removeListener("error", onError);
    };
    socket.on("data", onData);
    socket.on("error", onError);
  });
}

function sendCommand(socket, command) {
  return new Promise((resolve, reject) => {
    socket.write(command + "\r\n", (err) => {
      if (err) reject(err);
    });
  }).then(() => readReply(socket));
}

function checkCode(reply, expectedCodes) {
  const code = reply.slice(0, 3);
  if (!expectedCodes.includes(code)) {
    throw new Error(`Réponse SMTP inattendue (attendu ${expectedCodes.join("/")}) : ${reply.trim()}`);
  }
  return reply;
}

function buildMessage({ from, to, subject, text, html }) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Date: ${new Date().toUTCString()}`,
    `MIME-Version: 1.0`,
  ];

  let body;
  if (html) {
    const boundary = "----food-mailer-" + Date.now();
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    body = [
      `--${boundary}`,
      `Content-Type: text/plain; charset="utf-8"`,
      ``,
      text || "",
      `--${boundary}`,
      `Content-Type: text/html; charset="utf-8"`,
      ``,
      html,
      `--${boundary}--`,
      ``,
    ].join("\r\n");
  } else {
    headers.push(`Content-Type: text/plain; charset="utf-8"`);
    body = text || "";
  }

  const raw = headers.join("\r\n") + "\r\n\r\n" + body;
  // Normalise les fins de ligne puis applique le "dot-stuffing" imposé par SMTP
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\n/g, "\r\n")
    .split("\r\n")
    .map((line) => (line.startsWith(".") ? "." + line : line))
    .join("\r\n");
}

async function sendMail({ host, port, secure, user, pass, from, to, subject, text, html }) {
  if (!host || !port) throw new Error("host et port SMTP requis");
  if (!from || !to) throw new Error("from et to requis");

  const useImplicitTls = !!secure || Number(port) === 465;

  let socket = useImplicitTls
    ? tls.connect({ host, port, servername: host })
    : net.connect({ host, port });

  await new Promise((resolve, reject) => {
    socket.once(useImplicitTls ? "secureConnect" : "connect", resolve);
    socket.once("error", reject);
  });

  checkCode(await readReply(socket), ["220"]);
  checkCode(await sendCommand(socket, "EHLO localhost"), ["250"]);

  if (!useImplicitTls) {
    checkCode(await sendCommand(socket, "STARTTLS"), ["220"]);
    const plainSocket = socket;
    socket = await new Promise((resolve, reject) => {
      const secured = tls.connect({ socket: plainSocket, host, servername: host }, () => resolve(secured));
      secured.once("error", reject);
    });
    checkCode(await sendCommand(socket, "EHLO localhost"), ["250"]);
  }

  if (user && pass) {
    checkCode(await sendCommand(socket, "AUTH LOGIN"), ["334"]);
    checkCode(await sendCommand(socket, Buffer.from(user, "utf8").toString("base64")), ["334"]);
    checkCode(await sendCommand(socket, Buffer.from(pass, "utf8").toString("base64")), ["235"]);
  }

  checkCode(await sendCommand(socket, `MAIL FROM:<${from}>`), ["250"]);
  checkCode(await sendCommand(socket, `RCPT TO:<${to}>`), ["250", "251"]);
  checkCode(await sendCommand(socket, "DATA"), ["354"]);

  const message = buildMessage({ from, to, subject, text, html });
  checkCode(await sendCommand(socket, message + "\r\n."), ["250"]);

  await sendCommand(socket, "QUIT").catch(() => {});
  socket.end();
}

module.exports = { sendMail };
