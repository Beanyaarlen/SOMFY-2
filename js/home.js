/* Beranda: pembuka "masuk ke rumah" + demo gorden */
(() => {
  const { $, $$, reduced, radio } = window.SF;

  /* ---------- hero ---------- */
  const L = n => $(`.hero__layer[data-layer="${n}"]`);
  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom bottom', scrub: reduced ? true : 0.8 }
  })
    .to(L(1), { scale: 1.55, duration: 0.42 }, 0)
    .to('.beat--1', { autoAlpha: 0, y: -40, duration: 0.14 }, 0.1)
    .fromTo(L(2), { autoAlpha: 0, scale: 1.25 }, { autoAlpha: 1, scale: 1.04, duration: 0.24 }, 0.3)
    .fromTo('.beat--2', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.38)
    .to('.beat--2', { autoAlpha: 0, y: -40, duration: 0.1 }, 0.6)
    .to(L(2), { scale: 1.3, duration: 0.2 }, 0.54)
    .fromTo(L(3), { autoAlpha: 0, scale: 1.22 }, { autoAlpha: 1, scale: 1, duration: 0.24 }, 0.6)
    .fromTo('.beat--3', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.74)
    .to(L(3), { scale: 1.06, xPercent: -2, duration: 0.16 }, 0.84)
    .to('.hero__progress span', { scaleX: 1, duration: 1 }, 0)
    .to('.scroll-cue', { autoAlpha: 0, duration: 0.06 }, 0.04);

  /* ---------- demo gorden ---------- */
  const cl = $('#cl'), cr = $('#cr'), dim = $('.win__dim'), led = $('#led');
  const OPEN_W = 13.5, CLOSED_W = 51;   // lebar panel (% dari kaca)
  const PANEL_CM = 200;                 // jendela 4 m, bukaan tengah
  const DEMO_FACTOR = 4;                // animasi dipercepat 4×
  let gly = { cms: 15, label: '15', db: '37,3' };
  const demo = {
    motor: 'glydea', p: 0, target: 0, v: 0, moving: false, last: 0, t: 0,
    get cms() { return this.motor === 'glydea' ? gly.cms : 15; },
    get soft() { return this.motor === 'glydea'; },
    refresh() {
      $('#real-t').textContent = Math.round(PANEL_CM / this.cms);
      $('#remote-info').textContent = this.motor === 'glydea'
        ? `Glydea™ ULTRA · ${gly.label} cm/s · ${gly.db} dB(A)`
        : 'Movelite™ 35 · 15 cm/s · 40,6 dB(A)';
      $('#speed-mini').hidden = this.motor !== 'glydea';
    },
    render() {
      const w = OPEN_W + (CLOSED_W - OPEN_W) * this.p;
      cl.style.width = cr.style.width = w + '%';
      dim.style.opacity = (this.p * 0.22).toFixed(3);
      const pct = Math.round(this.p * 100);
      $('#st-pct').textContent = pct + '%';
      $('#st-txt').textContent = this.moving ? 'Bergerak…' : pct === 0 ? 'Terbuka' : pct === 100 ? 'Tertutup' : Math.abs(this.p - 0.5) < 0.01 ? 'Posisi “my”' : 'Berhenti';
      hud(this);
    },
    go(t) { this.target = t; if (!this.moving) { this.moving = true; this.v = 0; this.t = 0; this.last = performance.now(); requestAnimationFrame(this.tick); } },
    stop() { this.target = this.p; },
    tick: now => {
      const d = demo, dt = Math.min(0.05, (now - d.last) / 1000); d.last = now; d.t += dt;
      const vmax = 1 / (PANEL_CM / d.cms / DEMO_FACTOR);
      const dir = Math.sign(d.target - d.p), rem = Math.abs(d.target - d.p);
      if (d.soft) {                     // soft start & soft stop
        const brake = Math.sqrt(2 * rem * vmax * 2.2);
        d.v = Math.min(vmax, d.v + vmax * 2.2 * dt, brake);
      } else d.v = vmax;
      const step = Math.min(rem, d.v * dt);
      d.p += dir * step;
      if (rem - step < 0.0005 || dir === 0) { d.p = d.target; d.moving = false; d.v = 0; }
      d.render();
      if (d.moving) requestAnimationFrame(d.tick);
    }
  };
  /* ---------- HUD: waktu nyata, kecepatan, suara ---------- */
  const eq = $$('#hud-eq u');
  const dbOf = () => demo.motor === 'glydea' ? gly.db : '40,6';
  function hud(d) {
    const cms = d.v * PANEL_CM / DEMO_FACTOR;               // kecepatan sesaat (cm/s nyata)
    $('#hud-t').textContent = SF.fmt(d.t * DEMO_FACTOR);
    $('#hud-v').textContent = d.moving ? SF.fmt(cms) : '0';
    $('#hud-g').style.transform = `scaleX(${Math.min(1, cms / 20)})`;
    const db = SF.num(dbOf());
    $('#hud-db').textContent = d.moving ? dbOf() : '–';
    const amp = d.moving ? Math.max(0.08, (db - 25) / 22) * Math.min(1, cms / Math.max(1, d.cms)) : 0;
    eq.forEach((u, i) => { u.style.transform = `scaleY(${d.moving ? Math.max(0.12, amp * (0.55 + 0.45 * Math.sin(performance.now() / 90 + i * 1.7))) : 0.12})`; });
  }

  /* ---------- balapan 2 meter ---------- */
  const lanes = $$('.lane');
  let racing = false;
  $('#race-go').addEventListener('click', () => {
    if (racing) return;
    racing = true;
    const L = lanes.map(el => ({ el, dot: el.querySelector('.lane__dot'), out: el.querySelector('.lane__t'),
      vmax: SF.num(el.dataset.cms) * DEMO_FACTOR / PANEL_CM, soft: el.dataset.soft === '1', p: 0, v: 0, t: 0, done: false }));
    L.forEach(l => { l.el.classList.remove('is-done', 'is-first'); l.dot.style.left = '0px'; l.out.textContent = '…'; });
    let last = performance.now(), first = true;
    const step = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      L.forEach(l => {
        if (l.done) return;
        l.t += dt;
        const rem = 1 - l.p;
        l.v = l.soft ? Math.min(l.vmax, l.v + l.vmax * 2.2 * dt, Math.sqrt(2 * rem * l.vmax * 2.2)) : l.vmax;
        l.p = Math.min(1, l.p + Math.max(l.v, 0.002) * dt);
        l.dot.style.left = `calc(${l.p} * (100% - 20px))`;
        if (l.p >= 0.9995) {
          l.done = true; l.el.classList.add('is-done'); if (first) { l.el.classList.add('is-first'); first = false; }
          l.out.textContent = SF.fmt(l.t * DEMO_FACTOR) + ' dtk';
        }
      });
      if (L.some(l => !l.done)) requestAnimationFrame(step); else { racing = false; $('#race-go').textContent = 'Ulangi balapan'; }
    };
    $('#race-go').textContent = 'Berjalan…';
    requestAnimationFrame(step);
  });

  const blink = () => { led.classList.add('on'); setTimeout(() => led.classList.remove('on'), 260); };
  $$('.rbtn').forEach(b => b.addEventListener('click', () => {
    blink();
    const c = b.dataset.cmd;
    if (c === 'open') demo.go(0);
    else if (c === 'close') demo.go(1);
    else if (demo.moving) demo.stop();
    else demo.go(0.5);
  }));
  radio('[data-motor]', b => { demo.motor = b.dataset.motor; demo.refresh(); });
  radio('#speed-mini button', b => {
    gly = { cms: SF.num(b.dataset.cms), label: b.dataset.cms, db: b.dataset.db };
    demo.refresh();
  });
  demo.refresh(); demo.render();
  ScrollTrigger.create({ trigger: '#scene', start: 'top 65%', once: true,
    onEnter: () => setTimeout(() => { blink(); demo.go(0.5); }, 500) });
})();
