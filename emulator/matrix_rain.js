// KAPPLE ][ emulator page only: when the page opens, Matrix-like characters fall down the screen behind the page.
// The amount grows as time goes by, is at its most in the middle of the show, and thins out again; when the show is
// over what is still on the screen falls away faster and faster and the canvas is removed.
// The characters are in a fixed canvas behind the page (z-index -1), so nothing is covered and nothing can be clicked
// by mistake (pointer-events: none). Skipped for visitors who ask for reduced motion.
(function () {
  'use strict';
  var html = document.documentElement;
  if (!html.classList.contains('mr-intro')) { return; }   // index.html sets it: no show for reduced motion or a disk in the address

  var SHOW_MS = 8400;        // the show: the amount goes up, peaks in the middle and goes down; then the rest falls away
  var FADE_IN_MS = 700;
  var FADE_START = 6000;     // the black page starts to fade out (the page background and the emulator come in) ...
  var FADE_MS = 4500;        // ... and is fully there when the rain has ended
  var FS = 24;               // character size, px (35% bigger than the first version's 18)
  var SPEED = 0.9;           // rows per second factor: 24 px rows at 0.9 = 20% faster in px/s than 18 px rows at 1.0
  var PEAK = 1.5;            // drops at the peak per column (the first version had about 1 per column, now 50% more)
  var CHARS = 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㄲㄸㅃㅆㅉㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣㅐㅔ';

  var cv = document.createElement('canvas');
  cv.id = 'matrix-rain';
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;z-index:2147483001;pointer-events:none;';   // above the black, below nothing: it is the show
  document.body.insertBefore(cv, document.body.firstChild);
  var ctx = cv.getContext('2d');
  if (!ctx) { cv.remove(); finish(); return; }

  var dpr = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0, rows = 0, cols = 0;
  function size() {
    W = window.innerWidth; H = window.innerHeight; rows = Math.ceil(H / FS); cols = Math.ceil(W / FS);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  window.addEventListener('resize', size);

  // the colour of the page's green (styles.css --crt: brighter on the dark theme, deeper on the light one)
  function crt() {
    var c = '';
    try { c = getComputedStyle(document.documentElement).getPropertyValue('--crt').trim(); } catch (e) { /* ignore */ }
    return c || '#39ff6a';
  }
  var green = '#39ff6a';   // the rain is on black: always the bright green (crt() is for the light theme)

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function ch() { return CHARS.charAt((Math.random() * CHARS.length) | 0); }

  function newDrop() {
    var len = Math.round(rnd(8, 22));
    return { x: ((Math.random() * cols) | 0) * FS, speed: rnd(7, 20) * SPEED, len: len, y: -rnd(0, len * 0.6), cells: [], row: -1 };
  }

  // how much there is at a moment of the show, 0..1: a slow start, the most in the middle, thinning out at the end
  function amount(age) {
    var p = Math.max(0, Math.min(1, age / SHOW_MS));
    return 0.1 + 0.9 * Math.sin(Math.PI * p);
  }

  var drops = [];
  var t0 = performance.now(), last = t0, showing = true, revealed = false, done = false;

  function reveal() {
    revealed = true;
    html.style.setProperty('--mr-fade', FADE_MS + 'ms');
    html.classList.add('mr-reveal');
  }
  function finish() {
    if (done) { return; }
    done = true;
    html.classList.remove('mr-intro', 'mr-reveal');
    html.style.removeProperty('--mr-fade');
    try { window.dispatchEvent(new Event('kapple-intro-done')); } catch (e) { /* ignore */ }
  }

  function frame(now) {
    var dt = Math.min(0.1, (now - last) / 1000), age = now - t0, i, d, k, row, a, head, keep = [];
    last = now;
    if (showing && age > SHOW_MS) { showing = false; }
    if (!revealed && age >= FADE_START) { reveal(); }
    if (!done && age >= FADE_START + FADE_MS) { finish(); }
    if (showing) {                                        // top up to the amount of this moment
      var target = Math.round(cols * PEAK * amount(age)), add = Math.min(4, target - drops.length);
      while (add > 0) { drops.push(newDrop()); add -= 1; }
    }
    ctx.clearRect(0, 0, W, H);
    ctx.font = FS + 'px "Malgun Gothic", "Noto Sans KR", "Apple SD Gothic Neo", "Courier New", monospace';
    ctx.textBaseline = 'top';
    var g = Math.min(1, age / FADE_IN_MS);
    for (i = 0; i < drops.length; i += 1) {
      d = drops[i];
      if (!showing && d.y < 0) { continue; }              // not on the screen yet when the show ended: it never appears
      // once the show is over, what is on the screen falls faster and faster, like it is let go
      d.y += d.speed * (showing ? 1 : 1 + (age - SHOW_MS) / 450) * dt;
      head = Math.floor(d.y);
      while (d.row < head) { d.cells.unshift(ch()); if (d.cells.length > d.len) { d.cells.pop(); } d.row += 1; }
      if (Math.random() < 0.04 && d.cells.length > 2) { d.cells[1 + ((Math.random() * (d.cells.length - 1)) | 0)] = ch(); }
      if (head - d.len > rows) { continue; }              // the whole drop is below the screen
      keep.push(d);
      for (k = 0; k < d.cells.length; k += 1) {
        row = head - k;
        if (row < 0 || row > rows) { continue; }
        if (k === 0) {                                    // the head of the drop: bright
          ctx.globalAlpha = 0.95 * g; ctx.fillStyle = '#e8fff0'; ctx.shadowColor = green; ctx.shadowBlur = 8;
        } else {
          a = (1 - k / d.len); ctx.globalAlpha = a * a * 0.8 * g; ctx.fillStyle = green; ctx.shadowBlur = 0;
        }
        ctx.fillText(d.cells[k], d.x, row * FS);
      }
    }
    drops = keep;
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    if (!showing && drops.length === 0 && done) {          // the rain is over and the page is fully there
      window.removeEventListener('resize', size);
      cv.remove();
      return;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}());
