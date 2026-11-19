// KAPPLE ][ emulator page only: a small character slides in, says something in a speech bubble,
// then slides out again. The first one appears 2 minutes after the page loads; after that one
// appears every 2 to 10 minutes.

(() => {
  // true: testing. No timer; a click on the page background shows a new character.
  // false: the real schedule (first after 2 minutes, then every 2 to 10 minutes).
  const TEST_MODE = false;

  const FIRST_DELAY_MS = 2 * 60 * 1000;
  const MIN_GAP_MS = 2 * 60 * 1000;
  const MAX_GAP_MS = 10 * 60 * 1000;

  const STAY_MS = 4500;      // how long the speech bubble stays up
  const SLIDE_MS = 600;      // slide in / slide out time
  const BUBBLE_MS = 250;     // bubble fade time

  const PEOPLE = [
    "../assets/people/person1.jpg",
    "../assets/people/person2.jpg",
    "../assets/people/person3.jpg",
    "../assets/people/person4.jpg",
    "../assets/people/person5.jpg",
  ];

  const LINES = [
    "재밌어요?",
    "즐거운 하루 되세요!",
    "오늘도 즐거운 하루 보내세요!",
    "이 게임 해 보셨어요?",
    "디스켓 넣고 PR#6 입력해 보세요!",
    "한글화 버전도 한번 해 보세요!",
    "저장소에 더 많은 작품이 있어요.",
    "그 시절 생각나시죠?",
  ];

  const CSS = `
    .companion {
      position: fixed;
      bottom: 12px;
      width: min(180px, 36vw);
      z-index: 2; /* below the emulator's dialogs, which come later in the page */
      visibility: hidden;
      pointer-events: none;
      will-change: transform;
    }
    .companion.anchor-right { right: 12px; }
    .companion.anchor-left { left: 12px; }
    .companion-img {
      display: block;
      width: 100%;
      height: auto;
      border: 3px solid #c4c1a0;
      border-radius: 10px;
      background: #c4c1a0;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
    }
    .companion-bubble {
      position: absolute;
      bottom: calc(100% + 12px);
      width: max-content;
      max-width: 220px;
      padding: 8px 12px;
      border: 2px solid #8a6d3b;
      border-radius: 12px;
      background: #f3e6cc;
      color: #362712;
      font-family: sans-serif;
      font-size: 14px;
      line-height: 1.4;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
      opacity: 0;
      transform: translateY(6px);
      transition: opacity ${BUBBLE_MS}ms ease, transform ${BUBBLE_MS}ms ease;
    }
    .companion.anchor-right .companion-bubble { right: 0; }
    .companion.anchor-left .companion-bubble { left: 0; }
    .companion-bubble::after {
      content: "";
      position: absolute;
      bottom: -9px;
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-top: 9px solid #8a6d3b;
    }
    .companion.anchor-right .companion-bubble::after { right: 24px; }
    .companion.anchor-left .companion-bubble::after { left: 24px; }
    .companion-bubble.show {
      opacity: 1;
      transform: translateY(0);
    }
  `;

  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const randomBetween = (min, max) => min + Math.random() * (max - min);

  let root = null;
  let img = null;
  let bubble = null;
  let lastPerson = -1;
  let busy = false;

  function build() {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    root = document.createElement("div");
    root.className = "companion";
    root.setAttribute("aria-hidden", "true");

    bubble = document.createElement("div");
    bubble.className = "companion-bubble";

    img = document.createElement("img");
    img.className = "companion-img";
    img.alt = "";
    img.decoding = "async";

    root.append(bubble, img);
    document.body.insertBefore(root, document.body.firstChild);
  }

  // Where the character starts (off screen) and where it leaves from.
  function offscreen(direction, anchor) {
    if (direction === "bottom") return "translate(0, calc(100% + 24px))";
    return anchor === "right" ? "translate(calc(100% + 24px), 0)" : "translate(calc(-100% - 24px), 0)";
  }

  function setTransform(value, transition) {
    root.style.transition = transition;
    root.style.transform = value;
  }

  function nextPersonIndex() {
    let i = Math.floor(Math.random() * PEOPLE.length);
    if (PEOPLE.length > 1 && i === lastPerson) i = (i + 1) % PEOPLE.length;
    lastPerson = i;
    return i;
  }

  function appear() {
    busy = true;
    const direction = Math.random() < 0.5 ? "bottom" : "side";
    const anchor = Math.random() < 0.5 ? "left" : "right";
    const person = PEOPLE[nextPersonIndex()];
    const line = pick(LINES);

    root.classList.toggle("anchor-left", anchor === "left");
    root.classList.toggle("anchor-right", anchor === "right");
    img.src = person;
    bubble.textContent = line;
    bubble.classList.remove("show");

    // Start off screen, then slide in.
    setTransform(offscreen(direction, anchor), "none");
    root.style.visibility = "visible";
    void root.offsetWidth; // apply the start position before animating
    setTransform("translate(0, 0)", `transform ${SLIDE_MS}ms ease-out`);

    setTimeout(() => bubble.classList.add("show"), SLIDE_MS);

    setTimeout(() => {
      bubble.classList.remove("show");
      setTimeout(() => {
        setTransform(offscreen(direction, anchor), `transform ${SLIDE_MS}ms ease-in`);
        setTimeout(() => {
          root.style.visibility = "hidden";
          busy = false;
          if (!TEST_MODE) schedule(randomBetween(MIN_GAP_MS, MAX_GAP_MS));
        }, SLIDE_MS);
      }, BUBBLE_MS);
    }, SLIDE_MS + STAY_MS);
  }

  function schedule(ms) {
    setTimeout(appear, ms);
  }

  // Test mode: a click on the page background (not on the controls, the panel or a dialog) shows a new one.
  const NOT_BACKGROUND = ".emu-panel, header, a, button, input, select, textarea, label, .modal, .companion";
  function onDocumentClick(event) {
    if (busy) return;
    const target = event.target;
    if (target.closest && target.closest(NOT_BACKGROUND)) return;
    if (target === document.body || target === document.documentElement || (target.classList && target.classList.contains("outer"))) {
      appear();
    }
  }

  function start() {
    build();
    if (TEST_MODE) {
      document.addEventListener("click", onDocumentClick);
    } else {
      schedule(FIRST_DELAY_MS);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
