// KAPPLE ][ emulator page only: the tutorial. The same method as KBASIC.web (kbasic.web/tutorial.js): a white,
// rounded box with the little apple (kbasic.web/mascot.js) goes from button to button and says what each is for.
// It asks once, on the first visit (a flag in localStorage), whether to show it; the "사용 안내" button in the
// toolbar shows it at any time. Needs ../kbasic.web/mascot.js (KBMascot) to be loaded first.
(function () {
  'use strict';
  var KEY = 'kapple2_emu_tutorial_seen';
  var btn = document.getElementById('btn_emu_tut');
  if (!window.KBMascot) { if (btn) { btn.style.display = 'none'; } return; }

  var STEPS = [
    { title: '안녕하세요!', text: '저는 길라잡이 사과예요. 이 페이지는 <b>브라우저에서 돌아가는 애플 ][+ 에뮬레이터</b>입니다. 단추가 하나씩 무엇을 하는지 차례로 알려 드릴게요.', mood: 'happy' },
    { sel: '#display', title: '모니터', text: '애플 ][+ 의 <b>화면</b>입니다. 화면을 한 번 누른 뒤 컴퓨터 <b>키보드로 그대로 입력</b>하세요. 디스크를 넣으면 자동으로 부팅합니다.' },
    { sel: ['.disk:nth-of-type(1)', '.disk:nth-of-type(2)'], title: '디스크 드라이브 1 · 2', text: '디스크를 넣는 곳이 두 개 있습니다. 드라이브 1에 넣은 디스크로 <b>부팅</b>합니다. 작은 <b>불빛</b>은 디스크를 읽고 쓰는 중에 켜지고, 아래 글자는 넣은 디스크 이름입니다. 디스크 파일을 이곳에 <b>끌어다 놓아도</b> 됩니다.' },
    { sel: ['.disk:nth-of-type(1) button:nth-of-type(1)', '.disk:nth-of-type(2) button:nth-of-type(1)'], title: '디스크 불러오기 (폴더 단추)', text: '분류와 디스크를 골라 <b>열기</b>를 누르면 그 디스크가 들어갑니다. 내 컴퓨터의 파일을 골라 넣을 수도 있어요.' },
    { sel: '.disk:nth-of-type(1) button:nth-of-type(2)', title: '디스크 저장 (디스켓 단추)', text: '지금 디스크를 <b>이 브라우저에 저장</b>하거나 <b>내 컴퓨터로 내려받습니다</b>. 프로그램을 디스크에 저장했다면 이것으로 가져가세요.' },
    { sel: '#khz', title: '속도 표시', text: '에뮬레이터가 돌아가는 속도(<b>kHz</b>)입니다. 실제 애플 ][ 는 약 1023 kHz 입니다. 누르면 화면 갱신 수(FPS) 표시로 바뀌어요.' },
    { sel: '#pause-run', title: '멈춤 · 다시 실행', text: '에뮬레이터를 <b>잠깐 멈추거나</b> 다시 돌립니다. 멈춘 동안에는 화면이 그대로 있어요.' },
    { sel: '#toggle-sound', title: '소리', text: '스피커 <b>소리를 켜고 끕니다</b>. 브라우저 규칙 때문에 화면을 한 번 누른 뒤에 소리가 납니다.' },
    { sel: ['button[onclick="Apple2.copy()"]', 'button[onclick="Apple2.paste()"]'], title: '복사 · 붙여넣기', text: '<b>복사</b>는 화면의 글을 복사하고, <b>붙여넣기</b>는 복사해 둔 글을 키보드로 친 것처럼 입력합니다. 긴 프로그램 목록을 넣을 때 편해요.' },
    { sel: '.mirror-open', title: '아시모프', text: '애플 ][ 디스크 자료실(<b>mirrors.apple2.org.za</b>)을 창으로 둘러봅니다. 디스크 파일 옆의 <b>Play!</b>를 누르면 이 에뮬레이터의 드라이브 1에 넣고 바로 시작해요.' },
    { sel: 'button[onclick="Apple2.openHelp()"]', title: '도움말', text: '디스크 넣기, 저장, 조작 방법을 짧게 정리한 <b>도움말</b>이 열립니다.' },
    { sel: 'button[onclick="Apple2.openOptions()"]', title: '설정 (F4)', text: '<b>기종</b>(애플 ][+ / //e), <b>빠르기</b>, <b>화면</b> 모양, <b>조이스틱</b>을 고릅니다. 기종을 바꾸면 페이지를 다시 불러와야 적용돼요.' },
    { sel: '#keyboard', title: '화면 키보드', text: '진짜 애플 ][ 키보드 모양입니다. 마우스나 손가락으로 눌러 입력합니다. <b>RESET</b> 키는 컴퓨터를 <b>재설정</b>(보통은 Ctrl 과 함께)하고, <b>CTRL</b>, <b>ESC</b>, <b>REPT</b> 도 있어요.' },
    { title: '다 봤어요!', text: '이제 <b>폴더 단추로 디스크를 넣어</b> 시작해 보세요. 이 안내는 도구 줄의 <b>사용 안내</b> 단추로 언제든 다시 볼 수 있어요.', mood: 'happy' }
  ];

  var CSS = [
    '.tut-btn { margin-left: 6px; font-family: inherit; font-size: 15px; color: #fff; background: #44372c; padding: 2px 8px; border: 1px outset #66594e; border-radius: 3px; cursor: pointer; min-height: 26px; }',
    '.tut-btn:hover { background: #55473d; }',
    '.tut-btn:active { background: #22150a; border-color: #44372c; }',
    '.tut-veil { position: fixed; z-index: 1000; inset: 0; background: rgba(0,0,0,0.45); }',
    '.tut-veil.clear { background: transparent; }',
    '.tut-ring { position: fixed; z-index: 1001; border-radius: 10px; box-shadow: 0 0 0 3px #ffd54a, 0 0 0 9999px rgba(0,0,0,0.5); pointer-events: none; transition: all .25s ease; }',
    '.tut-box { position: fixed; z-index: 1002; width: 380px; max-width: calc(100vw - 24px); box-sizing: border-box; background: #fff; color: #222; border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.45); padding: 14px 16px 12px; display: flex; gap: 10px; font-size: 14.5px; line-height: 1.6; font-family: var(--font-sans, sans-serif); }',
    '.tut-box *, .tut-box *::before, .tut-box *::after { box-sizing: border-box; }',
    '.tut-box .ai-avatar { width: 70px; flex: none; color: #222; }',
    '.tut-main { flex: 1; min-width: 0; }',
    '.tut-main h3 { margin: 0 0 4px; font-size: 16px; color: #2a1c10; }',
    '.tut-main p { margin: 0 0 10px; }',
    '.tut-main code { background: #f1ede0; border-radius: 4px; padding: 0 4px; font-size: 0.92em; }',
    '.tut-main a { color: #0b61c4; }',
    '.tut-nav { display: flex; align-items: center; gap: 6px; }',
    '.tut-nav .tut-n { flex: 1; font-size: 12px; color: #777; }',
    '.tut-nav button { font: inherit; font-size: 13px; border-radius: 999px; border: 1px solid #c9c3a8; background: #f6f3e4; color: #2a1c10; padding: 3px 12px; cursor: pointer; }',
    '.tut-nav button.pri { background: #44372c; color: #fff; border-color: #44372c; }',
    '.tut-nav button:disabled { opacity: .4; cursor: default; }',
    '.tut-x { position: absolute; top: 6px; right: 10px; border: 0; background: transparent; font-size: 18px; color: #888; cursor: pointer; line-height: 1; }',
    '@media (prefers-reduced-motion: reduce) { .tut-ring { transition: none; } }',
    // the apple's look (same rules as KBASIC.web)
    ".ai-avatar { flex: none; width: 84px; color: var(--ink); }",
    ".ai-avatar .mascot { display: block; width: 100%; height: auto; overflow: visible; }",
    ".ai-avatar .m-sad, .ai-avatar .m-brows, .ai-avatar .m-mouth-sad, .ai-avatar .m-tear, .ai-avatar .m-think, .ai-avatar .m-happy, .ai-avatar .m-eyes-happy, .ai-avatar .m-mouth-think, .ai-avatar .m-mouth-happy,",
    ".ai-avatar .m-cheeks, .ai-avatar .m-dots, .ai-avatar .m-sparks { display: none; }",
    ".ai-avatar.thinking .m-idle { display: none; }",
    ".ai-avatar.thinking .m-think, .ai-avatar.thinking .m-mouth-think, .ai-avatar.thinking .m-dots { display: inline; }",
    ".ai-avatar.thinking .m-mouth-idle { display: none; }",
    ".ai-avatar.thinking .m-sway { transform-origin: 207px 285px; animation: m-sway 2.6s ease-in-out infinite; }",
    ".ai-avatar.thinking .m-look { animation: m-look 2.6s ease-in-out infinite; }",
    ".ai-avatar.thinking .d1 { animation: m-dot 1.5s infinite 0s; }",
    ".ai-avatar.thinking .d2 { animation: m-dot 1.5s infinite 0.25s; }",
    ".ai-avatar.thinking .d3 { animation: m-dot 1.5s infinite 0.5s; }",
    ".ai-avatar.happy .m-idle, .ai-avatar.happy .m-eyes-round, .ai-avatar.happy .m-mouth-idle { display: none; }",
    ".ai-avatar.happy .m-happy, .ai-avatar.happy .m-eyes-happy, .ai-avatar.happy .m-mouth-happy, .ai-avatar.happy .m-cheeks, .ai-avatar.happy .m-sparks { display: inline; }",
    ".ai-avatar.happy .m-hop { transform-origin: 207px 285px; animation: m-hop 0.5s ease-in-out infinite; }",
    ".ai-avatar.happy .m-wave-l { transform-origin: 107px 182px; animation: m-wave-l 0.5s ease-in-out infinite alternate; }",
    ".ai-avatar.happy .m-wave-r { transform-origin: 307px 178px; animation: m-wave-r 0.5s ease-in-out infinite alternate; }",
    ".ai-avatar.happy .s1 { transform-origin: 52px 84px; animation: m-spark 0.9s ease-in-out infinite; }",
    ".ai-avatar.happy .s2 { transform-origin: 356px 81px; animation: m-spark 0.9s ease-in-out infinite 0.3s; }",
    ".ai-avatar.happy .s3 { transform-origin: 330px 247px; animation: m-spark 0.9s ease-in-out infinite 0.6s; }",
    ".ai-avatar.sad .m-idle, .ai-avatar.sad .m-mouth-idle { display: none; }",
    ".ai-avatar.sad .m-sad, .ai-avatar.sad .m-brows, .ai-avatar.sad .m-mouth-sad, .ai-avatar.sad .m-tear { display: inline; }",
    ".ai-avatar.sad .m-sway { transform-origin: 207px 285px; animation: m-droop 3.2s ease-in-out infinite; }",
    ".ai-avatar.sad .m-tear { animation: m-tear 2.2s ease-in infinite; }",
    "@keyframes m-droop { 0%, 100% { transform: translateY(2px) rotate(-1deg); } 50% { transform: translateY(6px) rotate(1deg); } }",
    "@keyframes m-tear { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: 1; } 100% { transform: translateY(46px); opacity: 0; } }",
    "@keyframes m-sway { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }",
    "@keyframes m-look { 0%, 100% { transform: translate(-4px, -7px); } 50% { transform: translate(5px, -7px); } }",
    "@keyframes m-dot { 0%, 15% { opacity: 0; } 35%, 80% { opacity: 1; } 100% { opacity: 0; } }",
    "@keyframes m-hop { 0%, 100% { transform: translateY(0) scale(1.04, 0.96); } 50% { transform: translateY(-16px) scale(0.97, 1.03); } }",
    "@keyframes m-wave-l { from { transform: rotate(-12deg); } to { transform: rotate(10deg); } }",
    "@keyframes m-wave-r { from { transform: rotate(12deg); } to { transform: rotate(-10deg); } }",
    "@keyframes m-spark { 0%, 100% { transform: scale(0.4); opacity: 0.3; } 50% { transform: scale(1.1); opacity: 1; } }",
    "@media (prefers-reduced-motion: reduce) { .ai-avatar * { animation: none !important; } }",
    ''
  ].join('\n');

  var st = document.createElement('style');
  st.appendChild(document.createTextNode(CSS));
  document.head.appendChild(st);

  var veil = null, ring = null, box = null, avatar = null, idx = 0, open = false, steps = STEPS;

  function seen() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return true; } }   // no storage: do not nag
  function markSeen() { try { localStorage.setItem(KEY, '1'); } catch (e) { /* ignore */ } }
  function mk(tag, cls, html) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (html !== undefined) { e.innerHTML = html; } return e; }

  function rectOf(sel) {
    var list = [].concat(sel), r = null, i, e, b;
    for (i = 0; i < list.length; i += 1) {
      e = document.querySelector(list[i]);
      if (!e || e.hidden || !e.offsetWidth) { continue; }
      b = e.getBoundingClientRect();
      r = r ? { left: Math.min(r.left, b.left), top: Math.min(r.top, b.top), right: Math.max(r.right, b.right), bottom: Math.max(r.bottom, b.bottom) }
            : { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
    }
    return r;
  }

  function place() {
    if (!box) { return; }
    var s = steps[idx], r = s.sel ? rectOf(s.sel) : null, pad = 6, vw = window.innerWidth, vh = window.innerHeight;
    var bw = box.offsetWidth, bh = box.offsetHeight, left, top;
    if (!r) {
      ring.style.display = 'none';
      left = (vw - bw) / 2; top = (vh - bh) / 2;
    } else {
      ring.style.display = 'block';
      ring.style.left = (r.left - pad) + 'px'; ring.style.top = (r.top - pad) + 'px';
      ring.style.width = (r.right - r.left + 2 * pad) + 'px'; ring.style.height = (r.bottom - r.top + 2 * pad) + 'px';
      if (r.bottom + 14 + bh <= vh) { top = r.bottom + 14; left = r.left; }                   // below
      else if (r.top - 14 - bh >= 0) { top = r.top - 14 - bh; left = r.left; }                // above
      else if (r.right + 14 + bw <= vw) { left = r.right + 14; top = Math.max(8, r.top); }    // right
      else if (r.left - 14 - bw >= 0) { left = r.left - 14 - bw; top = Math.max(8, r.top); }  // left
      else { left = (vw - bw) / 2; top = vh - bh - 14; }                                      // over the lower part
    }
    left = Math.max(12, Math.min(left, vw - bw - 12));
    top = Math.max(12, Math.min(top, vh - bh - 12));
    box.style.left = left + 'px'; box.style.top = top + 'px';
  }

  function show(i) {
    var s, tgt;
    idx = Math.max(0, Math.min(steps.length - 1, i));
    s = steps[idx];
    box.querySelector('h3').textContent = s.title;
    box.querySelector('p').innerHTML = s.text;
    box.querySelector('.tut-n').textContent = (idx + 1) + ' / ' + steps.length;
    box.querySelector('.tut-prev').disabled = idx === 0;
    box.querySelector('.tut-next').textContent = idx === steps.length - 1 ? '끝내기' : '다음';
    KBMascot.set(avatar, s.mood || '');
    tgt = s.sel ? document.querySelector([].concat(s.sel)[0]) : null;
    if (tgt && tgt.scrollIntoView) { tgt.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' }); }
    place();
    setTimeout(place, 60);                 // after the scroll has settled
  }

  function close() {
    if (!open) { return; }
    open = false;
    [veil, ring, box].forEach(function (e) { if (e && e.parentNode) { e.parentNode.removeChild(e); } });
    veil = ring = box = null;
    window.removeEventListener('resize', place);
    window.removeEventListener('scroll', place, true);
    document.removeEventListener('keydown', onKey, true);
    markSeen();
    if (btn) { btn.focus(); }
  }
  function onKey(ev) {
    if (ev.key === 'Escape') { ev.preventDefault(); close(); }
    else if (ev.key === 'ArrowRight') { ev.preventDefault(); next(); }
    else if (ev.key === 'ArrowLeft') { ev.preventDefault(); show(idx - 1); }
  }
  function next() { if (idx >= steps.length - 1) { close(); } else { show(idx + 1); } }

  function build(withNav) {
    veil = mk('div', 'tut-veil clear'); ring = mk('div', 'tut-ring'); ring.style.display = 'none';
    box = mk('div', 'tut-box');
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', '사용 안내');
    avatar = KBMascot.create();
    var main = mk('div', 'tut-main', '<h3></h3><p></p>'), nav = mk('div', 'tut-nav');
    var x = mk('button', 'tut-x', '&times;'); x.type = 'button'; x.title = '닫기'; x.setAttribute('aria-label', '사용 안내 닫기');
    x.addEventListener('click', close, false);
    box.appendChild(avatar); box.appendChild(main); box.appendChild(x);
    if (withNav) {
      nav.innerHTML = '<span class="tut-n"></span><button type="button" class="tut-prev">이전</button><button type="button" class="tut-next pri">다음</button><button type="button" class="tut-skip">건너뛰기</button>';
      main.appendChild(nav);
      nav.querySelector('.tut-prev').addEventListener('click', function () { show(idx - 1); }, false);
      nav.querySelector('.tut-next').addEventListener('click', next, false);
      nav.querySelector('.tut-skip').addEventListener('click', close, false);
    }
    document.body.appendChild(veil); document.body.appendChild(ring); document.body.appendChild(box);
    open = true;
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
  }

  function start() {
    if (open) { return; }
    // only the steps whose button is on this page (the 아시모프 button, for one, is added by mirror.js)
    steps = STEPS.filter(function (s) { return !s.sel || rectOf(s.sel); });
    build(true);
    veil.className = 'tut-veil clear';
    show(0);
    box.querySelector('.tut-next').focus();
  }

  // first visit: ask once
  function ask() {
    if (open) { return; }
    build(false);
    veil.className = 'tut-veil';
    ring.style.display = 'none';
    box.querySelector('h3').textContent = '처음 오셨네요!';
    box.querySelector('p').innerHTML = '이 에뮬레이터 사용법을 <b>1분 안내</b>로 보여 드릴까요? 나중에 도구 줄의 <b>사용 안내</b> 단추로 언제든 볼 수 있어요.';
    KBMascot.set(avatar, 'happy');
    var nav = mk('div', 'tut-nav', '<span class="tut-n"></span><button type="button" class="pri tut-yes">안내 보기</button><button type="button" class="tut-no">나중에</button>');
    box.querySelector('.tut-main').appendChild(nav);
    nav.querySelector('.tut-yes').addEventListener('click', function () { close(); start(); }, false);
    nav.querySelector('.tut-no').addEventListener('click', close, false);
    box.style.left = Math.max(12, (window.innerWidth - box.offsetWidth) / 2) + 'px';
    box.style.top = Math.max(12, (window.innerHeight - box.offsetHeight) / 3) + 'px';
    nav.querySelector('.tut-yes').focus();
  }

  if (btn) { btn.addEventListener('click', start, false); }
  window.KAppleTutorial = { start: start };

  // first visit only; not when a disk comes in the address (?d1= ...), someone who follows a Play! link wants to play
  if (!/[?&](d1|d2|disk)=/.test(location.search) && !location.hash) {
    var go = function () { setTimeout(function () { if (!seen()) { ask(); } }, 1500); };
    if (document.documentElement.classList.contains('mr-intro')) { window.addEventListener('kapple-intro-done', go); }   // after the opening show (matrix_rain.js)
    else { go(); }
  }
}());
