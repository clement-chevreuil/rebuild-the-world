// ==== Petit parser Markdown (sans dépendance externe) ====
function renderMarkdown(md) {
  // On échappe d'abord le HTML brut pour éviter les injections
  const escapeHtml = (str) =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lines = md.replace(/\r\n/g, "\n").split("\n");
  let html = "";
  let inCodeBlock = false;
  let codeBuffer = [];
  let listBuffer = [];
  let listType = null; // "ul" | "ol"

  const flushList = () => {
    if (listBuffer.length) {
      html += `<${listType}>${listBuffer.join("")}</${listType}>`;
      listBuffer = [];
      listType = null;
    }
  };

  const inline = (text) => {
    text = escapeHtml(text);
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return text;
  };

  for (const rawLine of lines) {
    const line = rawLine;

    // Blocs de code ```
    if (/^```/.test(line)) {
      if (inCodeBlock) {
        html += `<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`;
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Ligne vide
    if (line.trim() === "") {
      flushList();
      continue;
    }

    // Titres
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushList();
      const level = heading[1].length;
      html += `<h${level}>${inline(heading[2])}</h${level}>`;
      continue;
    }

    // Séparateur
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushList();
      html += "<hr>";
      continue;
    }

    // Citation
    if (/^>\s?/.test(line)) {
      flushList();
      html += `<blockquote>${inline(line.replace(/^>\s?/, ""))}</blockquote>`;
      continue;
    }

    // Liste non ordonnée
    const ul = line.match(/^[-*]\s+(.*)$/);
    if (ul) {
      if (listType !== "ul") { flushList(); listType = "ul"; }
      listBuffer.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }

    // Liste ordonnée
    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      if (listType !== "ol") { flushList(); listType = "ol"; }
      listBuffer.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }

    // Paragraphe normal
    flushList();
    html += `<p>${inline(line)}</p>`;
  }

  flushList();
  if (inCodeBlock && codeBuffer.length) {
    html += `<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`;
  }

  return html;
}

function renderPlainText(text) {
  const escapeHtml = (str) =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<pre>${escapeHtml(text)}</pre>`;
}

function downloadBlob(text, filename, mime) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Retire la syntaxe Markdown pour donner un .txt lisible en texte pur
function stripMarkdown(md) {
  return md
    .replace(/^```[\s\S]*?```$/gm, (block) => block.replace(/```/g, ""))
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/^[-*]\s+/gm, "• ")
    .replace(/^(-{3,}|\*{3,})$/gm, "");
}
