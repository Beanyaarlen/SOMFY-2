/* Somfy Indonesia v3 — dipakai semua halaman.
   Bergantung pada: GSAP + ScrollTrigger, Lenis, <model-viewer> (lokal di js/vendor) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) document.documentElement.classList.add('reduced');

  gsap.registerPlugin(ScrollTrigger);
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- header ---------- */
  const nav = $('#nav');
  const overlay = document.body.dataset.nav === 'overlay';
  $('.nav__burger').addEventListener('click', e => {
    const open = nav.classList.toggle('menu-open');
    e.currentTarget.setAttribute('aria-expanded', open);
  });
  const setNav = () => {
    const hero = $('#hero');                       // beranda: solid setelah pembuka selesai
    const limit = hero ? hero.offsetHeight - 80 : 80;
    nav.classList.toggle('is-solid', window.scrollY > limit);
    applyDark();
  };
  const darkOn = new Set();
  const applyDark = () => nav.classList.toggle('is-dark', darkOn.size > 0 && (nav.classList.contains('is-solid') || !overlay));
  // bagian gelap → header gelap
  $$('.demo, .cta, .band--ink, .remotes, .play, .r3page, .fhero--dark, .dhero--dark').forEach(sec => ScrollTrigger.create({
    trigger: sec, start: 'top 60px', end: 'bottom 60px',
    onToggle: s => { s.isActive ? darkOn.add(sec) : darkOn.delete(sec); applyDark(); }
  }));
  if (overlay) { addEventListener('scroll', setNav, { passive: true }); setNav(); }
  if (!overlay && $('.dhero--dark, .fhero--dark, .r3page')) nav.classList.add('is-dark');

  /* ---------- anchor halus ---------- */
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const el = $(id); if (!el) return;
    e.preventDefault();
    nav.classList.remove('menu-open');
    lenis ? lenis.scrollTo(el, { offset: -70, duration: 1.4 }) : el.scrollIntoView({ behavior: 'smooth' });
  }));
  if (location.hash && $(location.hash)) setTimeout(() => lenis && lenis.scrollTo($(location.hash), { offset: -70, immediate: true }), 60);

  /* ---------- reveal ---------- */
  $$('.reveal').forEach(el => gsap.to(el, {
    opacity: 1, y: 0, duration: 1.1, ease: 'expo.out',
    scrollTrigger: { trigger: el, start: 'top 90%', once: true }
  }));
  const ctaImg = $('.cta__bg img');
  if (ctaImg) gsap.fromTo(ctaImg, { yPercent: -8 }, { yPercent: 4, ease: 'none',
    scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ---------- model 3D: dimuat saat mendekati layar ---------- */
  const scripts = {};
  const loadModel = name => scripts[name] || (scripts[name] = new Promise((res, rej) => {
    if (window.SOMFY_MODELS && window.SOMFY_MODELS[name]) return res(window.SOMFY_MODELS[name]);
    const s = document.createElement('script');
    s.src = `assets/models/${name}.js`;
    s.onload = () => res(window.SOMFY_MODELS[name]);
    s.onerror = rej;
    document.head.appendChild(s);
  }));
  const setModel = async (mv, name) => {
    mv.dataset.model = name;
    mv.classList.remove('is-loaded');
    const src = await loadModel(name);
    if (mv.dataset.model === name) mv.src = src;
  };
  $$('model-viewer').forEach(mv => mv.addEventListener('load', () => mv.classList.add('is-loaded')));
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    io.unobserve(en.target);
    setModel(en.target, en.target.dataset.model);
  }), { rootMargin: '600px 0px' });
  $$('model-viewer').forEach(mv => io.observe(mv));

  /* ---------- util bersama ---------- */
  const flash = (el, v) => { if (el.textContent === v) return; el.textContent = v; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); };
  const radio = (sel, fn, root = document) => $$(sel, root).forEach(b => b.addEventListener('click', () => {
    $$(sel, root).forEach(x => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute(x.getAttribute('role') === 'tab' ? 'aria-selected' : 'aria-checked', on); });
    fn(b);
  }));
  const num = s => parseFloat(String(s).replace(',', '.'));
  const fmt = (n, d = 1) => n.toLocaleString('id-ID', { maximumFractionDigits: d });

  window.SF = { $, $$, reduced, lenis, setModel, flash, radio, num, fmt };
  addEventListener('load', () => ScrollTrigger.refresh());
})();
