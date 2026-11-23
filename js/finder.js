/* Bandingkan: cari motor yang pas + filter tabel */
(() => {
  const { $, $$, radio, num, fmt } = window.SF;
  const D = window.SOMFY_DATA;
  const st = { wmode: 'direct', power: 'any', ctrl: 'any' };
  let showAll = false;

  /* Kapasitas pada track lurus sesuai tabel seleksi katalog (hal. 112).
     Glydea 60e: 60 kg s.d. 10 m, 55 kg pada 12 m. Seri 35: 35 kg s.d. 10 m.
     Wirefree: maks. 6 m lurus (hal. 147). */
  const capacity = (m, track) => {
    if (track > m.track_m) return 0;
    if (m.kg === 60 && track > 10) return 55;
    return m.kg;
  };

  const weight = () => {
    if (st.wmode === 'direct') return num($('#f-kg').value) || 0;
    const kg = (num($('#c-gsm').value) / 1000) * num($('#c-w').value) * num($('#c-h').value) * num($('#c-f').value);
    $('#c-out').textContent = (isFinite(kg) ? fmt(kg) : '–') + ' kg';
    return isFinite(kg) ? kg : 0;
  };

  const rank = m => (m.family === 'movelite' ? (m.ctrl === 'WF' ? 1 : 0) : 2);
  const ctrlOf = m => (m.ctrl === 'WF' ? 'RTS' : m.ctrl);
  const run = () => {
    const kg = weight(), track = num($('#f-track').value) || 0;
    const res = D.motors
      .filter(m => st.power === 'any' || (st.power === 'batt') === (m.ctrl === 'WF'))
      .filter(m => st.ctrl === 'any' || ctrlOf(m) === st.ctrl)
      .map(m => ({ m, cap: capacity(m, track) }))
      .filter(x => x.cap > 0 && x.cap >= kg)
      .sort((a, b) => (a.cap - kg) - (b.cap - kg) || rank(a.m) - rank(b.m));

    $('#f-sum').innerHTML = `Gorden <b>${fmt(kg)} kg</b> di track lurus <b>${fmt(track)} m</b>: ` +
      (res.length ? `<b>${res.length}</b> motor sesuai.` : 'belum ada motor yang sesuai.');

    if (!res.length) {
      const why = track > 12 ? 'Track lurus terpanjang di katalog adalah 12 m (Glydea™ ULTRA 60e).'
        : kg > 60 ? 'Kapasitas terbesar di katalog adalah 60 kg (Glydea™ ULTRA 60e). Katalog juga menyebut konfigurasi tandem untuk beban lebih berat.'
        : track > 10 && kg > 55 ? 'Untuk track lebih dari 10 m (hingga 12 m), kapasitas Glydea™ ULTRA 60e menjadi 55 kg menurut tabel seleksi katalog.'
        : 'Coba ubah sumber daya atau cara kontrol.';
      $('#f-res').innerHTML = `<div class="empty"><h3>Belum ada yang cocok</h3><p>${why}</p><p><a class="link-arrow" href="#konsultasi">Konsultasikan dengan kami</a></p></div>`;
      return;
    }
    const LIMIT = 4;
    $('#f-res').innerHTML = res.map((x, i) => {
      const load = Math.min(100, Math.round(kg / x.cap * 100));
      return `<a class="res${i === 0 ? ' res--best' : ''}" href="${x.m.url}"${i >= LIMIT && !showAll ? ' hidden' : ''}>
        <img class="thumb" src="assets/thumbs/${x.m.model}.webp" alt="" loading="lazy">
        <div>
          <h3>${x.m.name}${i === 0 ? '<span class="res__best">Kapasitas paling pas</span>' : ''}</h3>
          <p class="res__meta">${x.cap} kg pada ${fmt(track)} m · ${x.m.speed} · ${x.m.db_min} dB(A) · ${x.m.ctrl === 'WF' ? 'baterai' : 'listrik'}</p>
          <div class="res__bar" aria-hidden="true"><i style="width:${load}%"></i></div>
          <p class="res__fit">Beban ${load}% dari kapasitas</p>
        </div>
        <span class="res__go link-arrow">Detail</span>
      </a>`;
    }).join('') + (res.length > LIMIT && !showAll ? `<button type="button" class="btn btn--pill btn--line res-more" id="f-more">Tampilkan ${res.length - LIMIT} motor lainnya</button>` : '');
    const more = $('#f-more');
    if (more) more.addEventListener('click', () => { showAll = true; run(); });
  };

  radio('[data-wmode]', b => {
    st.wmode = b.dataset.wmode;
    $$('[data-show]').forEach(el => el.hidden = el.dataset.show !== st.wmode);
    run();
  });
  radio('[data-power]', b => { st.power = b.dataset.power; run(); });
  radio('[data-ctrl]', b => { st.ctrl = b.dataset.ctrl; run(); });
  $$('#finder input').forEach(i => i.addEventListener('input', () => { showAll = false; run(); }));
  run();

  /* ---------- filter tabel ---------- */
  radio('[data-tfam]', b => {
    const f = b.dataset.tfam;
    $$('#tbl [data-fam]').forEach(c => c.hidden = f !== 'all' && c.dataset.fam !== f);
  });
})();
