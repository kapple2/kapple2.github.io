(() => {
  const STORAGE_KEY = "kapple2Theme";
  const MODES = ["system", "light", "dark"];
  const LABELS = {
    system: "시스템 테마",
    light: "라이트 테마",
    dark: "다크 테마",
  };
  const ICONS = {
    system: "◐",
    light: "☀",
    dark: "☾",
  };

  function getSavedMode() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark" || saved === "system") return saved;
    } catch {
      /* ignore */
    }
    return "system";
  }

  function saveMode(mode) {
    try {
      if (mode === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }

  function applyMode(mode) {
    const root = document.documentElement;
    if (mode === "light" || mode === "dark") root.setAttribute("data-theme", mode);
    else root.removeAttribute("data-theme");
  }

  function updateToggle(mode) {
    const btn = document.getElementById("themeToggle");
    if (!btn) return;
    btn.textContent = ICONS[mode] || ICONS.system;
    btn.setAttribute("aria-label", LABELS[mode] || LABELS.system);
    btn.title = LABELS[mode] || LABELS.system;
  }

  function setMode(mode) {
    applyMode(mode);
    saveMode(mode);
    updateToggle(mode);
  }

  function nextMode(mode) {
    const i = MODES.indexOf(mode);
    return MODES[(i + 1) % MODES.length];
  }

  function mount() {
    const host = document.getElementById("themeHost");
    if (!host || document.getElementById("themeToggle")) return;

    const mode = getSavedMode();
    applyMode(mode);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle notranslate";
    btn.id = "themeToggle";
    btn.setAttribute("translate", "no");
    btn.textContent = ICONS[mode];
    btn.setAttribute("aria-label", LABELS[mode]);
    btn.title = LABELS[mode];
    btn.addEventListener("click", () => {
      setMode(nextMode(getSavedMode()));
    });
    host.appendChild(btn);
  }

  mount();

  // Keep in sync if OS theme changes while on "system"
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  const onChange = () => {
    if (getSavedMode() === "system") applyMode("system");
  };
  if (mq.addEventListener) mq.addEventListener("change", onChange);
  else if (mq.addListener) mq.addListener(onChange);
})();
