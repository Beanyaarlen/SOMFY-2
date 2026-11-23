/* Halaman seri: konfigurator varian + pemilih kecepatan Glydea */
(() => {
  const { $, $$, radio, flash, setModel } = window.SF;
  const D = window.SOMFY_DATA;
  const cfg = $('#config');
  const fam = cfg.dataset.family;
  const state = fam === 'glydea' ? { cap: '35e', ctrl: 'RTS' } : { cap: '35', ctrl: 'RTS' };

  const pick = () => D.motors.find(m => m.family === fam && m.ctrl === state.ctrl && (fam !== 'glydea' || m.cap === state.cap));
  const update = () => {
    const m = pick(); if (!m) return;
    flash($('#cf-name'), m.name);
    const dds = $$('#cf-specs > div');
    m.cfg.forEach(([k, v], i) => {
      if (!dds[i]) return;
      dds[i].querySelector('dt').textContent = k;
      flash(dds[i].querySelector('dd'), v);
    });
    $('#cf-feats').innerHTML = m.feats.map(f => `<span class="chip">${f}</span>`).join('');
    $('#cf-link').href = m.url;
    const mv = $('#cf-mv');
    mv.alt = `Model 3D ${m.name}, seret untuk memutar`;
    setModel(mv, m.model);
  };
  radio('[data-opt="cap"]', b => { state.cap = b.dataset.val; update(); }, cfg);
  radio('[data-opt="ctrl"]', b => { state.ctrl = b.dataset.val; update(); }, cfg);

  /* ---------- kecepatan (Glydea) ---------- */
  const meter = $('#sp-meter');
  if (meter) radio('.speed__btns button', b => {
    $('#sp-db').textContent = b.dataset.db;
    $('#sp-cms').textContent = b.dataset.cms;
    meter.style.transform = `scaleX(${b.dataset.lvl})`;
  });
})();
