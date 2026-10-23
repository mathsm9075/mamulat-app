// Books library: two shelves (Sunnah books, Silsilah books) with an offline PDF reader.
// The book list comes from books/books.json, generated at build time by scripts/make-books.mjs.

const SECTIONS = [
  { id: 'sunnah', name: 'سنت کی کتب' },
  { id: 'silsilah', name: 'سلسلہ کی کتب' },
];
const STORE = 'mamulat.books.v1';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let state = load();
let manifest = null;
let section = state.section || 'sunnah';
let query = '';

function load() { try { return JSON.parse(localStorage.getItem(STORE)) || { progress: {} }; } catch (e) { return { progress: {} }; } }
function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {} }
function prog(file) { return (state.progress[file] = state.progress[file] || {}); }

const ICON_BOOK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M19 19v2H6"/><path d="M9 7h6M9 10.5h4"/></svg>';
const ICON_BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>';

/* ---------- Styles (reuse the app's colour tokens) ---------- */
const css = `
.bk-ov{position:fixed;inset:0;z-index:80;background:var(--bg);color:var(--ink);display:flex;flex-direction:column;
  padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
.bk-top{display:flex;align-items:center;gap:8px;padding:10px max(14px,env(safe-area-inset-left,0px));border-bottom:1px solid var(--line);background:var(--surface)}
.bk-top h2{margin:0;font-size:18px;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bk-ib{display:inline-grid;place-items:center;min-width:38px;height:38px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--ink);font:inherit;font-weight:700;padding:0 10px;cursor:pointer}
.bk-ib svg{width:18px;height:18px}
.bk-body{flex:1;overflow:auto;padding:14px max(14px,env(safe-area-inset-left,0px)) 24px}
.bk-tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:var(--surface-2);padding:4px;border-radius:12px;margin-bottom:12px}
.bk-tabs button{border:0;background:transparent;border-radius:9px;padding:9px 6px;font:inherit;font-weight:700;color:var(--ink-2);cursor:pointer}
.bk-tabs button[aria-selected="true"]{background:var(--surface);color:var(--accent);box-shadow:0 1px 3px rgba(0,0,0,.08)}
.bk-tabs small{font-weight:500;opacity:.7;margin-right:4px}
.bk-search{width:100%;border:1px solid var(--line);border-radius:999px;background:var(--surface);padding:9px 14px;font:inherit;margin-bottom:12px;color:var(--ink)}
.bk-list{display:grid;gap:8px}
.bk-card{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:12px;align-items:center;text-align:right;width:100%;border:1px solid var(--line);background:var(--surface);border-radius:12px;padding:12px;font:inherit;color:var(--ink);cursor:pointer}
.bk-card:hover{border-color:var(--accent)}
.bk-cover{width:44px;height:56px;border-radius:4px 8px 8px 4px;background:var(--accent);color:var(--accent-ink);display:grid;place-items:center}
.bk-cover svg{width:22px;height:22px}
.bk-card[data-sec="silsilah"] .bk-cover{background:var(--done)}
.bk-title{font-weight:700;font-size:15.5px;line-height:1.6;word-wrap:break-word}
.bk-meta{font-size:12.5px;color:var(--ink-3)}
.bk-pill{font-size:12px;color:var(--accent);background:var(--accent-soft);border-radius:999px;padding:3px 10px;white-space:nowrap}
.bk-empty{border:1px dashed var(--line);border-radius:12px;padding:28px 16px;text-align:center;color:var(--ink-3);line-height:1.9}
/* Reader */
.bk-reader .bk-body{padding:10px 0 30px;background:var(--surface-2)}
.bk-pages{display:flex;flex-direction:column;align-items:center;gap:10px;direction:ltr}
.bk-page{background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.18);position:relative;max-width:none}
.bk-page canvas{display:block;width:100%;height:100%}
.bk-page .bk-pn{position:absolute;inset:auto 0 -20px 0;text-align:center;font-size:11px;color:var(--ink-3)}
.bk-bar{display:flex;align-items:center;justify-content:center;gap:8px;padding:8px max(14px,env(safe-area-inset-left,0px));border-top:1px solid var(--line);background:var(--surface);flex-wrap:wrap}
.bk-bar input{width:64px;text-align:center;border:1px solid var(--line);border-radius:8px;padding:6px;font:inherit;background:var(--bg);color:var(--ink)}
.bk-bar span{font-size:13px;color:var(--ink-2)}
.bk-load{padding:40px 16px;text-align:center;color:var(--ink-3)}
.mobile-dock{grid-template-columns:repeat(6,1fr)!important}
`;
const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

