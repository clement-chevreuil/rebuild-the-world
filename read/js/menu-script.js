const list = document.getElementById("menu-list");

function renderMenu() {
  list.innerHTML = "";

  if (!PAGES || PAGES.length === 0) {
    list.innerHTML = `<li class="empty">Aucune page pour le moment.</li>`;
    return;
  }

  for (const page of PAGES) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `pages/${page.slug}/index.html`;
    a.textContent = page.titre;
    li.appendChild(a);
    list.appendChild(li);
  }
}

renderMenu();
