/* ==========================================================
   MAGIFY — app.js
   Controlador principal: navegación entre vistas, buscador,
   barajar y detalle de carta.
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initPixelBackground();
  initNav();
  initBuscador();
  initBarajar();
  initDetailClose();
});

/* ---------- Fondo pixel art: estrellitas decorativas ---------- */
function initPixelBackground() {
  const bg = document.getElementById("pixelBg");
  const STAR_COUNT = 40;
  const variants = ["", "gold-star", "cel-star"];

  for (let i = 0; i < STAR_COUNT; i++) {
    const star = document.createElement("span");
    const variant = variants[Math.floor(Math.random() * variants.length)];
    if (variant) star.classList.add(variant);
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 3}s`;
    bg.appendChild(star);
  }
}

/* ---------- Navegación inferior ---------- */
function initNav() {
  const buttons = document.querySelectorAll(".nav-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => {
        b.classList.remove("active");
        b.removeAttribute("aria-current");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-current", "page");
      // showView oculta también el detalle: tocar el nav desde el detalle lo cierra
      showView(btn.dataset.target);
      window.scrollTo(0, 0);
    });
  });
}

function showView(name) {
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("hidden", view.dataset.view !== name);
  });
}

/* El nav inferior queda siempre visible, también en el detalle */
function openDetailView() {
  showView("detail");
  window.scrollTo(0, 0);
}

function closeDetailView() {
  const activeTarget = document.querySelector(".nav-btn.active")?.dataset.target || "buscador";
  showView(activeTarget);
}

/* ==========================================================
   BUSCADOR
   ========================================================== */
const RESULTS_PER_PAGE_DESKTOP = 8; // grilla 4x2
const RESULTS_STEP_MOBILE = 4;      // grilla 2x2 por tanda
const desktopMQ = window.matchMedia("(min-width: 900px)");

/* Estado de los resultados: se conserva al cambiar de breakpoint */
const resultsState = {
  cards: [],
  mobileCount: RESULTS_STEP_MOBILE,
  page: 1,
  searchSeq: 0,
};

function initBuscador() {
  const form = document.getElementById("searchForm");
  const input = document.getElementById("searchInput");
  const status = document.getElementById("searchStatus");
  const grid = document.getElementById("resultsGrid");
  const autoList = document.getElementById("autocompleteList");
  let autocomplete = null;

  /* Confirma una consulta: cancela el predictivo pendiente, cierra la lista,
     baja el teclado en móvil y busca. */
  const confirmSearch = (query) => {
    autocomplete.cancel();
    if (!desktopMQ.matches) input.blur();
    return runSearch(query, status, grid);
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    confirmSearch(input.value.trim());
  });

  autocomplete = initAutocomplete(input, autoList, (chosenName) => {
    input.value = chosenName;
    confirmSearch(chosenName);
  });

  initResultsControls(grid);
}

async function runSearch(query, status, grid) {
  if (!query) return;

  const mySeq = ++resultsState.searchSeq;
  status.textContent = "Buscando...";
  status.classList.remove("error");
  resultsState.cards = [];
  renderResultsView(grid);

  try {
    const cards = await ScryfallService.searchCards(query);
    if (mySeq !== resultsState.searchSeq) return; // llegó una búsqueda más nueva

    if (cards.length === 0) {
      status.textContent = "No se encontraron cartas.";
      return;
    }

    status.textContent = `${cards.length} resultado${cards.length === 1 ? "" : "s"}`;
    resultsState.cards = cards;
    resultsState.mobileCount = RESULTS_STEP_MOBILE;
    resultsState.page = 1;
    renderResultsView(grid);
  } catch (err) {
    if (mySeq !== resultsState.searchSeq) return;
    console.error(err);
    status.textContent = "Error al buscar. Intentá de nuevo.";
    status.classList.add("error");
  }
}

/* ---------- Autocompletado predictivo ---------- */
/**
 * Devuelve { cancel }: cancela el timer, invalida respuestas en vuelo
 * (token de secuencia) y cierra la lista.
 */
function initAutocomplete(input, listEl, onSelect) {
  let debounceTimer = null;
  let activeIndex = -1;
  let currentItems = [];
  let seq = 0;

  const cancel = () => {
    clearTimeout(debounceTimer);
    seq++;
    activeIndex = -1;
    currentItems = [];
    hideAutocomplete(listEl);
  };

  // Click en una sugerencia: pasa por el mismo camino que Enter
  const select = (name) => {
    cancel();
    onSelect(name);
  };

  input.addEventListener("input", () => {
    const query = input.value.trim();
    clearTimeout(debounceTimer);
    const mySeq = ++seq;

    if (query.length < 2) {
      hideAutocomplete(listEl);
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const suggestions = await ScryfallService.autocomplete(query);
        if (mySeq !== seq) return; // respuesta tardía: se descarta
        currentItems = suggestions.slice(0, 8);
        activeIndex = -1;
        renderAutocomplete(suggestions, listEl, input, select);
      } catch (err) {
        console.error(err);
      }
    }, 220);
  });

  input.addEventListener("keydown", (e) => {
    const items = listEl.querySelectorAll(".autocomplete-item");
    if (listEl.classList.contains("hidden") || items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
      updateActiveItem(items, activeIndex);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      updateActiveItem(items, activeIndex);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      select(currentItems[activeIndex]);
    } else if (e.key === "Escape") {
      cancel();
    }
  });

  document.addEventListener("click", (e) => {
    if (!listEl.contains(e.target) && e.target !== input) {
      hideAutocomplete(listEl);
    }
  });

  return { cancel };
}

function renderAutocomplete(suggestions, listEl, input, onSelect) {
  if (!suggestions || suggestions.length === 0) {
    hideAutocomplete(listEl);
    return;
  }

  listEl.innerHTML = "";
  suggestions.slice(0, 8).forEach((name) => {
    const li = document.createElement("li");
    li.className = "autocomplete-item";
    li.textContent = name;
    li.addEventListener("click", () => onSelect(name));
    listEl.appendChild(li);
  });

  listEl.classList.remove("hidden");
}

function updateActiveItem(items, activeIndex) {
  items.forEach((item, i) => item.classList.toggle("active", i === activeIndex));
  items[activeIndex]?.scrollIntoView({ block: "nearest" });
}

function hideAutocomplete(listEl) {
  listEl.classList.add("hidden");
  listEl.innerHTML = "";
}

/* ---------- Resultados: móvil (de a 4 con scroll) / desktop (paginado de 8) ---------- */
function initResultsControls(grid) {
  const moreWrap = document.getElementById("resultsMore");
  const sentinel = document.getElementById("resultsSentinel");
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");

  loadMoreBtn.addEventListener("click", () => loadMoreMobile(grid));

  prevBtn.addEventListener("click", () => goToPage(resultsState.page - 1, grid));
  nextBtn.addEventListener("click", () => goToPage(resultsState.page + 1, grid));

  // Scroll infinito: tras un scroll real del usuario se comprueba si el sentinel
  // está cerca del borde inferior y se carga un lote (máx. uno por evento de scroll).
  // El render inicial no auto-carga: siempre muestra exactamente 4.
  window.addEventListener("scroll", () => {
    if (desktopMQ.matches || moreWrap.classList.contains("hidden")) return;
    if (sentinel.getBoundingClientRect().top <= window.innerHeight + 160) {
      loadMoreMobile(grid);
    }
  }, { passive: true });
  resultsState.sentinel = sentinel;
  resultsState.moreWrap = moreWrap;

  // Cambio de breakpoint: re-render en el modo correcto conservando la búsqueda
  const onChange = () => renderResultsView(grid);
  if (desktopMQ.addEventListener) desktopMQ.addEventListener("change", onChange);
  else desktopMQ.addListener(onChange);
}

function renderResultsView(grid) {
  const { cards } = resultsState;
  const moreWrap = document.getElementById("resultsMore");
  const pager = document.getElementById("resultsPager");

  grid.innerHTML = "";
  moreWrap.classList.add("hidden");
  pager.classList.add("hidden");
  if (cards.length === 0) return;

  if (desktopMQ.matches) {
    const totalPages = Math.ceil(cards.length / RESULTS_PER_PAGE_DESKTOP);
    resultsState.page = Math.min(Math.max(resultsState.page, 1), totalPages);
    const start = (resultsState.page - 1) * RESULTS_PER_PAGE_DESKTOP;
    renderResults(cards.slice(start, start + RESULTS_PER_PAGE_DESKTOP), grid);

    if (totalPages > 1) {
      pager.classList.remove("hidden");
      document.getElementById("pagerInfo").textContent = `Página ${resultsState.page} de ${totalPages}`;
      document.getElementById("prevPageBtn").disabled = resultsState.page <= 1;
      document.getElementById("nextPageBtn").disabled = resultsState.page >= totalPages;
    }
  } else {
    renderResults(cards.slice(0, resultsState.mobileCount), grid);
    updateMoreControls();
  }
}

function goToPage(page, grid) {
  resultsState.page = page;
  renderResultsView(grid);
  if (grid.getBoundingClientRect().top < 0) grid.scrollIntoView({ block: "start" });
}

function loadMoreMobile(grid) {
  const { cards } = resultsState;
  if (desktopMQ.matches || resultsState.mobileCount >= cards.length) return;
  const from = resultsState.mobileCount;
  resultsState.mobileCount = Math.min(cards.length, from + RESULTS_STEP_MOBILE);
  renderResults(cards.slice(from, resultsState.mobileCount), grid);
  updateMoreControls();
}

/* Muestra/oculta "Ver más" según queden resultados por cargar */
function updateMoreControls() {
  const { cards, mobileCount, moreWrap } = resultsState;
  moreWrap.classList.toggle("hidden", mobileCount >= cards.length);
}

function renderResults(cards, grid) {
  cards.forEach((card) => {
    const el = document.createElement("div");
    el.className = "result-card";
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `Ver detalle de ${card.name}`);

    const imgUrl = card.image_uris?.normal || card.image_uris?.small || null;

    if (imgUrl) {
      const img = document.createElement("img");
      img.src = imgUrl;
      img.alt = card.name;
      img.loading = "lazy";
      el.appendChild(img);
    } else {
      const ph = document.createElement("div");
      ph.className = "placeholder-art";
      el.appendChild(ph);
    }

    const nameEl = document.createElement("p");
    nameEl.className = "card-name";
    nameEl.textContent = card.name;
    el.appendChild(nameEl);

    el.addEventListener("click", () => showCardDetail(card));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        showCardDetail(card);
      }
    });
    grid.appendChild(el);
  });
}

/* ==========================================================
   BARAJAR
   ========================================================== */
function initBarajar() {
  const wrap = document.getElementById("randomCardWrap");
  const stage = document.getElementById("barajarStage");
  const info = document.getElementById("randomInfo");
  const shuffleBtn = document.getElementById("shuffleBtn");
  const verMasBtn = document.getElementById("verMasBtn");
  let currentCard = null;

  const shuffle = async () => {
    if (wrap.classList.contains("loading")) return;
    wrap.classList.add("loading");
    shuffleBtn.disabled = true;

    try {
      const card = await ScryfallService.fetchRandomCard();
      renderRandomCard(card, wrap);
      renderRandomInfo(card, info);
      stage.classList.add("has-card");
      info.classList.remove("hidden");
      info.scrollTop = 0;
      currentCard = card;
      verMasBtn.classList.remove("hidden");
    } catch (err) {
      console.error(err);
      wrap.classList.remove("has-card");
      wrap.innerHTML = `<p class="hint-text">Error al obtener carta. Tocá para reintentar.</p>`;
      stage.classList.remove("has-card");
      info.classList.add("hidden");
      verMasBtn.classList.add("hidden");
      currentCard = null;
    } finally {
      wrap.classList.remove("loading");
      shuffleBtn.disabled = false;
    }
  };

  wrap.addEventListener("click", shuffle);
  wrap.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      shuffle();
    }
  });
  shuffleBtn.addEventListener("click", shuffle);

  verMasBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (currentCard) showCardDetail(currentCard);
  });
}

function renderRandomCard(card, wrap) {
  const imgUrl = card.image_uris?.large || card.image_uris?.normal || card.image_uris?.small || null;
  wrap.innerHTML = "";
  wrap.classList.add("has-card");
  wrap.setAttribute("aria-label", `${card.name}. Barajar otra carta aleatoria`);

  if (imgUrl) {
    const img = document.createElement("img");
    img.src = imgUrl;
    img.alt = card.name;
    wrap.appendChild(img);
  } else {
    // Sin imagen (p. ej. sin image_uris): se muestra el nombre como texto
    wrap.classList.remove("has-card");
    const p = document.createElement("p");
    p.className = "hint-text";
    p.textContent = card.name;
    wrap.appendChild(p);
  }
}

/** Datos de la carta sacada al azar (reutiliza bullet/format*). */
function renderRandomInfo(card, info) {
  info.innerHTML = `
    <p class="detail-name">${escapeHtml(card.name)}</p>
    <div class="detail-list">
      ${bullet("Coste de maná", formatManaCost(card.mana_cost))}
      ${bullet("Tipo", card.type_line)}
      ${bullet("Poder/Resistencia", card.power && card.toughness ? `${card.power}/${card.toughness}` : "")}
      ${bullet("Lealtad", card.loyalty)}
      ${bullet("Set", card.set_name)}
      ${bullet("Rareza", capitalize(card.rarity))}
      ${bullet("Artista", card.artist)}
    </div>
    ${card.oracle_text ? `
    <div class="detail-row">
      <span class="label">Texto</span>
      <span class="detail-oracle">${escapeHtml(card.oracle_text)}</span>
    </div>` : ""}
    ${card.flavor_text ? `
    <div class="detail-row">
      <span class="label">Ambientación</span>
      <span class="detail-oracle detail-flavor">${escapeHtml(card.flavor_text)}</span>
    </div>` : ""}
  `;
}

/* ==========================================================
   DETALLE DE CARTA
   ========================================================== */
function initDetailClose() {
  document.getElementById("closeDetailBtn").addEventListener("click", closeDetailView);
}

function showCardDetail(card) {
  const scroll = document.getElementById("detailScroll");
  const imgUrl = card.image_uris?.large || card.image_uris?.normal || null;

  scroll.innerHTML = `
    ${imgUrl ? `<img class="detail-img" src="${escapeHtml(imgUrl)}" alt="${escapeHtml(card.name)}">` : ""}
    <div class="detail-info">
      <p class="detail-name">${escapeHtml(card.name)}</p>

      <div class="detail-list">
        ${bullet("Coste de maná", formatManaCost(card.mana_cost))}
        ${bullet("Tipo", card.type_line)}
        ${bullet("Poder/Resistencia", card.power && card.toughness ? `${card.power}/${card.toughness}` : "")}
        ${bullet("Lealtad", card.loyalty)}
        ${bullet("Identidad de color", formatColorIdentity(card.color_identity))}
        ${bullet("Set", card.set_name)}
        ${bullet("Número de colección", card.collector_number ? `#${card.collector_number}` : "")}
        ${bullet("Rareza", capitalize(card.rarity))}
        ${bullet("Artista", card.artist)}
        ${bullet("Fecha de impresión", formatDate(card.released_at))}
        ${bullet("Legal en", formatLegalities(card.legalities))}
        ${bullet("Precio USD", card.prices?.usd ? `$${card.prices.usd}` : "")}
        ${bullet("Precio USD (foil)", card.prices?.usd_foil ? `$${card.prices.usd_foil}` : "")}
        ${bullet("Precio EUR", card.prices?.eur ? `€${card.prices.eur}` : "")}
      </div>

      ${card.oracle_text ? `
      <div class="detail-row">
        <span class="label">Texto</span>
        <span class="detail-oracle">${escapeHtml(card.oracle_text)}</span>
      </div>` : ""}

      ${card.flavor_text ? `
      <div class="detail-row">
        <span class="label">Ambientación</span>
        <span class="detail-oracle detail-flavor">${escapeHtml(card.flavor_text)}</span>
      </div>` : ""}

      ${renderLinks(card)}
    </div>

    <div class="artist-carousel-wrap" id="artistCarouselWrap">
      <h2 class="carousel-title">Otras obras del mismo artista</h2>
      <div class="artist-carousel" id="artistCarousel">
        <p class="artist-carousel-empty">Buscando más ilustraciones...</p>
      </div>
    </div>
  `;

  openDetailView();
  loadArtistCarousel(card);
}

/**
 * Carga y renderiza el carrusel de otras cartas del mismo artista.
 * Se ejecuta después de mostrar el detalle para no bloquear el render inicial.
 */
async function loadArtistCarousel(card) {
  const carousel = document.getElementById("artistCarousel");
  const wrap = document.getElementById("artistCarouselWrap");
  if (!carousel || !wrap) return;

  if (!card.artist) {
    wrap.classList.add("hidden");
    return;
  }

  try {
    const otherCards = await ScryfallService.searchByArtist(card.artist, card.id);

    if (otherCards.length === 0) {
      wrap.classList.add("hidden");
      return;
    }

    carousel.innerHTML = "";
    otherCards.slice(0, 15).forEach((otherCard) => {
      const imgUrl = otherCard.image_uris?.normal || otherCard.image_uris?.small || null;
      if (!imgUrl) return;

      const item = document.createElement("div");
      item.className = "artist-carousel-item";
      item.innerHTML = `
        <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(otherCard.name)}" loading="lazy">
        <p class="name">${escapeHtml(otherCard.name)}</p>
      `;
      item.addEventListener("click", () => showCardDetail(otherCard));
      carousel.appendChild(item);
    });
  } catch (err) {
    console.error(err);
    wrap.classList.add("hidden");
  }
}

/**
 * Genera una línea tipo bullet "Label: valor" en una sola fila.
 * Devuelve "" si el valor está vacío para no renderizar filas vacías.
 */
function bullet(label, value) {
  if (!value) return "";
  return `<p class="detail-bullet"><span class="label">${escapeHtml(label)}:</span> <span class="value">${escapeHtml(value)}</span></p>`;
}

/** Convierte "{2}{U}{U}" en "(2)(U)(U)" */
function formatManaCost(manaCost) {
  if (!manaCost) return "";
  return manaCost.replace(/\{/g, "(").replace(/\}/g, ")");
}

function formatColorIdentity(colors) {
  if (!colors || colors.length === 0) return "Incolora";
  const names = { W: "Blanco", U: "Azul", B: "Negro", R: "Rojo", G: "Verde" };
  return colors.map((c) => names[c] || c).join(", ");
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

/** Lista los formatos principales en los que la carta es legal. */
function formatLegalities(legalities) {
  if (!legalities) return "";
  const formats = [
    ["standard", "Standard"],
    ["pioneer", "Pioneer"],
    ["modern", "Modern"],
    ["legacy", "Legacy"],
    ["vintage", "Vintage"],
    ["commander", "Commander"],
    ["pauper", "Pauper"],
  ];
  const legal = formats
    .filter(([key]) => legalities[key] === "legal")
    .map(([, label]) => label);
  return legal.length ? legal.join(", ") : "Ninguno de los principales";
}

/**
 * Enlaces reales de Scryfall a la página oficial de Gatherer (Wizards)
 * y a EDHRec (mazos que incluyen esta carta).
 */
function renderLinks(card) {
  const links = [];
  if (card.gatherer_uri) links.push({ label: "Gatherer", title: "Ver en Gatherer (oficial)", url: card.gatherer_uri });
  if (card.edhrec_uri) links.push({ label: "EDHRec", title: "Mazos con esta carta", url: card.edhrec_uri });
  if (card.scryfall_uri) links.push({ label: "Scryfall", title: "Ver en Scryfall", url: card.scryfall_uri });

  if (links.length === 0) return "";

  const items = links
    .map((l) => `<a class="detail-link" href="${escapeHtml(l.url)}" title="${escapeHtml(l.title)}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.label)} ↗</a>`)
    .join("");

  return `<div class="detail-links">${items}</div>`;
}

/* ---------- Helpers ---------- */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
