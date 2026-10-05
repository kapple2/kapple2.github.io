(() => {
  const STORAGE_KEY = "kapple2TranslateLang";
  const PAGE_LANG = "ko";
  const LANGS = [
    { code: "ko", label: "한국어", flag: "kr", emoji: "🇰🇷" },
    { code: "en", label: "English", flag: "us", emoji: "🇺🇸" },
    { code: "ja", label: "日本語", flag: "jp", emoji: "🇯🇵" },
    { code: "zh-CN", label: "简体中文", flag: "cn", emoji: "🇨🇳" },
    { code: "zh-TW", label: "繁體中文", flag: "tw", emoji: "🇹🇼" },
    { code: "es", label: "Español", flag: "es", emoji: "🇪🇸" },
    { code: "fr", label: "Français", flag: "fr", emoji: "🇫🇷" },
    { code: "de", label: "Deutsch", flag: "de", emoji: "🇩🇪" },
  ];

  let applyTimer = null;

  function langByCode(code) {
    return LANGS.find((lang) => lang.code === code) || null;
  }

  function flagImg(lang, className) {
    if (!lang || !lang.flag) {
      return `<span class="${className}" aria-hidden="true">${(lang && lang.emoji) || "🌐"}</span>`;
    }
    return `<img class="${className}" src="https://flagcdn.com/w40/${lang.flag}.png" alt="" width="20" height="15" loading="lazy" decoding="async">`;
  }

  function setToggleFlag(code) {
    const toggle = document.getElementById("trnToggle");
    const lang = langByCode(code);
    if (!toggle) return;
    toggle.innerHTML = flagImg(lang, "trn-toggle-flag");
    toggle.setAttribute("aria-label", lang ? `Language: ${lang.label}` : "Select language");
  }

  function getSavedLang() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function saveLang(code) {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  }

  function clearGoogTransCookie() {
    const host = location.hostname;
    document.cookie = "googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    if (host && host.includes(".")) {
      document.cookie = `googtrans=;path=/;domain=${host};expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      const parts = host.split(".");
      if (parts.length > 2) {
        const root = "." + parts.slice(-2).join(".");
        document.cookie = `googtrans=;path=/;domain=${root};expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    }
  }

  function setGoogTransCookie(code) {
    const value = `/${PAGE_LANG}/${code}`;
    const maxAge = 31536000;
    const host = location.hostname;
    document.cookie = `googtrans=${value};path=/;max-age=${maxAge};SameSite=Lax`;
    if (host && host.includes(".")) {
      document.cookie = `googtrans=${value};path=/;domain=${host};max-age=${maxAge};SameSite=Lax`;
      const parts = host.split(".");
      if (parts.length > 2) {
        const root = "." + parts.slice(-2).join(".");
        document.cookie = `googtrans=${value};path=/;domain=${root};max-age=${maxAge};SameSite=Lax`;
      }
    }
  }

  function applyCombo(code) {
    const combo = document.querySelector(".goog-te-combo");
    if (!combo || !combo.options || !combo.options.length) return false;
    const ok = Array.prototype.some.call(combo.options, (opt) => opt.value === code);
    if (!ok) return false;
    combo.value = code;
    combo.dispatchEvent(new Event("change", { bubbles: true }));
    combo.dispatchEvent(new Event("input", { bubbles: true }));
    return combo.value === code;
  }

  function applyLang(code) {
    let tries = 0;
    if (applyTimer) clearInterval(applyTimer);
    applyCombo(code);
    applyTimer = setInterval(() => {
      tries += 1;
      if (applyCombo(code) || tries >= 25) {
        clearInterval(applyTimer);
        applyTimer = null;
      }
    }, 200);
  }

  function closeMenu() {
    const menu = document.getElementById("trnMenu");
    const toggle = document.getElementById("trnToggle");
    if (menu) menu.classList.remove("open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  function mountSwitcher() {
    const host = document.getElementById("trnHost");
    if (!host || document.getElementById("trnSwitcher")) return;

    const saved = getSavedLang() || PAGE_LANG;
    if (saved && saved !== PAGE_LANG) setGoogTransCookie(saved);

    const current = langByCode(saved);
    const wrap = document.createElement("div");
    wrap.className = "trn-switcher notranslate";
    wrap.id = "trnSwitcher";
    wrap.setAttribute("translate", "no");
    wrap.innerHTML =
      `<button class="trn-toggle" id="trnToggle" type="button" aria-label="${current ? `Language: ${current.label}` : "Select language"}" aria-haspopup="true" aria-expanded="false">${flagImg(current, "trn-toggle-flag")}</button>` +
      '<div class="trn-menu" id="trnMenu" role="menu" aria-label="Language selection">' +
      LANGS.map((lang) => {
        return `<button class="trn-option" type="button" data-lang="${lang.code}" role="menuitem">${flagImg(lang, "trn-flag")}<span class="trn-option-label">${lang.label}</span></button>`;
      }).join("") +
      "</div>";

    host.appendChild(wrap);

    if (!document.getElementById("google_translate_element")) {
      const el = document.createElement("div");
      el.id = "google_translate_element";
      el.setAttribute("aria-hidden", "true");
      document.body.appendChild(el);
    }

    const toggle = document.getElementById("trnToggle");
    const menu = document.getElementById("trnMenu");
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.addEventListener("click", (e) => e.stopPropagation());
    document.addEventListener("click", closeMenu);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });

    menu.querySelectorAll(".trn-option").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const code = btn.getAttribute("data-lang");
        if (!code) return;
        saveLang(code);
        setToggleFlag(code);
        if (code === PAGE_LANG) clearGoogTransCookie();
        else setGoogTransCookie(code);
        applyLang(code);
        closeMenu();
      });
    });
  }

  window.googleTranslateElementInit = function googleTranslateElementInit() {
    if (!(window.google && google.translate && google.translate.TranslateElement)) return;
    new google.translate.TranslateElement(
      { pageLanguage: PAGE_LANG, autoDisplay: false },
      "google_translate_element"
    );
    const saved = getSavedLang();
    if (saved && saved !== PAGE_LANG) {
      window.setTimeout(() => {
        const translated =
          document.body.classList.contains("translated-ltr") ||
          document.body.classList.contains("translated-rtl") ||
          document.documentElement.classList.contains("translated-ltr") ||
          document.documentElement.classList.contains("translated-rtl");
        if (!translated) applyLang(saved);
      }, 650);
    }
  };

  mountSwitcher();

  if (!document.querySelector('script[src*="translate.google.com/translate_a/element.js"]')) {
    const s = document.createElement("script");
    s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    s.async = true;
    document.head.appendChild(s);
  }
})();
