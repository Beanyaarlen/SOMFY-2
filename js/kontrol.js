/* Kontrol: pemilih remote & saklar */
(() => {
  const { $, radio, setModel } = window.SF;
  const D = window.SOMFY_DATA;
  const motors = t => D.motors.filter(m => t === 'WT' ? m.ctrl === 'WT' : (m.ctrl === 'RTS' || m.ctrl === 'WF'));
  const show = id => {
    const r = D.remotes.find(x => x.id === id); if (!r) return;
    const mv = $('#r-mv');
    mv.alt = 'Model 3D ' + r.name;
    setModel(mv, r.model);
    $('#r-info').innerHTML = `
      <span class="tag${r.type === 'RTS' ? ' tag--gold' : ''}">${r.type === 'RTS' ? 'Nirkabel · RTS' : 'Berkabel · WT'}</span>
      <h3>${r.name}</h3>
      <p>${r.lead}</p>
      <ul class="pts">${r.points.map(p => `<li>${p}</li>`).join('')}</ul>
      <dl class="spec-list">${r.specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
      <p class="fit">Cocok untuk: ${motors(r.type).map(m => `<a href="${m.url}">${m.name}</a>`).join(', ')}</p>
      <p class="fine">Sumber: Somfy Catalogue R01, hal. ${r.page}–${r.page + 1}.</p>`;
  };
  radio('[data-remote]', b => show(b.dataset.remote));
  const start = location.hash.slice(1);
  const btn = start && document.querySelector(`[data-remote="${start}"]`);
  btn ? btn.click() : show(D.remotes[0].id);
})();
