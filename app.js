(() => {
  const view = document.getElementById("view");
  const routes = {
    "/": "tpl-home",
    "/about": "tpl-about",
    "/company": "tpl-company",
    "/repo": "tpl-repo",
  };

  function pathFromHash() {
    const raw = location.hash.replace(/^#/, "") || "/";
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    return path.split("?")[0] || "/";
  }

  function setActiveNav(path) {
    document.querySelectorAll(".nav-links a[data-link]").forEach((a) => {
      const href = a.getAttribute("href") || "";
      const linkPath = href.replace(/^#/, "") || "/";
      a.classList.toggle("active", linkPath === path);
    });
  }

  function render() {
    const path = pathFromHash();
    const tplId = routes[path] || routes["/"];
    const tpl = document.getElementById(tplId);
    if (!tpl) return;

    const next = tpl.content.cloneNode(true);
    view.replaceChildren(next);
    initSamStage();
    view.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "smooth" });
    setActiveNav(routes[path] ? path : "/");

    // restart enter animation
    view.style.animation = "none";
    // force reflow
    void view.offsetWidth;
    view.style.animation = "";
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-link]");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href || !href.startsWith("#/")) return;
    e.preventDefault();
    if (location.hash !== href) {
      location.hash = href.slice(1);
    } else {
      render();
    }
  });

  // Speak a hint with SAM (Software Automatic Mouth, assets/samjs.min.js)
  // when hovering an element with data-tts. "Little Robot" voice preset.
  let samCurrent = null;
  let samTimer = 0;
  function samStop() {
    clearTimeout(samTimer);
    if (samCurrent) {
      const p = samCurrent;
      samCurrent = null;
      try { p.abort("stop"); } catch (_) {}
    }
  }
  function samSpeak(text) {
    if (typeof SamJs === "undefined") return;
    // Autoplay policy: stay silent until the visitor has interacted with the page,
    // otherwise the suspended audio would start late, at the first click.
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    samStop();
    samTimer = setTimeout(() => {
      try {
        const sam = new SamJs({ speed: 92, pitch: 60, throat: 190, mouth: 190 });
        const p = sam.speak(text);
        samCurrent = p;
        p.catch(() => {}); // aborted or blocked by autoplay policy
      } catch (_) {}
    }, 80);
  }
  document.addEventListener("mouseover", (e) => {
    const el = e.target.closest("[data-tts]");
    if (!el || el.contains(e.relatedTarget)) return;
    samSpeak(el.dataset.tts);
  });
  document.addEventListener("mouseout", (e) => {
    const el = e.target.closest("[data-tts]");
    if (el && !el.contains(e.relatedTarget)) samStop();
  });

  // About page: drag the S.A.M. card onto the computer to hear the hint.
  const SAM_PHRASE = "If you want to see my homepage, click on the computer.";
  let samIdleTimer = 0;
  let samAlertTimer = 0;
  let samBubbleTimer = 0;

  function stopSamStage() {
    clearInterval(samIdleTimer);
    clearTimeout(samAlertTimer);
    clearTimeout(samBubbleTimer);
    samStop();
  }

  function initSamStage() {
    stopSamStage();
    const card = view.querySelector("#sam-card");
    const comp = view.querySelector(".about-computer img");
    if (!card || !comp) return;
    const bubble = card.querySelector(".sam-bubble");
    const ASK = "저를 끌어다 컴퓨터에 놓아 주세요!";
    const THANKS = "고마워요! 컴퓨터를 클릭하세요!";
    let dragging = false;
    let sx = 0, sy = 0;

    const overComputer = () => {
      const c = card.getBoundingClientRect();
      const r = comp.getBoundingClientRect();
      const cx = c.left + c.width / 2;
      const cy = c.top + c.height / 2;
      return cx > r.left && cx < r.right && cy > r.top && cy < r.bottom;
    };

    const say = (text, ms) => {
      bubble.textContent = text;
      card.classList.add("alert");
      clearTimeout(samAlertTimer);
      samAlertTimer = setTimeout(() => card.classList.remove("alert"), ms);
    };

    const drop = () => {
      say(THANKS, 5000);
      samSpeak(SAM_PHRASE);
    };

    // Jump, shake and ask now and then.
    const nudge = () => {
      if (dragging || card.classList.contains("alert")) return;
      say(ASK, 3500);
    };
    samBubbleTimer = setTimeout(nudge, 1200);
    samIdleTimer = setInterval(nudge, 7000);

    card.addEventListener("pointerdown", (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true;
      sx = e.clientX;
      sy = e.clientY;
      card.setPointerCapture(e.pointerId);
      card.classList.remove("alert");
      card.classList.add("dragging");
      e.preventDefault();
    });
    card.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      card.style.transform = `translate(${e.clientX - sx}px, ${e.clientY - sy}px) scale(1.08)`;
      comp.classList.toggle("drop-ready", overComputer());
    });
    const end = (e) => {
      if (!dragging) return;
      dragging = false;
      const hit = overComputer();
      card.classList.remove("dragging");
      comp.classList.remove("drop-ready");
      card.style.transform = "";
      if (card.hasPointerCapture(e.pointerId)) card.releasePointerCapture(e.pointerId);
      if (hit && e.type === "pointerup") drop();
    };
    card.addEventListener("pointerup", end);
    card.addEventListener("pointercancel", end);
    // Keyboard alternative: Enter or Space does the same as dropping on the computer.
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        drop();
      }
    });
  }

  window.addEventListener("hashchange", render);

  if (!location.hash) {
    location.replace("#/");
  } else {
    render();
  }
})();
