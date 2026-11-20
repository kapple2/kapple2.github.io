// Company page: while the mouse is over the dancing clown, the middle part of the Bongsan mask-dance tune
// (assets/bongsan-talchum.mp3) loops; when the mouse leaves the clown, it stops.
(() => {
  const SRC = "assets/bongsan-talchum.mp3";
  const CLIP_SECONDS = 10;   // length of the looped part, cut from the middle of the file
  const FADE_SECONDS = 0.12; // short fade so the loop does not click when it stops

  let ctx = null;
  let buffer = null;
  let loading = null;
  let source = null;
  let gain = null;
  let clip = { start: 0, end: 0 };
  let hovering = false;

  function getContext() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    return ctx;
  }

  function loadBuffer() {
    if (buffer) return Promise.resolve(buffer);
    if (!loading) {
      loading = fetch(SRC)
        .then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.arrayBuffer();
        })
        .then((data) => getContext().decodeAudioData(data))
        .then((decoded) => {
          buffer = decoded;
          const mid = decoded.duration / 2;
          clip.start = Math.max(0, mid - CLIP_SECONDS / 2);
          clip.end = Math.min(decoded.duration, clip.start + CLIP_SECONDS);
          return buffer;
        })
        .catch(() => {
          loading = null; // try again on the next hover
          return null;
        });
    }
    return loading;
  }

  function startClip() {
    const c = getContext();
    if (!c) return;
    if (c.state !== "running") c.resume().catch(() => {});
    loadBuffer().then((b) => {
      if (!b || !hovering || source) return;
      gain = c.createGain();
      gain.gain.setValueAtTime(1, c.currentTime);
      gain.connect(c.destination);
      source = c.createBufferSource();
      source.buffer = b;
      source.loop = true;
      source.loopStart = clip.start;
      source.loopEnd = clip.end;
      source.connect(gain);
      source.start(0, clip.start);
    });
  }

  function stopClip() {
    if (!source || !ctx) return;
    const s = source;
    const g = gain;
    source = null;
    gain = null;
    const now = ctx.currentTime;
    g.gain.setValueAtTime(g.gain.value, now);
    g.gain.linearRampToValueAtTime(0, now + FADE_SECONDS);
    setTimeout(() => {
      try { s.stop(); } catch (e) { /* already stopped */ }
      g.disconnect();
    }, FADE_SECONDS * 1000 + 30);
  }

  const dancerOf = (node) =>
    node && node.closest ? node.closest(".fiction-dance") : null;

  document.addEventListener("mouseover", (e) => {
    const dancer = dancerOf(e.target);
    if (dancer && !hovering) {
      hovering = true;
      startClip();
    }
  });

  document.addEventListener("mouseout", (e) => {
    const dancer = dancerOf(e.target);
    if (dancer && !dancer.contains(e.relatedTarget)) {
      hovering = false;
      stopClip();
    }
  });

  // browsers only let audio start after a click or key press on the page; resume on the first one
  const unlock = () => {
    if (ctx && ctx.state !== "running") ctx.resume().catch(() => {});
  };
  document.addEventListener("pointerdown", unlock, true);
  document.addEventListener("keydown", unlock, true);

  // the company page is a hash route: leaving it while hovering must stop the music
  window.addEventListener("hashchange", () => {
    hovering = false;
    stopClip();
  });
})();