/* ---------- Entry points: header button + mobile dock button ---------- */
function addEntryPoints() {
  const top = document.querySelector('.actions-top');
  if (top && !top.querySelector('[data-books]')) {
    const b = document.createElement('button');
    b.className = 'btn'; b.dataset.books = '1'; b.innerHTML = ICON_BOOK + '<span>کتب</span>';
    b.addEventListener('click', openLibrary);
    top.insertBefore(b, top.firstChild);
  }
  const dock = document.querySelector('.mobile-dock');
  if (dock && !dock.querySelector('[data-books]')) {
    const b = document.createElement('button');
    b.dataset.books = '1'; b.innerHTML = ICON_BOOK + '<span>کتب</span>';
    b.addEventListener('click', openLibrary);
    dock.insertBefore(b, dock.lastElementChild);
  }
}

async function getManifest() {
  if (manifest) return manifest;
  try {
    const r = await fetch('./books/books.json', { cache: 'no-store' });
    manifest = r.ok ? await r.json() : { sunnah: [], silsilah: [] };
  } catch (e) { manifest = { sunnah: [], silsilah: [] }; }
  for (const s of SECTIONS) manifest[s.id] = manifest[s.id] || [];
  return manifest;
}

/* ---------- Overlay + Android back button ---------- */
const stack = [];
function pushLayer(el, onClose) {
  document.body.appendChild(el);
  document.documentElement.style.overflow = 'hidden';
  stack.push({ el, onClose });
  try { history.pushState({ bk: stack.length }, ''); } catch (e) {}
}
function popLayer(fromHistory) {
  const top = stack.pop(); if (!top) return;
  if (top.onClose) top.onClose();
  top.el.remove();
  if (!stack.length) document.documentElement.style.overflow = '';
  if (!fromHistory) { try { history.back(); } catch (e) {} }
}
window.addEventListener('popstate', () => { if (stack.length) popLayer(true); });

