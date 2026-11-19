# KAPPLE ][ (emulator.js): Apple ][ emulator in the browser / 브라우저의 애플 ][ 에뮬레이터

한국어 설명은 아래에 있습니다. Korean below.

KAPPLE ][ is a copy of **Apple ][js** by Will Scullin (<https://github.com/whscullin/apple2js>, MIT licence, see `LICENSE`;
the commits taken are in `UPSTREAM.txt`, including the two submodules `cpu6502` and `apple2shader` that are copied into
`submodules/`), changed for the KBASIC project. `index.html` is the Apple ][ Plus page (it was `apple2js.html`; the old
`index.html` is now `preapple.html`).

## Changes

- **"KAPPLE ][" on the power-up screen** instead of "APPLE ][". The title is printed by the monitor ROM; its ninth
  character cannot be added in place (the byte before the text is part of the disk-boot ID table), so the `JSR HOME` at
  `$FB60` jumps to a 9-byte stub in unused ROM space at `$FBB4` that does HOME and stores a `K` at `$040E`.
  `tools/patch_title.py` applies it to `js/roms/system/fpbasic.ts` (Apple ][ Plus) and `intbasic.ts` (already applied).
- **Disks from the address:** `index.html?d1=URL&d2=URL` loads the disk images into drive 1 and drive 2 right
  away and boots from drive 1. A URL can be absolute or relative; `.dsk`, `.do`, `.po`, `.nib`, `.woz`, ... or a `.json` disk
  description. A different site must allow it with CORS headers (the same site always works). Both disks are loaded
  before the machine starts. (Upstream's `#disk1|disk2` and `?disk=` still work.) Example, KBASIC:
  `index.html?d1=https://example.com/KBASIC.DSK`
- **All text is Korean:** the page, the dialogs, the settings, the disk names and categories, and the messages. The browser's own
  error texts ("Failed to fetch", bad JSON) and HTTP errors (404 ...) are shown as Korean alerts. The browser's own file button
  ("Choose File / No file chosen") is replaced by a Korean button and file name.
- **Built-in disks** (`json/disks/`, listed in the Open dialog): the System disks of the original site (DOS 3.3 Master,
  DOS 3.3 Master 2, DOS 3.3 Sample, ProDOS, ProDOS 8), two blank disks and the Apple II Audit disk. The 253 other disks of the
  original site (games and commercial software) are not included.
- **Font Awesome icons are local** (`fontawesome/`), no CDN. The Google Analytics script was removed.
- A bug fix: loading a disk from a URL into drive 2 used a global drive number that only the UI sets, so it went to drive 1.
- If the page is opened as a file (`file://`) a Korean warning shows: the disks and sound need a web server (see below).

## Build and deploy

```
build.bat            npm install (if needed) + webpack + assemble the site into dist\
build.bat serve      the same, then serves dist\ on http://localhost:8080/ to try it
```

`dist\` is the whole web site (the page, the scripts, `css`, `img`, `json` and the Font Awesome icons, all relative paths): copy
the **contents of `dist\`** to the web server, into the root or into any folder. Nothing else is needed. It needs Node.js 20 or
later to build. `dist\` and `build\` are not committed.

**It must be served over `http://` or `https://`.** Opened as a file (`file://`) the browser blocks `fetch()` and the two worker
scripts (`audio_worker.bundle.js`, `format_worker.bundle.js`, loaded next to the page), so no disk can be loaded and there is no sound.
The paths are relative and the same either way; it is the browser's security rule for files that differs.

The ROMs and disk images in this tree are Apple's and the original authors' (see upstream's README).

# KAPPLE ][ (한국어)

KAPPLE ][ 는 Will Scullin 의 **Apple ][js**(MIT 허가, `LICENSE`)를 복제해 KBASIC 프로젝트에 맞게 고친 것입니다.
`index.html` 이 애플 ][ Plus 화면입니다.

- 전원을 켜면 "APPLE ][" 대신 **"KAPPLE ]["** 가 나옵니다(ROM 의 제목 출력 부분을 비어 있는 ROM 자리의 작은 토막으로 돌려 `K` 를 더 찍음).
- 주소로 디스크 넣기: `index.html?d1=주소&d2=주소`. 주소는 절대, 상대 모두 되고, 디스크 1 에서 부팅합니다.
  다른 사이트의 디스크는 그 사이트가 CORS 를 허용해야 합니다.
- 화면의 모든 글(제목, 대화창, 설정, 디스크 이름과 분류, 메시지)은 한국어입니다. "Failed to fetch" 같은 브라우저 오류와 HTTP 오류(404 등)도
  한국어 알림으로 나오고, 브라우저의 "Choose File / No file chosen" 대신 한국어 파일 선택 단추가 있습니다.
- 기본으로 들어 있는 디스크(`json/disks/`): 원래 사이트의 시스템 디스크(DOS 3.3 마스터, 마스터 2, 샘플, ProDOS, ProDOS 8), 빈 디스크 둘,
  Apple II 점검 디스크. 원래 사이트의 나머지 253개(게임 등 상용 소프트웨어)는 넣지 않았습니다.
- 만들기: `build.bat`을 실행하면 `dist\` 폴더에 웹 사이트가 만들어집니다. **`dist\` 안의 파일만** 웹 서버(루트든 아무 폴더든)에 복사하면 됩니다.
  `build.bat serve`는 만든 뒤 http://localhost:8080/ 으로 열어 줍니다(Node.js 20 이상 필요).
- **반드시 웹 서버(`http://`, `https://`)로 여세요.** 파일(`file://`)로 열면 브라우저가 디스크 불러오기와 소리에 필요한 스크립트를 막아서 디스크도 소리도 안 됩니다.
  (경로는 같고, 파일로 열 때만 브라우저의 보안 규칙이 다릅니다.)
