(() => {
  const ALLOWED_PREFIX = "text/";
  const titleEl = document.getElementById("readerTitle");
  const bodyEl = document.getElementById("readerBody");
  const metaEl = document.getElementById("readerMeta");

  function queryFile() {
    const params = new URLSearchParams(location.search);
    let file = (params.get("f") || params.get("file") || "").trim();
    if (file) return file;

    const hash = (location.hash || "").replace(/^#/, "").trim();
    if (!hash) return "";

    if (hash.startsWith("text/")) return hash;

    const hashParams = new URLSearchParams(hash.includes("=") ? hash : "");
    file = (hashParams.get("f") || hashParams.get("file") || "").trim();
    return file;
  }

  function normalizePath(raw) {
    let path = raw.replace(/\\/g, "/").replace(/^\/+/, "");
    // allow passing without text/ prefix
    if (path && !path.startsWith(ALLOWED_PREFIX) && !path.includes("/")) {
      path = ALLOWED_PREFIX + path;
    }
    return path;
  }

  function isSafePath(path) {
    if (!path.startsWith(ALLOWED_PREFIX)) return false;
    if (path.includes("..")) return false;
    if (!/\.(txt|md|text)$/i.test(path)) return false;
    return true;
  }

  function linkify(text) {
    const esc = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return esc.replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener">$1</a>'
    );
  }

  function renderText(raw, path) {
    const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

    // Drop leading empty lines
    while (lines.length && !lines[0].trim()) lines.shift();

    let meta = "";
    let title = "";
    let start = 0;

    // Optional first-line meta (e.g. "original english, https://...")
    if (lines[0] && /https?:\/\//i.test(lines[0]) && lines[0].length < 300) {
      meta = lines[0].trim();
      start = 1;
      while (start < lines.length && !lines[start].trim()) start += 1;
    }

    // Optional title: next non-empty short-ish line before a blank
    if (start < lines.length && lines[start].trim()) {
      const candidate = lines[start].trim();
      const nextBlank =
        start + 1 >= lines.length || !lines[start + 1].trim();
      if (candidate.length <= 80 && nextBlank) {
        title = candidate;
        start += 1;
        while (start < lines.length && !lines[start].trim()) start += 1;
      }
    }

    if (!title) {
      const base = path.split("/").pop() || path;
      title = base.replace(/\.[^.]+$/, "");
    }

    const blocks = [];
    let buf = [];
    for (let i = start; i < lines.length; i += 1) {
      const line = lines[i];
      if (!line.trim()) {
        if (buf.length) {
          blocks.push(buf.join(" ").replace(/\s+/g, " ").trim());
          buf = [];
        }
      } else {
        buf.push(line.trim());
      }
    }
    if (buf.length) blocks.push(buf.join(" ").replace(/\s+/g, " ").trim());

    document.title = `${title} — KAPPLE ][`;
    titleEl.textContent = title;

    if (meta) {
      metaEl.hidden = false;
      metaEl.innerHTML = linkify(meta);
    } else {
      metaEl.hidden = true;
      metaEl.textContent = "";
    }

    bodyEl.innerHTML = blocks.map((p) => `<p>${linkify(p)}</p>`).join("");
  }

  function showError(message) {
    titleEl.textContent = "텍스트를 불러올 수 없습니다";
    document.title = "읽기 오류 — KAPPLE ][";
    metaEl.hidden = true;
    bodyEl.innerHTML = `<p class="reader-error">${linkify(message)}</p>`;
  }

  async function load() {
    const rawPath = queryFile();
    if (!rawPath) {
      showError("파일 경로가 없습니다. 예: read.html?f=text/example.txt");
      return;
    }

    const path = normalizePath(rawPath);
    if (!isSafePath(path)) {
      showError("허용되지 않은 경로입니다. text/ 아래 .txt 파일만 읽을 수 있습니다.");
      return;
    }

    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      renderText(text, path);
    } catch (err) {
      showError(`파일을 열 수 없습니다: ${path}`);
    }
  }

  load();
})();