/* ---------- Library ---------- */
async function openLibrary() {
  const ov = document.createElement('div');
  ov.className = 'bk-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'کتب');
  ov.innerHTML = `<div class="bk-top"><button class="bk-ib" data-close aria-label="واپس">${ICON_BACK}</button><h2>کتب خانہ</h2></div>
    <div class="bk-body"><div class="bk-load">کتب کی فہرست کھل رہی ہے…</div></div>`;
  ov.querySelector('[data-close]').addEventListener('click', () => popLayer(false));
  pushLayer(ov);
  await getManifest();
  renderLibrary(ov);
}
function renderLibrary(ov) {
  const body = ov.querySelector('.bk-body');
  const books = manifest[section].filter(b => !query || b.title.includes(query));
  const tabs = SECTIONS.map(s => `<button role="tab" aria-selected="${s.id === section}" data-sec="${s.id}">${s.name}<small>${manifest[s.id].length}</small></button>`).join('');
  const list = books.length
    ? books.map(b => {
        const p = state.progress[b.file];
        const pill = p && p.page > 1 ? `<span class="bk-pill">صفحہ ${p.page} سے جاری رکھیں</span>` : '';
        const meta = [b.size ? (b.size / 1048576).toFixed(1) + ' MB' : '', p && p.pages ? p.pages + ' صفحات' : ''].filter(Boolean).join(' · ');
        return `<button class="bk-card" data-sec="${section}" data-file="${esc(b.file)}"><span class="bk-cover">${ICON_BOOK}</span><span><span class="bk-title">${esc(b.title)}</span><br><span class="bk-meta">${meta}</span></span>${pill}</button>`;
      }).join('')
    : `<div class="bk-empty">${query ? 'اس نام کی کوئی کتاب نہیں ملی۔' : 'اس حصے میں ابھی کوئی کتاب شامل نہیں کی گئی۔'}</div>`;
  body.innerHTML = `<div class="bk-tabs" role="tablist">${tabs}</div>
    <input class="bk-search" type="search" placeholder="کتاب کا نام تلاش کریں" value="${esc(query)}" aria-label="کتاب تلاش کریں">
    <div class="bk-list">${list}</div>`;
  body.querySelectorAll('[role="tab"]').forEach(t => t.addEventListener('click', () => { section = t.dataset.sec; state.section = section; save(); renderLibrary(ov); }));
  const s = body.querySelector('.bk-search');
  s.addEventListener('input', () => { query = s.value.trim(); const pos = s.selectionStart; renderLibrary(ov); const n = ov.querySelector('.bk-search'); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} });
  body.querySelectorAll('.bk-card').forEach(c => c.addEventListener('click', () => {
    const b = manifest[c.dataset.sec].find(x => x.file === c.dataset.file);
    if (b) openReader(b, ov);
  }));
}

/* ---------- Reader (pdf.js, renders only the pages near the screen) ---------- */
let pdfjs = null;
async function loadPdfjs() {
  if (pdfjs) return pdfjs;
  const lib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const worker = await import('pdfjs-dist/legacy/build/pdf.worker.mjs?url');
  lib.GlobalWorkerOptions.workerSrc = worker.default;
  pdfjs = lib; return lib;
}

