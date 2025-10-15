// 社内イベント カウントダウン
(function () {
  // タイトルの任意改行: 「いいね！チャレンジ」を必要時のみ改行
  try {
    const titleEl = document.querySelector('.title');
    if (titleEl && !titleEl.innerHTML.includes('<wbr')) {
      const txt = (titleEl.textContent || '').trim();
      if (txt.includes('いいね！チャレンジ')) {
        titleEl.innerHTML = txt.replace('いいね！チャレンジ', 'いいね！<wbr>チャレンジ');
      }
    }
  } catch (e) {}
  // 次に来る10月のイベント年を決定
  const now = new Date();
  const currentYear = now.getFullYear();

  // 現在の日付が10/31を過ぎていれば翌年を対象にする
  const passedOctEnd = (now.getMonth() + 1 > 10) || ((now.getMonth() + 1 === 10) && now.getDate() > 31);
  const eventYear = passedOctEnd ? currentYear + 1 : currentYear;

  // 日本時間での期間
  const start = new Date(`${eventYear}-10-15T00:00:00+09:00`);
  const end = new Date(`${eventYear}-10-31T23:59:59+09:00`);

  const $ = (id) => document.getElementById(id);
  const dd = $("dd"), hh = $("hh"), mm = $("mm"), ss = $("ss");
  const label = $("countdown-label");
  const ended = $("ended-message");

  // 表示する年
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(now.getFullYear());
  const ey = document.getElementById("event-year");
  if (ey) ey.textContent = `（${eventYear}年）`;

  function pad(n) { return n.toString().padStart(2, "0"); }

  function diffParts(target) {
    const ms = Math.max(0, target.getTime() - Date.now());
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds, done: ms <= 0 };
  }

  let mode = "pre"; // pre:開始前, live:開催中, post:終了
  function updateMode() {
    const now = Date.now();
    if (now < start.getTime()) mode = "pre";
    else if (now <= end.getTime()) mode = "live";
    else mode = "post";
  }

  function tick() {
    updateMode();
    if (mode === "pre") {
      label.textContent = "開始まで";
      const d = diffParts(start);
      dd.textContent = pad(d.days);
      hh.textContent = pad(d.hours);
      mm.textContent = pad(d.minutes);
      ss.textContent = pad(d.seconds);
      ended.hidden = true;
    } else if (mode === "live") {
      label.textContent = "終了まで";
      const d = diffParts(end);
      dd.textContent = pad(d.days);
      hh.textContent = pad(d.hours);
      mm.textContent = pad(d.minutes);
      ss.textContent = pad(d.seconds);
      ended.hidden = true;
    } else {
      // 終了
      dd.textContent = hh.textContent = mm.textContent = ss.textContent = "00";
      label.textContent = "";
      ended.hidden = false;
    }
  }

  // 秒境界に合わせて正確に更新（タブ非アクティブ時のドリフト抑制）
  tick();
  (function schedule() {
    const next = 1000 - (Date.now() % 1000);
    setTimeout(() => { tick(); schedule(); }, next);
  })();
  
  // ===== 昨日のトップ3（数は表示しない） =====
  (async function renderTop3() {
    const wrap = document.getElementById('top3-list');
    const note = document.getElementById('top3-note');
    if (!wrap) return; // セクションが無ければ何もしない

    // JST の「昨日」を YYYY-MM-DD で求める
    const nowUtc = Date.now();
    const jstOffsetMs = 9 * 60 * 60 * 1000;
    const jst = new Date(nowUtc + jstOffsetMs);
    const yst = new Date(jst.getTime() - 24 * 60 * 60 * 1000);
    const toKey = (d) => {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };
    const yesterdayKey = toKey(yst);

    try {
      const res = await fetch('top3.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('top3.json not found');
      const data = await res.json();

      // 優先: 昨日のキー。なければ最新キーを使う
      let key = yesterdayKey;
      if (!data[key]) {
        const keys = Object.keys(data || {}).sort();
        key = keys[keys.length - 1];
      }
      const items = (key && data[key]) || [];

      if (!items.length) {
        note && (note.textContent = 'トップ3情報はまだありません。');
        return;
      }

      note && (note.textContent = `表示中の日付: ${key.replaceAll('-', '/')}`);

      // Medal SVG（既存の表彰セクションと同じアイコン）
      const medalSvg = '<svg class="medal__icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 2h10l-2 6H9L7 2zm5 7a6 6 0 1 1 0 12a6 6 0 0 1 0-12zm0 2.3l1.38 2.8l3.1.45l-2.24 2.17l.53 3.08L12 18.2l-2.77 1.46l.53-3.08L7.5 12.55l3.1-.45L12 11.3z"/></svg>';

      const ranks = ['gold', 'silver', 'bronze'];
      wrap.innerHTML = '';
      items.slice(0, 3).forEach((it, idx) => {
        const card = document.createElement('div');
        card.className = 'prize';

        const medal = document.createElement('div');
        medal.className = `medal ${ranks[idx] || 'gold'}`;
        medal.setAttribute('aria-label', `${idx + 1}位`);
        medal.innerHTML = medalSvg;

        const body = document.createElement('div');
        body.className = 'prize__body';
        const title = document.createElement('h3');
        title.textContent = it.title || `${idx + 1}位`;

        const p = document.createElement('p');
        const name = it.name ? String(it.name) : '';
        const link = it.link ? String(it.link) : '';
        if (link) {
          const a = document.createElement('a');
          a.href = link; a.target = '_blank'; a.rel = 'noopener';
          a.textContent = name || 'リンク';
          p.append('投稿者: ', a);
        } else {
          p.textContent = name ? `投稿者: ${name}` : '';
        }

        body.appendChild(title);
        if (p.textContent || p.childNodes.length) body.appendChild(p);

        card.appendChild(medal);
        card.appendChild(body);
        wrap.appendChild(card);
      });
    } catch (e) {
      note && (note.textContent = 'トップ3の読み込みに失敗しました。');
      try { console.error(e); } catch (_) {}
    }
  })();

  // タイトルの改行ポイントを確実に挿入（文字化け環境でも動作）
  try {
    const t = document.querySelector('.title');
    if (t && !t.innerHTML.includes('<wbr') && (t.textContent || '').includes('チャレンジ')) {
      t.innerHTML = t.innerHTML.replace('チャレンジ', '<wbr>チャレンジ');
    }
  } catch (e) {}

  // ===== Logo fallback handling =====
  const logoImg = document.getElementById("logo");
  const logoFallback = document.getElementById("logo-fallback");
  if (logoImg && logoFallback) {
    const swapToFallback = (reason) => {
      try { console.warn("Logo fallback activated:", reason, logoImg?.src); } catch (e) {}
      logoImg.hidden = true;
      logoFallback.hidden = false;
    };

    // まずは候補ファイルを順に試す
    const candidatesAttr = logoImg.getAttribute("data-logo-candidates");
    const candidates = (candidatesAttr ? candidatesAttr.split(";") : [logoImg.getAttribute("src")])
      .filter(Boolean);

    const tryNext = (i = 0) => {
      if (i >= candidates.length) {
        swapToFallback("all candidates failed");
        return;
      }
      const url = candidates[i].trim();
      const test = new Image();
      test.onload = () => {
        logoImg.src = url; // 差し替え
        logoImg.hidden = false;
        logoFallback.hidden = true;
      };
      test.onerror = () => tryNext(i + 1);
      test.src = url + (url.includes("?") ? "&" : "?") + "v=" + Date.now(); // キャッシュ回避
    };
    tryNext(0);

    // 保険: 後から発生するエラー
    logoImg.addEventListener("error", () => swapToFallback("load error after set"));

    // 既に失敗表示のケース
    if (logoImg.complete && logoImg.naturalWidth === 0) {
      // tryNext がすぐ走るので様子見、ただし2秒で保険フォールバック
      setTimeout(() => {
        if (logoImg.naturalWidth === 0) swapToFallback("naturalWidth==0 timeout");
      }, 2000);
    }
  }

  // ===== Video overlays (multiple) =====
  document.querySelectorAll('.video-shell').forEach((shell) => {
    const video = shell.querySelector('video');
    const overlay = shell.querySelector('.video-overlay');
    if (!video || !overlay) return;
    const hide = () => (overlay.style.display = 'none');
    const show = () => (overlay.style.display = 'grid');

    // できる限り開始フレームを表示（posterが無い場合の黒画面対策）
    let triedSeek = false;
    const seekToStart = () => {
      if (triedSeek) return; triedSeek = true;
      try { video.currentTime = 0.1; } catch (e) {}
    };
    video.addEventListener('loadedmetadata', seekToStart);
    video.addEventListener('loadeddata', hide);
    video.addEventListener('play', hide);
    video.addEventListener('error', show);
    // 既にデータがあるなら即非表示
    if (video.readyState >= 2) hide(); else setTimeout(seekToStart, 300);
  });

  // ===== CM pagination (show N per page) =====
  (function initCMPagination() {
    const grid = document.getElementById('cm-grid');
    if (!grid) return;
    const items = Array.from(grid.querySelectorAll('.video-shell'));
    if (!items.length) return;

    const basePerPage = parseInt(grid.dataset.perPage || '3', 10);
    const prev = document.getElementById('cm-prev'); // may be null (using dots)
    const next = document.getElementById('cm-next'); // may be null (using dots)
    const indicator = document.getElementById('cm-indicator'); // optional
    const dotsWrap = document.getElementById('cm-dots');
    function computePerPage() {
      if (window.matchMedia('(max-width: 700px)').matches) return 1;
      if (window.matchMedia('(max-width: 1024px)').matches) return Math.min(2, basePerPage);
      return basePerPage;
    }
    let perPage = computePerPage();
    let totalPages = Math.max(1, Math.ceil(items.length / perPage));
    let page = 1;
    // autoplay options
    const auto = String(grid.dataset.auto || 'true') !== 'false';
    const intervalMs = Math.max(2000, parseInt(grid.dataset.interval || '6000', 10));
    let timer = null;

    function render(animate = false) {
      if (animate) grid.classList.add('is-fading');
      const start = (page - 1) * perPage;
      const end = start + perPage;
      items.forEach((el, i) => {
        const visible = i >= start && i < end;
        el.style.display = visible ? '' : 'none';
        if (!visible) {
          const v = el.querySelector('video');
          if (v && !v.paused) { try { v.pause(); } catch (e) {} }
        }
      });
      if (indicator) indicator.textContent = `${page} / ${totalPages}`;
      // dots active state
      if (dotsWrap) {
        const dots = dotsWrap.querySelectorAll('.cm-dot');
        dots.forEach((d, i) => d.classList.toggle('is-active', i + 1 === page));
      }
      if (prev) prev.disabled = (page === 1);
      if (next) next.disabled = (page === totalPages);
      if (animate) setTimeout(() => grid.classList.remove('is-fading'), 150);
    }

    function nextPage(loop = true, animate = true) {
      if (page < totalPages) page++;
      else if (loop) page = 1;
      render(animate);
    }

    function prevPage(animate = true) {
      if (page > 1) page--;
      else page = totalPages;
      render(animate);
    }

    prev && prev.addEventListener('click', () => { stopAuto(); prevPage(true); startAuto(); });
    next && next.addEventListener('click', () => { stopAuto(); nextPage(false, true); startAuto(); });

    // Build dots
    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cm-dot';
        btn.setAttribute('aria-label', `${i}ページ目へ`);
        btn.addEventListener('click', () => { stopAuto(); page = i; render(true); startAuto(); });
        dotsWrap.appendChild(btn);
      }
    }
    buildDots();

    render(false);

    // Swipe/drag navigation (mobile + desktop)
    (function enableSwipe() {
      const surface = grid; // swipe on the grid area
      if (!surface || totalPages <= 1) return;
      let startX = 0, startY = 0, isDown = false, isSwipe = false;
      const THRESH = 30; // px
      const OPT_PASSIVE = { passive: true };

      function onPointerDown(ev) {
        isDown = true; isSwipe = false;
        startX = ev.clientX || (ev.touches && ev.touches[0]?.clientX) || 0;
        startY = ev.clientY || (ev.touches && ev.touches[0]?.clientY) || 0;
      }
      function onPointerMove(ev) {
        if (!isDown) return;
        const x = ev.clientX || (ev.touches && ev.touches[0]?.clientX) || 0;
        const y = ev.clientY || (ev.touches && ev.touches[0]?.clientY) || 0;
        const dx = x - startX; const dy = y - startY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > THRESH) {
          isSwipe = true;
        }
      }
      function onPointerUp(ev) {
        if (!isDown) return; isDown = false;
        if (!isSwipe) return; // treat as tap/scroll
        const endX = ev.clientX || (ev.changedTouches && ev.changedTouches[0]?.clientX) || 0;
        const dx = endX - startX;
        stopAuto();
        if (dx < 0) nextPage(false, true); else prevPage(true);
        startAuto();
      }

      // Pointer and touch/mouse fallback for broader support
      surface.addEventListener('pointerdown', onPointerDown, OPT_PASSIVE);
      surface.addEventListener('pointermove', onPointerMove, OPT_PASSIVE);
      surface.addEventListener('pointerup', onPointerUp, OPT_PASSIVE);
      surface.addEventListener('pointercancel', () => { isDown = false; }, OPT_PASSIVE);

      // iOS Safari fallback (older) with touch events
      surface.addEventListener('touchstart', onPointerDown, OPT_PASSIVE);
      surface.addEventListener('touchmove', onPointerMove, OPT_PASSIVE);
      surface.addEventListener('touchend', onPointerUp, OPT_PASSIVE);
      // Desktop mouse drag
      surface.addEventListener('mousedown', onPointerDown, OPT_PASSIVE);
      surface.addEventListener('mousemove', onPointerMove, OPT_PASSIVE);
      surface.addEventListener('mouseup', onPointerUp, OPT_PASSIVE);
    })();

    function startAuto() {
      if (!auto || totalPages <= 1 || timer) return;
      timer = setInterval(() => {
        // 再生中の動画があれば一時停止（ユーザー意図を尊重して停止しない方が良ければ外す）
        const playing = items.some((el) => {
          const v = el.querySelector('video');
          return v && !v.paused && el.style.display !== 'none';
        });
        if (!playing) nextPage(true, true);
      }, intervalMs);
    }
    function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }

    // Pause on hover/focus or when any video plays
    const hoverables = [grid, prev, next, dotsWrap].filter(Boolean);
    hoverables.forEach((el) => {
      el.addEventListener('mouseenter', stopAuto);
      el.addEventListener('mouseleave', startAuto);
      el.addEventListener('focusin', stopAuto);
      el.addEventListener('focusout', startAuto);
    });
    items.forEach((el) => {
      const v = el.querySelector('video');
      if (!v) return;
      v.addEventListener('play', stopAuto);
      v.addEventListener('pause', startAuto);
    });
    // Page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAuto(); else startAuto();
    });

    startAuto();

    // Responsive: adjust perPage on resize
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newPer = computePerPage();
        if (newPer !== perPage) {
          perPage = newPer;
          totalPages = Math.max(1, Math.ceil(items.length / perPage));
          if (page > totalPages) page = totalPages;
          buildDots();
          render(false);
        }
      }, 120);
    });
  })();
})();
