// bridge-v12.js — Front bridge pour Alternant Talent App
// - Branche sur /api/jobs, /api/auth/*, /api/direct, /api/events
// - Gère favoris (localStorage), compteurs, recherche, "Voir plus"
// - Insère "Ils recrutent cette semaine" après la 3e offre récente
// - Ouvre les modales #login / #signup si <dialog> présents (fallback via hash)

(() => {
  'use strict';

  // --------------------------- Sélecteurs & état ---------------------------
  const els = {
    jobsList: q('[data-ui="jobs-list"]') || q('#jobs-list') || q('#jobs') || createFallbackJobsMount(),
    visibleCount: q('[data-ui="visible-count"]'),
    favCount: q('[data-ui="fav-count"]'),
    weeklyMount: q('[data-ui="weekly-hiring"]'), // facultatif (sinon insertion auto)
    searchInput: q('[data-ui="search-input"]') || q('#search'),
    searchForm: q('[data-ui="search-form"]') || q('form#search-form'),
    loadMoreBtn: q('[data-action="load-more"]') || q('#load-more'),
    openLoginBtn: q('[data-action="open-login"]'),
    openSignupBtn: q('[data-action="open-signup"]'),
    logoutBtn: q('[data-action="logout"]'),
    profileBtn: q('[data-action="open-profile"]'),

    dlgLogin: q('#dlg-login'),
    dlgSignup: q('#dlg-signup'),
    dlgProfile: q('#dlg-profile'),

    formLogin: q('form[data-form="login"]') || q('#form-login'),
    formSignup: q('form[data-form="signup"]') || q('#form-signup'),
    formProfile: q('form[data-form="profile"]') || q('#form-profile'),

    toast: q('[data-ui="toast"]') // optionnel
  };

  const state = {
    user: null,
    profile: {},
    jobs: [],
    offset: 0,
    limit: 20,
    q: '',
    days: 30, // "Récents (≤ 30 jours)"
    loading: false,
    eof: false,
    favorites: new Set(readFavs())
  };

  // --------------------------- Utils DOM & misc ---------------------------
  function q(sel, root = document) { return root.querySelector(sel); }
  function qa(sel, root = document) { return [...root.querySelectorAll(sel)]; }
  function el(tag, attrs = {}, ...children) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') n.className = v;
      else if (k === 'dataset') for (const [dk, dv] of Object.entries(v || {})) n.dataset[dk] = dv;
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else if (v !== null && v !== undefined) n.setAttribute(k, v);
    }
    for (const c of children) n.append(c instanceof Node ? c : document.createTextNode(String(c)));
    return n;
  }
  function empty(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function fmtInt(n) { return new Intl.NumberFormat('fr-FR').format(n|0); }
  function todayYMD(d=new Date()){ const z=o=>String(o).padStart(2,'0'); return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`; }
  function isSameDay(a, b) {
    const da = new Date(a), db = new Date(b);
    return da.getFullYear()===db.getFullYear() && da.getMonth()===db.getMonth() && da.getDate()===db.getDate();
  }
  function daysDiff(iso) {
    const d = new Date(iso||Date.now()), now = new Date();
    return Math.floor((now - d) / (24*3600*1000));
  }
  function labelForDate(iso) {
    const d = new Date(iso||Date.now());
    if (isSameDay(d, new Date())) return 'aujourd’hui';
    const diff = daysDiff(d);
    if (diff <= 7) return 'cette semaine';
    if (diff <= 30) return 'récent';
    return `${diff} j`;
  }
  function isThisWeek(iso) { return daysDiff(iso) <= 7; }
  function sanitizeText(s) { return (s==null?'':String(s)).replace(/\s+/g,' ').trim(); }

  // fallback container if none present
  function createFallbackJobsMount() {
    const wrap = el('div', { id: 'jobs-list', 'data-ui':'jobs-list', style: 'max-width:960px;margin:16px auto;padding:0 12px;' });
    document.body.append(wrap);
    return wrap;
  }

  // --------------------------- API helper ---------------------------
  async function api(path, opts={}) {
    const res = await fetch(path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...opts
    });
    const ct = res.headers.get('content-type') || '';
    const payload = ct.includes('application/json') ? await res.json() : await res.text();
    if (!res.ok) throw new Error((payload && payload.error) || res.statusText || 'API_ERROR');
    return payload;
  }

  // --------------------------- Auth UI ---------------------------
  async function refreshMe() {
    try {
      const j = await api('/api/auth/me');
      state.user = j.user || null;
      state.profile = (j.user && j.user.profile) || {};
      renderAuthState();
    } catch {
      state.user = null;
      state.profile = {};
      renderAuthState();
    }
  }
  function renderAuthState() {
    // Simple visibilité d’actions
    toggle(els.openLoginBtn, !state.user);
    toggle(els.openSignupBtn, !state.user);
    toggle(els.logoutBtn, !!state.user);
    toggle(els.profileBtn, !!state.user);
  }
  function toggle(node, show) { if (!node) return; node.style.display = show ? '' : 'none'; }

  // open/close dialog helpers (n’opacifie rien si <dialog> absent)
  function openDialog(dlg){ if (!dlg) return; try { dlg.showModal?.(); } catch { dlg.open = true; } }
  function closeDialog(dlg){ if (!dlg) return; try { dlg.close?.(); } catch { dlg.open = false; } }

  function bindAuth() {
    // open buttons
    els.openLoginBtn?.addEventListener('click', () => openDialog(els.dlgLogin));
    els.openSignupBtn?.addEventListener('click', () => openDialog(els.dlgSignup));
    els.logoutBtn?.addEventListener('click', async () => {
      try { await api('/api/auth/logout', { method:'POST' }); } finally { state.user=null; renderAuthState(); }
    });
    els.profileBtn?.addEventListener('click', () => openDialog(els.dlgProfile));

    // forms
    els.formLogin?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const email = sanitizeText(fd.get('email'));
      const password = String(fd.get('password') || '');
      try {
        await api('/api/auth/login', { method:'POST', body: JSON.stringify({ email, password })});
        await refreshMe();
        closeDialog(els.dlgLogin);
        toast('Connecté !');
      } catch (err) { toast(err.message || 'Impossible de se connecter'); }
    });

    els.formSignup?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const email = sanitizeText(fd.get('email'));
      const password = String(fd.get('password') || '');
      try {
        await api('/api/auth/register', { method:'POST', body: JSON.stringify({ email, password })});
        await refreshMe();
        closeDialog(els.dlgSignup);
        toast('Compte créé !');
      } catch (err) { toast(err.message || 'Inscription impossible'); }
    });

    els.formProfile?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const payload = Object.fromEntries(fd.entries());
      // normaliser quelques champs
      payload.radius = Number(payload.radius || 0) || 0;
      payload.accept_remote = !!(payload.accept_remote === 'on' || payload.accept_remote === 'true' || payload.accept_remote === true);
      try {
        if (state.user) await api('/api/profile', { method:'POST', body: JSON.stringify(payload) });
        else localStorage.setItem('profile_local', JSON.stringify(payload));
        state.profile = payload;
        toast('Profil enregistré');
        closeDialog(els.dlgProfile);
      } catch (err) { toast(err.message || 'Erreur profil'); }
    });

    // Hash fallback (#login / #signup)
    if (location.hash === '#login') openDialog(els.dlgLogin);
    if (location.hash === '#signup') openDialog(els.dlgSignup);
    window.addEventListener('hashchange', () => {
      if (location.hash === '#login') openDialog(els.dlgLogin);
      if (location.hash === '#signup') openDialog(els.dlgSignup);
    });
  }

  // --------------------------- Jobs: fetch & rendu ---------------------------
  async function loadFirstPage() {
    state.offset = 0;
    state.eof = false;
    empty(els.jobsList);
    await loadMore();
  }

  async function loadMore() {
    if (state.loading || state.eof) return;
    state.loading = true;
    setBtnLoading(els.loadMoreBtn, true);

    try {
      const url = `/api/jobs?limit=${state.limit}&offset=${state.offset}&q=${encodeURIComponent(state.q)}&days=${state.days}`;
      const data = await api(url);
      const jobs = Array.isArray(data.jobs) ? data.jobs : [];
      state.jobs = state.offset === 0 ? jobs.slice() : state.jobs.concat(jobs);
      renderJobs(jobs, { append: state.offset > 0 });
      state.offset += jobs.length;
      if (state.offset >= data.count || jobs.length < state.limit) state.eof = true;

      updateVisibleCount();
    } catch (err) {
      console.error(err);
      toast('Erreur en chargeant les offres');
      state.eof = true;
    } finally {
      state.loading = false;
      setBtnLoading(els.loadMoreBtn, false);
      toggle(els.loadMoreBtn, !state.eof);
    }
  }

  function renderJobs(batch, { append }) {
    const frag = document.createDocumentFragment();
    const weekly = computeWeeklyCompanies(state.jobs);
    let insertedWeekly = false;
    let indexGlobalStart = state.offset;

    batch.forEach((job, i) => {
      const card = jobCard(job);
      frag.append(card);

      const idxGlobal = indexGlobalStart + i + 1; // 1-based
      if (!insertedWeekly && idxGlobal >= 3) {
        // On veut l'insérer APRÈS la 3e offre "cette semaine"
        const weekCountInRendered = countRenderedThisWeek(frag);
        const totalWeekInAll = state.jobs.filter(j => isThisWeek(j.posted_at)).length;
        if (totalWeekInAll >= 3 && weekCountInRendered >= 3) {
          frag.append(weeklyBlock(weekly));
          insertedWeekly = true;
        }
      }
    });

    if (append) els.jobsList.append(frag);
    else {
      empty(els.jobsList);
      els.jobsList.append(frag);
      // si on n'a pas pu l'insérer durant la boucle (ex: < 3 offres), on tente au mount dédié
      if (!insertedWeekly && (els.weeklyMount || weekly.total > 0)) {
        const block = weeklyBlock(weekly);
        if (els.weeklyMount) {
          empty(els.weeklyMount);
          els.weeklyMount.append(block);
        }
      }
    }
  }

  function jobCard(job) {
    const dateLabel = labelForDate(job.posted_at);
    const isFav = state.favorites.has(job.id);
    const chipRemote = job.remote ? chip('Télétravail partiel') : null;

    const card = el('article', { class: 'job-card', 'data-id': job.id });
    card.append(
      el('div', { class: 'job-head' },
        el('img', { class: 'job-logo', src: logoOf(job), alt: job.company || '', referrerpolicy: 'no-referrer' }),
        el('div', { class: 'job-head-txt' },
          el('div', { class: 'job-company' }, job.company || 'Entreprise'),
          el('h3', { class: 'job-title' }, job.title || 'Poste')
        ),
        el('button', { class: 'btn-fav', 'aria-pressed': isFav ? 'true' : 'false', 'data-action': 'favorite', 'data-id': job.id, title: 'Ajouter aux favoris' },
          svgStar(isFav)
        )
      ),
      el('div', { class: 'job-meta' },
        el('span', { class: 'meta-loc' }, job.location_city || '—'),
        el('span', { class: 'meta-dot' }, '·'),
        el('span', { class: 'meta-date' }, dateLabel),
        job.tags && job.tags.length ? el('span', { class: 'meta-dot' }, '·') : null,
        ...(job.tags || []).slice(0, 2).map(t => chip(t))
      ),
      el('div', { class: 'job-actions' },
        el('a', { class: 'btn-apply', href: `/api/direct?url=${encodeURIComponent(job.apply_url || '')}`, target: '_blank', rel: 'noopener', 'data-action': 'apply' }, 'Postuler')
      )
    );
    return card;
  }

  // --------------------------- Ils recrutent cette semaine ---------------------------
  function computeWeeklyCompanies(allJobs) {
    const week = (allJobs || []).filter(j => isThisWeek(j.posted_at));
    const counts = new Map();
    for (const j of week) {
      const k = (j.company || 'Entreprise').trim();
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    const entries = [...counts.entries()].sort((a,b)=> b[1]-a[1]).slice(0, 8);
    return {
      total: week.length,
      entries // [ [company, count], ... ]
    };
  }

  function weeklyBlock(weekly) {
    const wrap = el('section', { class: 'weekly-hiring', 'aria-label': 'Ils recrutent cette semaine' });
    if (!weekly || weekly.entries.length === 0) {
      wrap.append(el('div', { class: 'weekly-empty' }, '—'));
      return wrap;
    }
    wrap.append(
      el('h4', { class: 'weekly-title' }, 'Ils recrutent cette semaine'),
      el('div', { class: 'weekly-grid' },
        ...weekly.entries.map(([name, cnt]) => {
          return el('div', { class: 'weekly-item' },
            el('div', { class: 'wk-logo-wrap' }, el('img', { class: 'wk-logo', src: logoFromName(name), alt: name })),
            el('div', { class: 'wk-name' }, name),
            el('div', { class: 'wk-count' }, `${cnt} offre${cnt>1?'s':''}`)
          );
        })
      )
    );
    return wrap;
  }

  function countRenderedThisWeek(fragment) {
    // Compte les cartes taggées "cette semaine" dans le fragment (approx via label)
    return qa('.meta-date', fragment).filter(n => /cette semaine/i.test(n.textContent || '')).length;
    // NB: approximation suffisante pour l'insertion
  }

  // --------------------------- Favoris ---------------------------
  function readFavs() {
    try { return JSON.parse(localStorage.getItem('favorites') || '[]') || []; } catch { return []; }
  }
  function saveFavs() {
    localStorage.setItem('favorites', JSON.stringify([...state.favorites]));
    updateFavCount();
  }
  function updateFavCount() {
    if (els.favCount) els.favCount.textContent = fmtInt(state.favorites.size);
  }
  function updateVisibleCount() {
    if (!els.visibleCount) return;
    const countCards = qa('.job-card', els.jobsList).length;
    els.visibleCount.textContent = fmtInt(countCards);
  }

  // --------------------------- Recherche & "Voir plus" ---------------------------
  function bindSearch() {
    els.searchForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = els.searchInput ? String(els.searchInput.value || '') : '';
      state.q = raw.trim();
      loadFirstPage();
    });
    // tap "enter" sur input sans form
    els.searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        state.q = String(els.searchInput.value || '').trim();
        loadFirstPage();
      }
    });
  }
  function bindLoadMore() {
    els.loadMoreBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      loadMore();
    });
  }
  function setBtnLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = !!loading;
    btn.setAttribute('aria-busy', loading ? 'true' : 'false');
  }

  // --------------------------- Délégation d’événements ---------------------------
  function bindDelegates() {
    // Favori
    document.addEventListener('click', (e) => {
      const btn = e.target.closest?.('[data-action="favorite"]');
      if (!btn) return;
      e.preventDefault();
      const id = btn.getAttribute('data-id');
      if (!id) return;
      const isFav = state.favorites.has(id);
      if (isFav) state.favorites.delete(id);
      else state.favorites.add(id);
      saveFavs();
      // Update icône
      empty(btn);
      btn.append(svgStar(!isFav));
      btn.setAttribute('aria-pressed', !isFav ? 'true' : 'false');
    });

    // Apply : rien de spécial, mais on peut tracer / valider l’URL
    document.addEventListener('click', (e) => {
      const a = e.target.closest?.('a[data-action="apply"]');
      if (!a) return;
      // laisser suivre le lien vers /api/direct
    });
  }

  // --------------------------- SSE (nouvelles annonces) ---------------------------
  function bindSSE() {
    try {
      const es = new EventSource('/api/events');
      es.addEventListener('hello', (ev) => {
        // On peut afficher la dernière mise à jour si besoin
      });
      es.addEventListener('cache:update', async (ev) => {
        // Simple stratégie: si on est sur la première page, on la recharge
        if (state.offset === 0) {
          toast('Nouvelles annonces disponibles');
          await loadFirstPage();
        } else {
          toast('De nouvelles annonces sont prêtes (revenir en haut pour recharger)');
        }
      });
      es.addEventListener('ping', () => {});
    } catch {
      // Pas grave si SSE indisponible
    }
  }

  // --------------------------- Logos ---------------------------
  function logoOf(job) {
    if (job.logo_url) return job.logo_url;
    if (job.company) return logoFromName(job.company);
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
  }
  function logoFromName(name) {
    // Placeholder Google S2 via domaine inféré impossible ici → générer initiales
    const initials = (name||'').split(/\s+/).map(p => p[0]).slice(0,2).join('').toUpperCase() || '∎';
    // Data URL SVG pour conserver un rendu propre sans requête externe
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="54%" font-family="system-ui,Arial" font-weight="600" font-size="28" text-anchor="middle" fill="#111827">${initials}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  // --------------------------- Composants UI ---------------------------
  function chip(txt) {
    return el('span', { class: 'chip' }, String(txt));
  }
  function svgStar(active) {
    // Icône star minimal (plein si active)
    if (active) {
      const svg = el('svg', { viewBox: '0 0 24 24', width: '20', height: '20', 'aria-hidden':'true' });
      svg.innerHTML = '<path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>';
      return svg;
    } else {
      const svg = el('svg', { viewBox: '0 0 24 24', width: '20', height: '20', 'aria-hidden':'true' });
      svg.innerHTML = '<path fill="none" stroke="currentColor" stroke-width="2" d="m12 2 2.69 6.63 7.31.61-5.54 4.79 1.64 6.97L12 17.77l-6.1 3.23 1.64-6.97L2 9.24l7.31-.61z"></path>';
      return svg;
    }
  }

  // --------------------------- Toast (optionnel) ---------------------------
  let toastTimer = null;
  function toast(msg) {
    if (!msg) return;
    const n = els.toast || createToast();
    n.textContent = String(msg);
    n.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { n.style.opacity = '0'; }, 2600);
  }
  function createToast() {
    const n = el('div', { 'data-ui': 'toast', style: 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#111827;color:#fff;padding:10px 14px;border-radius:12px;font:14px/1.3 system-ui;box-shadow:0 6px 24px rgba(0,0,0,.18);transition:opacity .25s;z-index:9999;opacity:0;' });
    document.body.append(n);
    els.toast = n;
    return n;
  }

  // --------------------------- Init ---------------------------
  function bindGlobalStyles() {
    // Styles minimaux pour éviter décalages si pas de CSS dédié.
    const css = `
      .job-card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:14px;margin:10px 0}
      .job-head{display:flex;align-items:center;gap:12px}
      .job-logo{width:44px;height:44px;border-radius:10px;object-fit:cover;background:#f3f4f6;border:1px solid #e5e7eb}
      .job-head-txt{flex:1;min-width:0}
      .job-company{font:600 13px/1.1 system-ui;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .job-title{font:600 16px/1.25 system-ui;margin:.15rem 0 0;color:#0b0b0b}
      .btn-fav{border:none;background:#f8fafc;border-radius:10px;width:36px;height:36px;display:grid;place-items:center;cursor:pointer}
      .job-meta{display:flex;flex-wrap:wrap;gap:8px;align-items:center;color:#6B7280;margin:8px 0 2px;font:13px/1.2 system-ui}
      .meta-dot{color:#c2c6cc}
      .chip{background:#f3f4f6;border:1px solid #e5e7eb;border-radius:999px;padding:3px 8px;font:12px/1 system-ui;color:#374151}
      .job-actions{margin-top:10px}
      .btn-apply{display:inline-block;background:#111827;color:#fff;border-radius:10px;padding:10px 14px;font:600 14px/1 system-ui;text-decoration:none}
      .weekly-hiring{background:#fff;border:1px dashed #e5e7eb;border-radius:16px;padding:14px;margin:16px 0}
      .weekly-title{font:700 14px/1.2 system-ui;margin:0 0 10px;color:#0b0b0b}
      .weekly-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}
      .weekly-item{display:flex;align-items:center;gap:10px;border:1px solid #f1f2f4;border-radius:12px;padding:8px 10px;background:#fafafa}
      .wk-logo{width:28px;height:28px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;object-fit:cover}
      .wk-name{flex:1;min-width:0;font:600 13px/1.1 system-ui;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .wk-count{font:12px/1 system-ui;color:#6B7280}
    `;
    const style = el('style', {}, css);
    document.head.append(style);
  }

  async function init() {
    bindGlobalStyles();
    bindAuth();
    bindDelegates();
    bindSearch();
    bindLoadMore();
    bindSSE();
    updateFavCount();
    renderAuthState();
    await refreshMe();
    await loadFirstPage();
  }

  // boot
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