async function openReader(book, libOv) {
  const p = prog(book.file);
  let zoom = p.zoom || 1;
  const ov = document.createElement('div');
  ov.className = 'bk-ov bk-reader'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', book.title);
  ov.innerHTML = `<div class="bk-top"><button class="bk-ib" data-close aria-label="واپس">${ICON_BACK}</button><h2>${esc(book.title)}</h2></div>
    <div class="bk-body"><div class="bk-load">کتاب کھل رہی ہے…</div><div class="bk-pages" hidden></div></div>
    <div class="bk-bar"><button class="bk-ib" data-z="-" aria-label="چھوٹا کریں">−</button><button class="bk-ib" data-z="+" aria-label="بڑا کریں">+</button>
      <span>صفحہ</span><input type="number" inputmode="numeric" min="1" aria-label="صفحہ نمبر"><span class="bk-total"></span></div>`;
  let doc = null, task = null, io = null, cur = 1, saveT = null;
  const rendered = new Map(); // pageNum -> render task
  pushLayer(ov, () => { if (io) io.disconnect(); if (task) task.destroy(); if (libOv) renderLibrary(libOv); });
  ov.querySelector('[data-close]').addEventListener('click', () => popLayer(false));

  const body = ov.querySelector('.bk-body');
  const pagesEl = ov.querySelector('.bk-pages');
  const input = ov.querySelector('.bk-bar input');
  try {
    const lib = await loadPdfjs();
    task = lib.getDocument({ url: './books/' + book.dir + '/' + encodeURIComponent(book.file), disableAutoFetch: true, rangeChunkSize: 1 << 20 });
    doc = await task.promise;
  } catch (e) {
    ov.querySelector('.bk-load').textContent = 'یہ کتاب نہیں کھل سکی۔ فائل خراب ہو سکتی ہے یا PDF نہیں ہے۔';
    return;
  }
  if (!ov.isConnected) return;
  const n = doc.numPages;
  p.pages = n; save();
  ov.querySelector('.bk-total').textContent = 'از ' + n;
  input.max = n;
  const first = await doc.getPage(1);
  const v1 = first.getViewport({ scale: 1 });
  const ratio = v1.height / v1.width;

  function pageWidth() { return Math.min(body.clientWidth - 16, 900) * zoom; }
  function layout() {
    const w = pageWidth();
    pagesEl.querySelectorAll('.bk-page').forEach(d => { d.style.width = w + 'px'; d.style.height = w * (+d.dataset.r || ratio) + 'px'; });
  }
  let html = '';
  for (let i = 1; i <= n; i++) html += `<div class="bk-page" data-n="${i}"><span class="bk-pn">${i}</span></div>`;
  pagesEl.innerHTML = html;
  ov.querySelector('.bk-load').remove();
  pagesEl.hidden = false;
  layout();

  async function render(div) {
    const i = +div.dataset.n;
    if (rendered.has(i)) return;
    rendered.set(i, true);
    try {
      const page = await doc.getPage(i);
      const base = page.getViewport({ scale: 1 });
      div.dataset.r = base.height / base.width;
      const w = pageWidth();
      div.style.height = w * div.dataset.r + 'px';
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vp = page.getViewport({ scale: (w / base.width) * dpr });
      const c = document.createElement('canvas');
      c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
      await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
      if (!rendered.has(i)) return; // dropped while rendering
      div.querySelector('canvas')?.remove();
      div.prepend(c);
    } catch (e) { rendered.delete(i); }
  }
  function drop(div) {
    const i = +div.dataset.n;
    rendered.delete(i);
    const c = div.querySelector('canvas'); if (c) { c.width = 0; c.height = 0; c.remove(); }
  }
  // Render pages near the viewport, free memory for distant ones.
  io = new IntersectionObserver(entries => {
    for (const e of entries) { if (e.isIntersecting) render(e.target); else drop(e.target); }
  }, { root: body, rootMargin: '150% 0px' });
  pagesEl.querySelectorAll('.bk-page').forEach(d => io.observe(d));

  function currentPage() {
    const mid = body.scrollTop + body.clientHeight / 3;
    let lo = 1, hi = n;
    const divs = pagesEl.children;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (divs[m - 1].offsetTop <= mid) lo = m; else hi = m - 1; }
    return lo;
  }
  function goTo(i, smooth) {
    i = Math.max(1, Math.min(n, i | 0));
    const d = pagesEl.children[i - 1];
    body.scrollTo({ top: d.offsetTop - 8, behavior: smooth ? 'smooth' : 'auto' });
  }
  body.addEventListener('scroll', () => {
    const c = currentPage();
    if (c !== cur) { cur = c; if (document.activeElement !== input) input.value = c; }
    clearTimeout(saveT); saveT = setTimeout(() => { p.page = cur; p.zoom = zoom; p.at = Date.now(); save(); }, 400);
  }, { passive: true });
  input.addEventListener('change', () => goTo(+input.value, false));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { input.blur(); goTo(+input.value, false); } });
  ov.querySelectorAll('[data-z]').forEach(b => b.addEventListener('click', () => {
    const keep = cur;
    zoom = Math.max(0.6, Math.min(3, zoom * (b.dataset.z === '+' ? 1.25 : 0.8)));
    pagesEl.querySelectorAll('.bk-page').forEach(drop);
    layout(); goTo(keep, false);
    io.disconnect(); pagesEl.querySelectorAll('.bk-page').forEach(d => io.observe(d));
    p.zoom = zoom; save();
  }));
  window.addEventListener('resize', () => { if (ov.isConnected) { const keep = cur; layout(); goTo(keep, false); } });

  cur = p.page || 1; input.value = cur;
  requestAnimationFrame(() => goTo(cur, false));
}

addEntryPoints();
