// KAPPLE ][ emulator page only: a "아시모프" button in the computer's toolbar opens a small window that
// browses the folders of the Apple II mirror (mirrors.apple2.org.za) and lists its disk files. The mirror cannot
// be shown in an iframe (it sends X-Frame-Options: SAMEORIGIN), so the window reads each folder listing and draws
// its own list. Only folders and disk files (.dsk, .do, .po) are listed; each disk file gets a Play! button, which
// opens this emulator with that file in drive 1. Listings are cached (localStorage, 7 days) so the server is not
// asked again; the 새로고침 button fetches the current folder again.

(() => {
  // The start folder is the root of the window: the window never goes above it, and never leaves it.
  const START = "https://mirrors.apple2.org.za/ftp.apple.asimov.net/images/";
  const DISK = /\.(dsk|do|po)$/i;
  const CACHE_KEY = "kapple2MirrorListings";
  const CACHE_MS = 7 * 24 * 60 * 60 * 1000;
  const CACHE_MAX_FOLDERS = 300;

  const CSS = `
    .mirror-open {
      background: #44372c;
      color: #b8ff7a;
      border: 1px outset #66594e;
      border-radius: 3px;
      padding: 2px 8px;
      font-family: inherit;
      font-size: 15px;
      text-shadow: 0 0 6px #7dff3a, 0 0 2px #7dff3a;
      cursor: pointer;
    }
    .mirror-open:hover { background-color: #55473d; }
    .mirror-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.55);
      padding: 12px;
    }
    .mirror-overlay.open { display: flex; }
    .mirror-window, .mirror-window * { box-sizing: border-box; }
    .mirror-window {
      width: min(640px, 100%);
      height: min(560px, 84vh); /* fixed size, so the window does not change when the folder changes */
      display: flex;
      flex-direction: column;
      background: var(--bg2);
      color: var(--ink);
      border: 1px solid var(--line);
      border-radius: 10px;
      box-shadow: var(--shadow);
      font-family: var(--font-sans);
      font-size: 15px;
    }
    .mirror-head {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
    }
    .mirror-title {
      flex: 1;
      min-width: 0;
      font-weight: 600;
      color: var(--heading);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .mirror-window button {
      font: inherit;
      font-size: 13px;
      border: 1px solid var(--line);
      background: var(--ghost-bg);
      color: var(--heading);
      border-radius: 6px;
      padding: 4px 10px;
      cursor: pointer;
    }
    .mirror-window button:hover { border-color: var(--accent-dim); }
    .mirror-window button:disabled { opacity: 0.4; cursor: default; }
    .mirror-play {
      background: var(--accent-dim) !important;
      color: #fff !important;
      border-color: var(--btn-border) !important;
      font-weight: 600;
    }
    .mirror-list {
      list-style: none;
      margin: 0;
      padding: 4px 0;
      overflow-y: auto;
      flex: 1 1 0;
      min-height: 0;
    }
    .mirror-list li {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-bottom: 1px solid var(--line);
    }
    .mirror-name {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .mirror-name.dir { color: var(--accent); cursor: pointer; font-weight: 600; }
    .mirror-status { padding: 14px 12px; color: var(--muted); }
    .mirror-foot {
      padding: 8px 12px;
      border-top: 1px solid var(--line);
      font-size: 13px;
      color: var(--muted);
    }
    .mirror-foot a { color: var(--accent); }
  `;

  let overlay = null;
  let listEl = null;
  let titleEl = null;
  let upBtn = null;
  let refreshBtn = null;
  let srcLink = null;
  let current = START;
  let loadToken = 0;
  const memory = new Map(); // listings seen in this page, used when localStorage is not available

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function setStatus(text) {
    listEl.replaceChildren(el("li", "mirror-status", text));
  }

  // ---- folder tree -------------------------------------------------------

  // The folder above `url`, or null at the root (START) and anywhere outside it.
  function parentOf(url) {
    if (url === START) return null;
    const up = new URL("..", url).href;
    return up.startsWith(START) ? up : null;
  }

  // Decode a percent-encoded name. The mirror writes some names in Latin-1 (%ED is í, not UTF-8),
  // which decodeURIComponent rejects; those runs are decoded byte by byte instead.
  function decodeName(text) {
    return text.replace(/(?:%[0-9A-Fa-f]{2})+/g, (run) => {
      try {
        return decodeURIComponent(run);
      } catch (e) {
        return run.replace(/%([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
      }
    });
  }

  function folderTitle(url) {
    return decodeName(new URL(url).pathname) || "/";
  }

  // ---- cache -------------------------------------------------------------

  function readStore() {
    try {
      return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function writeStore(store) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(store));
    } catch (e) {
      /* storage full or blocked: the memory copy still works for this page */
    }
  }

  function readCache(url) {
    const fresh = (c) => c && Date.now() - c.at < CACHE_MS;
    const m = memory.get(url);
    if (fresh(m)) return m.entries;
    const c = readStore()[url];
    if (fresh(c)) {
      memory.set(url, c);
      return c.entries;
    }
    return null;
  }

  function writeCache(url, entries) {
    const record = { at: Date.now(), entries };
    memory.set(url, record);
    const store = readStore();
    store[url] = record;
    const keys = Object.keys(store);
    if (keys.length > CACHE_MAX_FOLDERS) {
      keys.sort((a, b) => store[a].at - store[b].at)
        .slice(0, keys.length - CACHE_MAX_FOLDERS)
        .forEach((k) => delete store[k]);
    }
    writeStore(store);
  }

  // ---- listing -----------------------------------------------------------

  async function fetchEntries(url) {
    const res = await fetch(url, { credentials: "omit" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const doc = new DOMParser().parseFromString(await res.text(), "text/html");
    const seen = new Set();
    const entries = [];
    doc.querySelectorAll("a[href]").forEach((a) => {
      const raw = a.getAttribute("href") || "";
      // only links inside this folder: relative names, no site navigation or sort links
      if (!raw || raw.startsWith("/") || raw.startsWith("#") || raw.startsWith("?") || raw.startsWith("..") || /^[a-z]+:/i.test(raw)) return;
      const abs = new URL(raw, url).href;
      if (!abs.startsWith(START) || abs === url || seen.has(abs)) return;
      seen.add(abs);
      const dir = raw.endsWith("/");
      const name = decodeName(raw.replace(/\/$/, ""));
      if (dir || DISK.test(name)) entries.push({ url: abs, dir, name });
    });
    entries.sort((x, y) => (y.dir - x.dir) || x.name.localeCompare(y.name, "en", { sensitivity: "base" }));
    return entries;
  }

  function renderEntries(entries) {
    if (!entries.length) {
      setStatus("이 폴더에 폴더나 디스크 파일이 없습니다.");
      return;
    }
    const items = entries.map((entry) => {
      const li = el("li");
      if (entry.dir) {
        const name = el("span", "mirror-name dir", entry.name + "/");
        name.addEventListener("click", () => load(entry.url));
        li.append(name);
      } else {
        li.append(el("span", "mirror-name", entry.name));
        const play = el("button", "mirror-play", "Play!");
        play.type = "button";
        play.addEventListener("click", () => playFile(entry.url));
        li.append(play);
      }
      return li;
    });
    listEl.replaceChildren(...items);
  }

  function renderError() {
    const li = el("li", "mirror-status");
    li.append("목록을 불러오지 못했습니다. ");
    const a = el("a", "", "원본 페이지를 새 탭에서 열기");
    a.href = current;
    a.target = "_blank";
    a.rel = "noopener";
    li.append(a);
    listEl.replaceChildren(li);
  }

  function playFile(url) {
    // Reload this emulator page with the disk in drive 1 (the emulator reads d1= from the address).
    location.href = location.pathname + "?d1=" + encodeURIComponent(url);
  }

  // Show a folder. Uses the cached listing unless `force` is set.
  async function load(url, force) {
    const token = ++loadToken;
    current = url;
    titleEl.textContent = folderTitle(url);
    srcLink.href = url;
    upBtn.disabled = parentOf(url) === null;

    const cached = force ? null : readCache(url);
    if (cached) {
      renderEntries(cached);
      return;
    }
    setStatus("불러오는 중...");
    try {
      const entries = await fetchEntries(url);
      if (token !== loadToken) return; // the user has moved on to another folder
      writeCache(url, entries);
      renderEntries(entries);
    } catch (err) {
      if (token === loadToken) renderError();
    }
  }

  // ---- window ------------------------------------------------------------

  function openWindow() {
    overlay.classList.add("open");
    load(START);
  }

  function closeWindow() {
    overlay.classList.remove("open");
  }

  function build() {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    // the button goes in the computer's toolbar, right after the paste button
    const paste = document.querySelector('button[onclick="Apple2.paste()"]');
    if (paste) {
      const openBtn = el("button", "mirror-open", "아시모프");
      openBtn.type = "button";
      openBtn.title = "Apple II 디스크 자료 (mirrors.apple2.org.za)";
      openBtn.addEventListener("click", openWindow);
      paste.insertAdjacentElement("afterend", openBtn);
    }

    overlay = el("div", "mirror-overlay");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "아시모프 디스크 자료");
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeWindow(); });

    const win = el("div", "mirror-window");
    const head = el("div", "mirror-head");

    upBtn = el("button", "", "상위");
    upBtn.type = "button";
    upBtn.title = "한 단계 위 폴더";
    upBtn.addEventListener("click", () => {
      const up = parentOf(current);
      if (up) load(up);
    });

    titleEl = el("div", "mirror-title", "");

    refreshBtn = el("button", "", "새로고침");
    refreshBtn.type = "button";
    refreshBtn.title = "이 폴더 목록을 서버에서 다시 받기";
    refreshBtn.addEventListener("click", () => load(current, true));

    const closeBtn = el("button", "", "닫기");
    closeBtn.type = "button";
    closeBtn.addEventListener("click", closeWindow);

    head.append(upBtn, titleEl, refreshBtn, closeBtn);

    listEl = el("ul", "mirror-list");

    const foot = el("div", "mirror-foot");
    foot.append("자료 출처: Apple II Documentation Project 미러 · ");
    srcLink = el("a", "", "원본 페이지");
    srcLink.href = START;
    srcLink.target = "_blank";
    srcLink.rel = "noopener";
    foot.append(srcLink);

    win.append(head, listEl, foot);
    overlay.append(win);
    document.body.appendChild(overlay);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("open")) closeWindow();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
