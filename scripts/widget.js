(function(){
  function normalize(url) {
    if (!url) return '';
    try {
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
      const u = new URL(url.trim());
      let host = u.hostname.toLowerCase();
      if (host.startsWith('www.')) host = host.slice(4);
      let path = u.pathname.replace(/\/+$/,'');
      return host + path;
    } catch {
      return url.toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/+$/,'');
    }
  }

  function pickRandom(list, excludeIdx) {
    if (list.length <= 1) return list[excludeIdx] || list[0];
    let r;
    do { r = Math.floor(Math.random() * list.length); } while (r === excludeIdx);
    return list[r];
  }

  function setTheme(root, paramTheme) {
    const cls = paramTheme ? paramTheme.toLowerCase() : 'auto';
    root.classList.remove('light','dark','auto');
    if (cls === 'light' || cls === 'dark') root.classList.add(cls);
    else root.classList.add('auto');
  }

  async function fetchCsv(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('CSV fetch failed');
    const text = await res.text();
    return text.split('\n').slice(1).filter(l=>l.trim()).map(r=>r.split(','));
  }

  function resolveIndex(rows, currentNorm) {
    if (!currentNorm) return -1;
    // currentNorm host+path; allow host-only match first
    const hostOnly = currentNorm.split('/')[0];
    let idx = rows.findIndex(r => normalize(r[0]) === currentNorm);
    if (idx === -1) {
      idx = rows.findIndex(r => normalize(r[0]).split('/')[0] === hostOnly);
    }
    return idx;
  }

  function buildUrlDisplay(u) {
    return u.replace(/^https?:\/\//,'').replace(/\/$/,'');
  }

  async function init(options = {}) {
    const params = new URLSearchParams(window.location.search);
    const siteParam = options.site || params.get('site') || '';
    const themeParam = options.theme || params.get('theme') || '';
    const widget = document.getElementById('webring-widget');
    const statusEl = document.getElementById('yw-status');
    if (!widget || !statusEl) return;

    setTheme(document.documentElement, themeParam);

    const prevEl = document.getElementById('yw-prev');
    const nextEl = document.getElementById('yw-next');
    const randEl = document.getElementById('yw-random');
    const listEl = document.getElementById('yw-list');

    const CSV_URL = 'https://gist.githubusercontent.com/oop1-10/d5e6254545c342cc43f0a0ea4737085f/raw/data.csv';
    let rows;
    try {
      rows = await fetchCsv(CSV_URL);
    } catch (e) {
      statusEl.textContent = 'Failed to load ring data.';
      statusEl.classList.add('yw-error');
      widget.classList.remove('loading');
      return;
    }

    const currentNorm = normalize(siteParam);
    const idx = resolveIndex(rows, currentNorm);

    if (idx === -1) {
      statusEl.innerHTML = 'Site not recognized. <a href="/" target="_top" style="color:var(--accent)">Visit ring</a>';
      const sample = rows.slice(0, Math.min(3, rows.length)).map(r=>buildUrlDisplay(r[0])).join(', ');
      prevEl.style.display = nextEl.style.display = randEl.style.display = 'none';
      listEl.textContent = 'Ring Home';
      listEl.href = '/';
      console.warn('[WebRing Widget] Supplied site URL not found:', siteParam);
      if (sample) console.warn('Example member URLs:', sample);
    } else {
      const total = rows.length;
      const prevIdx = (idx - 1 + total) % total;
      const nextIdx = (idx + 1) % total;
      const randUrl = pickRandom(rows.map(r=>r[0]), idx);

      const prevUrl = rows[prevIdx][0];
      const nextUrl = rows[nextIdx][0];

      prevEl.href = prevUrl;
      nextEl.href = nextUrl;
      randEl.href = randUrl;

      statusEl.textContent = `Member ${idx + 1} of ${total}`;
      prevEl.title = 'Previous: ' + buildUrlDisplay(prevUrl);
      nextEl.title = 'Next: ' + buildUrlDisplay(nextUrl);
      randEl.title = 'Random member';
      listEl.title = 'WebRing home';
    }

    widget.classList.remove('loading');
  }

  // Expose init
  window.initWebringWidget = init;
})();
