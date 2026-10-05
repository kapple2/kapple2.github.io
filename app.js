(() => {
  const view = document.getElementById("view");
  const routes = {
    "/": "tpl-home",
    "/about": "tpl-about",
    "/cafe": "tpl-cafe",
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

  window.addEventListener("hashchange", render);

  if (!location.hash) {
    location.replace("#/");
  } else {
    render();
  }
})();
