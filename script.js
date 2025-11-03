// Main scripts (UTF-8)
(function () {
  // タイトルの任意改行（見た目調整）
  try {
    const titleEl = document.querySelector('.title');
    if (titleEl && !titleEl.innerHTML.includes('<wbr')) {
      titleEl.innerHTML = (titleEl.textContent || '').trim().replace('チャレンジ', '<wbr>チャレンジ');
    }
  } catch {}

  // 年度とカウントダウン設定
  const now = new Date();
  const currentYear = now.getFullYear();
  const eventYear = 2025; // イベント年を2025年に固定
  const start = new Date(`${eventYear}-10-15T00:00:00+09:00`);
  const end = new Date(`${eventYear}-10-31T23:59:59+09:00`);

  const $ = (id) => document.getElementById(id);
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(now.getFullYear());
  const ey = document.getElementById("event-year");
  if (ey) ey.textContent = `（${eventYear}年）`;

  let confettiTriggered = false;

  // 定期的に紙吹雪を発射する関数
  function startContinuousConfetti() {
    if (typeof confetti === 'undefined') return;

    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    function fireConfetti() {
      const duration = 3 * 1000; // 3秒間
      const animationEnd = Date.now() + duration;

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // 左右から紙吹雪を発射
        confetti(Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        }));
        confetti(Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        }));
      }, 250);
    }

    // 最初の紙吹雪を即座に発射
    fireConfetti();

    // 10秒ごとに紙吹雪を発射
    setInterval(fireConfetti, 10000);
  }

  // イベント終了後、定期的に紙吹雪を発射
  if (!confettiTriggered) {
    confettiTriggered = true;
    startContinuousConfetti();
  }

  // ロゴのフォールバック（失敗時にテキスト表示）
  const logoImg = document.getElementById('logo');
  const logoFallback = document.getElementById('logo-fallback');
  if (logoImg && logoFallback) {
    logoImg.addEventListener('error', () => { logoImg.hidden = true; logoFallback.hidden = false; });
  }

  // CM: 6本の動画を3本ずつ表示し、自動でページ送り
  (function cmCarousel() {
    const grid = document.getElementById('cm-grid');
    if (!grid) return;
    const perPage = Number(grid.getAttribute('data-per-page') || 3);
    const intervalMs = Number(grid.getAttribute('data-interval') || 6000);
    const auto = String(grid.getAttribute('data-auto') || 'true') !== 'false';
    const items = Array.from(grid.querySelectorAll('.video-shell'));
    const dotsWrap = document.getElementById('cm-dots');
    let page = 1; let totalPages = Math.max(1, Math.ceil(items.length / perPage));
    let timer = null;

    function render() {
      const start = (page - 1) * perPage;
      const end = start + perPage;
      items.forEach((el, i) => { el.style.display = (i >= start && i < end) ? '' : 'none'; });
      if (dotsWrap) {
        const dots = Array.from(dotsWrap.querySelectorAll('.cm-dot'));
        dots.forEach((d, i) => d.classList.toggle('is-active', i === page - 1));
      }
    }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'cm-dot';
        btn.setAttribute('aria-label', `${i}ページ目へ`);
        btn.addEventListener('click', () => { stopAuto(); page = i; render(); startAuto(); });
        dotsWrap.appendChild(btn);
      }
    }

    function nextPage() { page = page >= totalPages ? 1 : page + 1; render(); }
    function startAuto() { if (!auto || timer || totalPages <= 1) return; timer = setInterval(() => { // 再生中の動画があればスキップ
        const playing = items.some((el) => { const v = el.querySelector('video'); return v && !v.paused && el.style.display !== 'none'; });
        if (!playing) nextPage();
      }, intervalMs); }
    function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }

    // 再生マークの表示/非表示
    items.forEach((el) => {
      const v = el.querySelector('video'); const overlay = el.querySelector('.video-overlay');
      if (!v || !overlay) return;
      const show = () => overlay.style.visibility = 'visible';
      const hide = () => overlay.style.visibility = 'hidden';
      show();
      // 初期表示で2秒地点のフレームを表示（黒画面防止）
      const SEEK_SEC = 2;
      const prime = () => {
        try {
          // duration が取れていれば終端を超えないようクランプ
          let t = SEEK_SEC;
          if (isFinite(v.duration) && v.duration > 0) {
            t = Math.min(SEEK_SEC, Math.max(0, v.duration - 0.2));
          }
          v.currentTime = t;
          v.pause();
        } catch (e) {}
      };
      v.addEventListener('loadedmetadata', prime, { once: true });
      // Safari 対策: canplay でも実行して念押し
      v.addEventListener('canplay', () => { if (v.currentTime < 0.5) prime(); }, { once: true });

      v.addEventListener('play', hide);
      v.addEventListener('pause', show);
      v.addEventListener('ended', show);
    });

    // ホバーで一時停止
    [grid, dotsWrap].filter(Boolean).forEach((el) => {
      el.addEventListener('mouseenter', stopAuto);
      el.addEventListener('mouseleave', startAuto);
      el.addEventListener('focusin', stopAuto);
      el.addEventListener('focusout', startAuto);
    });

    buildDots();
    render();
    startAuto();
  })();

  // ランキング表示機能（1-10位、前日比較付き）
  (async function renderRankings() {
    const top3Wrap = document.getElementById('top3-list');
    const rankings410Wrap = document.getElementById('rankings-4-10-list');
    const note = document.getElementById('top3-note');
    if (!top3Wrap) return;

    const nowUtc = Date.now();
    const jst = new Date(nowUtc + 9 * 60 * 60 * 1000);
    const key = `${jst.getUTCFullYear()}-${String(jst.getUTCMonth()+1).padStart(2,'0')}-${String(jst.getUTCDate()).padStart(2,'0')}`;

    try {
      const res = await fetch('rankings.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('rankings.json not found');
      const data = await res.json();
      let rankings = [];

      console.log('Rankings data loaded:', data);
      console.log('Looking for key:', key);

      // 今日のデータを取得、なければ最新のデータを使用
      if (Array.isArray(data[key])) {
        rankings = data[key];
        console.log('Found today\'s data:', rankings);
      } else {
        const keys = Object.keys(data || {}).sort();
        const last = keys[keys.length - 1];
        console.log('Using latest data from:', last);
        if (last && Array.isArray(data[last])) {
          rankings = data[last];
          // note && (note.textContent = `ランキング集計日: ${last.replaceAll('-', '/')}`);
        }
      }

      console.log('Final rankings:', rankings);

      if (rankings.length === 0) {
        note && (note.textContent = 'ランキングデータがありません');
        return;
      }

      // 総いいね数を表示する関数（アイコン付き）
      function getLikesDisplay(likes) {
        if (likes === null || likes === undefined) {
          return '<span class="total-likes">--</span>';
        }
        return `<span class="total-likes">${likes} <svg class="like-icon-small" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg></span>`;
      }

      // トップ3の表示
      const medalSvg = '<svg class="medal__icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 2h10l-2 6H9L7 2zm5 7a6 6 0 1 1 0 12a6 6 0 0 1 0-12zm0 2.3l1.38 2.8l3.1.45l-2.24 2.17l.53 3.08L12 18.2l-2.77 1.46l.53-3.08L7.5 12.55l3.1-.45L12 11.3z"/></svg>';
      const ranks = ['gold', 'silver', 'bronze'];
      top3Wrap.innerHTML = '';

      rankings.slice(0, 3).forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'prize';
        card.style.position = 'relative';

        const medal = document.createElement('div');
        medal.className = `medal ${ranks[idx] || 'gold'}`;
        medal.setAttribute('aria-label', `${idx+1}位`);
        medal.innerHTML = medalSvg;

        const body = document.createElement('div');
        body.className = 'prize__body';

        // 順位ラベルを追加（1, 2, 3）
        const rankLabel = document.createElement('div');
        rankLabel.className = 'rank-label';
        rankLabel.textContent = item.rank;

        // 名前を区切り文字で分割（, や ・ に対応）
        const names = (item.name || '').split(/[,、・]/).map(n => n.trim()).filter(n => n);

        // 前日順位も区切り文字で分割
        const prevRanks = item.prevRank !== null && item.prevRank !== undefined
          ? String(item.prevRank).split(/[,、・]/).map(r => r.trim()).filter(r => r).map(r => parseInt(r))
          : [];

        const p = document.createElement('p');

        if (names.length > 1) {
          // 複数名の場合: 各名前に総いいね数を表示
          const nameParts = names.map((name, i) => {
            const likesDisplay = getLikesDisplay(item.likes);
            return `<span class="name-with-indicator"><span class="name-part">${name}</span>${likesDisplay}</span>`;
          }).join('');
          p.innerHTML = `<div class="rank-name-multi">${nameParts}</div>`;
        } else {
          // 単独の場合: 名前テキストと総いいね数を表示
          const likesDisplay = getLikesDisplay(item.likes);
          p.innerHTML = `<span class="rank-name"><span class="name-text">${item.name || ''}</span>${likesDisplay}</span>`;
        }

        body.appendChild(rankLabel);
        body.appendChild(p);
        card.appendChild(medal);
        card.appendChild(body);
        top3Wrap.appendChild(card);
      });

      // 4-10位の表示
      if (rankings410Wrap && rankings.length > 3) {
        rankings410Wrap.innerHTML = '';
        rankings.slice(3, 10).forEach((item) => {
          const rankItem = document.createElement('div');
          rankItem.className = 'ranking-item';

          // 名前を区切り文字で分割（, や ・ に対応）
          const names = (item.name || '').split(/[,、・]/).map(n => n.trim()).filter(n => n);

          // 前日順位も区切り文字で分割
          const prevRanks = item.prevRank !== null && item.prevRank !== undefined
            ? String(item.prevRank).split(/[,、・]/).map(r => r.trim()).filter(r => r).map(r => parseInt(r))
            : [];

          let nameHtml;
          let likesHtml;

          if (names.length > 1) {
            // 複数名の場合: 各名前に総いいね数を表示
            const nameParts = names.map((name, i) => {
              const likesDisplay = getLikesDisplay(item.likes);
              return `<span class="name-with-indicator"><span class="name-part">${name}</span>${likesDisplay}</span>`;
            }).join('');
            nameHtml = `<div class="ranking-name-multi">${nameParts}</div>`;
            likesHtml = ''; // いいね数は各名前の横に表示済み
          } else {
            // 単独の場合: 従来通り
            nameHtml = `<div class="ranking-name">${item.name || ''}</div>`;
            likesHtml = getLikesDisplay(item.likes);
          }

          rankItem.innerHTML = `
            <div class="ranking-number">${item.rank}</div>
            ${nameHtml}
            ${likesHtml}
          `;
          rankings410Wrap.appendChild(rankItem);
        });
      }
    } catch (e) {
      note && (note.textContent = 'ランキングの読み込みに失敗しました。');
      try { console.error(e); } catch {}
    }
  })();

  // 昨日のトップ3投稿
  (async function renderDailyTop3Posts() {
    const grid = document.getElementById('daily-posts-grid');
    const note = document.getElementById('daily-top3-note');
    if (!grid) return;

    const nowUtc = Date.now();
    const jst = new Date(nowUtc + 9 * 60 * 60 * 1000);
    const key = `${jst.getUTCFullYear()}-${String(jst.getUTCMonth()+1).padStart(2,'0')}-${String(jst.getUTCDate()).padStart(2,'0')}`;

    try {
      const res = await fetch('daily-top3.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('daily-top3.json not found');
      const data = await res.json();
      let posts = [];

      // 今日のデータを取得、なければ最新のデータを使用
      if (Array.isArray(data[key])) {
        posts = data[key];
      } else {
        const keys = Object.keys(data || {}).sort();
        const last = keys[keys.length - 1];
        if (last && Array.isArray(data[last])) {
          posts = data[last];
          note && (note.textContent = `集計日: ${last.replaceAll('-', '/')}`);
        }
      }

      if (posts.length === 0) {
        note && (note.textContent = '昨日のトップ3投稿データがありません');
        return;
      } else if (!note.textContent) {
        note && (note.textContent = `集計日: ${key.replaceAll('-', '/')}`);
      }

      // 投稿カードを生成（固定で3枚）
      grid.innerHTML = '';
      const groupUrl = 'https://www.facebook.com/groups/342734216486824';

      posts.slice(0, 3).forEach((post) => {
        const card = document.createElement('a');
        card.className = 'daily-post-card-simple';
        card.href = groupUrl;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';

        const name = document.createElement('p');
        name.className = 'daily-post-name';
        name.textContent = post.name;

        const likes = document.createElement('div');
        likes.className = 'daily-post-likes';
        likes.innerHTML = `<span>${post.likes || 0}</span> ♡`;

        card.appendChild(name);
        card.appendChild(likes);
        grid.appendChild(card);
      });
    } catch (e) {
      note && (note.textContent = '昨日のトップ3投稿の読み込みに失敗しました。');
      try { console.error('Daily top3 posts error:', e); } catch {}
    }
  })();

  // 総投稿数・総いいね数の表示
  const totalPostsEl = document.getElementById('total-posts');
  const totalLikesEl = document.getElementById('total-likes');

  // 実際の数値を表示
  if (totalPostsEl) totalPostsEl.textContent = '112';
  if (totalLikesEl) totalLikesEl.textContent = '1,855';
})();

// 表彰状ダウンロード機能
function downloadCertificate(imageUrl, filename) {
  fetch(imageUrl)
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    })
    .catch(error => {
      console.error('ダウンロードエラー:', error);
      alert('ダウンロードに失敗しました。');
    });
}
