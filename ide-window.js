(() => {
  const WIDTH = 1024;
  const HEIGHT = 768;
  const NAME = "kapple2-web-ide";
  const FEATURES = [
    "popup=yes",
    `width=${WIDTH}`,
    `height=${HEIGHT}`,
    "menubar=no",
    "toolbar=no",
    "location=no",
    "status=no",
    "scrollbars=no",
    "resizable=yes",
  ].join(",");

  // Keep the popup at least WIDTH x HEIGHT (its inner size), if the user shrinks it.
  // The popup navigates to web-ide, which replaces its window object, so the
  // check is re-attached to each new page by watching for a fresh window.
  function enforceMinSize(popup) {
    let attachedTo = null;
    const enforce = () => {
      if (popup.innerWidth >= WIDTH && popup.innerHeight >= HEIGHT) return;
      const w = Math.max(WIDTH, popup.outerWidth + (WIDTH - popup.innerWidth));
      const h = Math.max(HEIGHT, popup.outerHeight + (HEIGHT - popup.innerHeight));
      popup.resizeTo(w, h);
    };
    const timer = setInterval(() => {
      if (popup.closed) return clearInterval(timer);
      try {
        if (popup.document.readyState === "loading") return;
        if (popup !== attachedTo) {
          attachedTo = popup;
          popup.addEventListener("resize", enforce);
          enforce();
        }
      } catch (e) {
        /* not our page yet */
      }
    }, 150);
    setTimeout(() => clearInterval(timer), 15000);
  }

  document.querySelectorAll("a[data-ide-open]").forEach((a) => {
    a.addEventListener("click", (e) => {
      const popup = window.open(a.href, a.dataset.popupName || NAME, FEATURES);
      if (!popup) return; // blocked: let the link open normally
      e.preventDefault();
      popup.focus();
      enforceMinSize(popup);
    });
  });
})();
