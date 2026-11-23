/* Misi Gorden — game 2D. Semua angka dari SOMFY_DATA (katalog R01 & brosur Movelite). */
(() => {
  const { $, $$, num, fmt, lenis } = window.SF;
  const D = window.SOMFY_DATA;
  const PANEL_CM = 200, FACTOR = 4;              // panel 2 m, animasi dipercepat 4×
  const OPEN_W = 13.5, CLOSED_W = 51;

  /* ---------- misi ---------- */
  const MISSIONS = [
    { id: 'bayi', no: '01', title: 'Si kecil tidur', icon: 'moon',
      story: 'Bayi baru saja tidur siang dan cahaya masuk terlalu terang. Tutup gorden sampai rapat tanpa membangunkannya.',
      rules: ['Tutup gorden sampai 100%', 'Selesai dalam 40 detik nyata', 'Bayi terbangun kalau suara motor di atas 35 dB(A) terlalu lama'],
      start: 0, goal: 1, kg: 12, track: 4, limit: 40, maxDb: 35,
      stars: r => r.wake < 30 ? 3 : r.wake < 70 ? 2 : 1 },
    { id: 'tamu', no: '02', title: 'Tamu datang', icon: 'bell',
      story: 'Bel berbunyi. Tamu penting sudah di depan pintu dan ruang tamu masih gelap. Buka gorden secepat mungkin.',
      rules: ['Buka gorden sampai 0% (terbuka penuh)', 'Bintang 3 jika selesai ≤ 11 detik nyata', 'Batas waktu 16 detik nyata'],
      start: 1, goal: 0, kg: 15, track: 4, limit: 16,
      stars: r => r.t <= 11 ? 3 : r.t <= 13 ? 2 : 1 },
    { id: 'silau', no: '03', title: 'Silau siang', icon: 'sun',
      story: 'Matahari siang mulai mengenai layar TV. Gorden blackout di ruang keluarga ini berat: 48 kg di track 6 m.',
      rules: ['Motor harus sanggup 48 kg di track 6 m', 'Tutup gorden sampai 100%', 'Bintang 3 jika selesai ≤ 15 detik nyata'],
      start: 0, goal: 1, kg: 48, track: 6, limit: 22, sun: true,
      stars: r => r.t <= 15 ? 3 : r.t <= 18 ? 2 : 1 },
    { id: 'sewa', no: '04', title: 'Rumah sewa', icon: 'plug',
      story: 'Anda menyewa rumah dan tidak boleh membobok dinding untuk kabel listrik. Jendelanya 5 m, gorden 20 kg.',
      rules: ['Tidak ada kabel listrik di jendela', 'Track lurus 5 m, gorden 20 kg', 'Tutup gorden sampai 100%'],
      start: 0, goal: 1, kg: 20, track: 5, limit: 30, battery: true,
      stars: () => 3 },
  ];
  const ICON = {
    moon: '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>',
    bell: '<path d="M6 16V11a6 6 0 0112 0v5l2 2H4l2-2zM10 20a2 2 0 004 0"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    plug: '<path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 01-12 0V8zM12 17v5"/>',
  };

  /* ---------- simpanan bintang (aman bila storage tidak tersedia) ---------- */
  const KEY = window.GAME_VIEW ? 'somfy-misi-3d-v1' : 'somfy-misi-v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const save = o => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };
  let best = load();

  const starsHtml = n => '<span class="stars" aria-label="' + n + ' dari 3 bintang">' + [1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}">★</i>`).join('') + '</span>';

  const renderCards = () => {
    $('#mgrid').innerHTML = MISSIONS.map(m => `
      <button class="mcard" data-m="${m.id}" type="button">
        <span class="mcard__no">Misi ${m.no}</span>
        <svg class="mcard__icon" viewBox="0 0 24 24" aria-hidden="true">${ICON[m.icon]}</svg>
        <h3>${m.title}</h3>
        <p>${m.story}</p>
        <span class="mcard__foot">${starsHtml(best[m.id] || 0)}<span class="link-arrow">Main</span></span>
      </button>`).join('');
    const total = MISSIONS.reduce((a, m) => a + (best[m.id] || 0), 0);
    $('#m-total').textContent = `Bintang terkumpul: ${total} dari ${MISSIONS.length * 3}.`;
    $$('.mcard').forEach(b => b.addEventListener('click', () => open(b.dataset.m)));
  };

  /* ---------- kapasitas sesuai katalog ---------- */
  const capacity = (m, track) => {
    if (track > m.track_m) return 0;
    if (m.kg === 60 && track > 10) return 55;
    return m.kg;
  };
  const isGly = m => m.family === 'glydea';

  /* ---------- state permainan ---------- */
  const g = { mis: null, motor: null, cms: 15, db: '37,3', p: 0, target: 0, moving: false, started: false, t: 0, wake: 0, last: 0, over: false };
  const cl = $('#g-cl'), cr = $('#g-cr'), eq = $$('#g-eq u');
  const VIEW = window.GAME_VIEW || null;          // versi 3D memasang tampilan sendiri

  const speedBtns = (wrap, live) => {
    wrap.innerHTML = D.speeds.map(s => `<button type="button" role="radio" data-cms="${s.cms}" data-db="${s.db}" aria-checked="false">${s.cms}</button>`).join('');
    $$('button', wrap).forEach(b => b.addEventListener('click', () => setSpeed(b.dataset.cms, b.dataset.db)));
  };
  const setSpeed = (cms, db) => {
    g.cms = num(cms); g.db = db;
    $$('#g-speed button, #g-speed-live button').forEach(b => { const on = b.dataset.cms === cms; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on); });
  };

  const open = id => {
    g.mis = MISSIONS.find(m => m.id === id);
    const m = g.mis;
    $('#main').hidden = false;
    $('#g-result').hidden = true;
    $('#g-load').hidden = false; $('#g-play').hidden = true; $('#main').classList.remove('is-playing');
    $('#g-step').textContent = `Misi ${m.no} · ${m.title}`;
    $('#g-brief').innerHTML = `<svg class="gbrief__icon" viewBox="0 0 24 24" aria-hidden="true">${ICON[m.icon]}</svg>
      <h2>${m.title}</h2><p>${m.story}</p><ul>${m.rules.map(r => `<li>${r}</li>`).join('')}</ul>`;
    // pilihan motor
    $('#g-motors').innerHTML = D.motors.map(x => `
      <button type="button" class="gm" role="radio" aria-checked="false" data-id="${x.id}">
        <img src="assets/thumbs/${x.model}.webp" alt="" loading="lazy">
        <span><b>${x.name.replace('Glydea™ ULTRA', 'Glydea').replace('Movelite™', 'Movelite')}</b><small>${x.kg} kg · ${x.track_m} m · ${x.ctrl === 'WF' ? 'baterai' : 'listrik'}</small></span>
      </button>`).join('');
    $$('.gm').forEach(b => b.addEventListener('click', () => pickMotor(b.dataset.id)));
    speedBtns($('#g-speed')); speedBtns($('#g-speed-live'));
    pickMotor('glydea-ultra-35e-rts'); setSpeed('15', '37,3');
    if (VIEW) VIEW.setMission(m.id);
    reset();
    ScrollTrigger.refresh();
    setTimeout(() => { const top = $('#main').offsetTop - 70; lenis ? lenis.scrollTo(top, { duration: 1.1 }) : scrollTo({ top, behavior: 'smooth' }); }, 80);
  };

  const pickMotor = id => {
    g.motor = D.motors.find(x => x.id === id);
    $$('.gm').forEach(b => { const on = b.dataset.id === id; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on); });
    const gly = isGly(g.motor);
    $('#g-speed-wrap').hidden = !gly;
    if (!gly) { g.cms = 15; g.db = g.motor.db_min; }
    else setSpeed('15', '37,3');
  };

  const reset = () => {
    const m = g.mis;
    Object.assign(g, { p: m.start, target: m.start, moving: false, started: false, t: 0, wake: 0, over: false, sunT: 0 });
    $('#g-meter').hidden = !(m.maxDb || m.sun);
    $('#g-meter-l').textContent = m.maxDb ? 'Bayi terbangun' : 'Silau di TV';
    if ($('#g-sun')) $('#g-sun').style.opacity = m.sun ? '.15' : '0';
    $('#g-toast').hidden = true;
    render();
  };

  const toast = (txt, ms = 2200) => {
    const el = $('#g-toast'); el.textContent = txt; el.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => el.hidden = true, ms);
  };

  /* ---------- mulai: cek kecocokan motor ---------- */
  $('#g-start').addEventListener('click', () => {
    const m = g.mis, x = g.motor;
    reset();
    $('#g-load').hidden = true; $('#g-play').hidden = false; $('#main').classList.add('is-playing');
    $('#g-speed-live-wrap').hidden = !isGly(x);
    $('#g-motor-name').innerHTML = `<b>${x.name}</b> · ${isGly(x) ? 'kecepatan bisa diganti' : x.speed}`;
    if (m.battery && x.ctrl !== 'WF') return finish(false, `Di jendela ini tidak ada kabel listrik, dan ${x.name} butuh listrik ${x.power}. Motor berbaterai seperti Movelite™ Wirefree tidak perlu kabel.`, true);
    if (m.track > x.track_m) return finish(false, `${x.name} hanya untuk track lurus hingga ${x.track_m} m, sedangkan track di sini ${m.track} m.`, true);
    if (capacity(x, m.track) < m.kg) return finish(false, `Gorden ${m.kg} kg terlalu berat. Kapasitas ${x.name} adalah ${capacity(x, m.track)} kg pada track ${m.track} m.`, true);
    toast('Motor terpasang. Tekan remote untuk mulai!');
  });
  $('#g-back').addEventListener('click', () => { $('#main').hidden = true; renderCards(); const t = $('#misi').offsetTop - 80; lenis ? lenis.scrollTo(t) : scrollTo(0, t); });

  /* ---------- remote ---------- */
  const blink = () => { const l = $('#g-led'); l.classList.add('on'); setTimeout(() => l.classList.remove('on'), 240); };
  $$('[data-g]').forEach(b => b.addEventListener('click', () => {
    if (g.over || $('#g-play').hidden) return;
    blink(); $('#g-toast').hidden = true;
    const c = b.dataset.g;
    if (c === 'stop') { g.target = g.p; return; }
    g.target = c === 'open' ? 0 : 1;
    if (!g.started) { g.started = true; g.last = performance.now(); requestAnimationFrame(tick); }
    g.moving = g.target !== g.p;
  }));

  /* ---------- loop ---------- */
  const curDb = () => isGly(g.motor) ? num(g.db) : num(g.motor.db_min);
  const curCms = () => isGly(g.motor) ? g.cms : 15;
  function tick(now) {
    if (g.over) return;
    const dt = Math.min(0.05, (now - g.last) / 1000); g.last = now;
    const m = g.mis;
    g.t += dt * FACTOR;                                  // detik nyata
    const dir = Math.sign(g.target - g.p), rem = Math.abs(g.target - g.p);
    g.moving = rem > 0.0005;
    if (g.moving) {
      const step = Math.min(rem, curCms() * FACTOR / PANEL_CM * dt);
      g.p += dir * step;
      if (m.maxDb && curDb() > m.maxDb) g.wake = Math.min(100, g.wake + (curDb() - m.maxDb) * 12 * dt);
    } else if (m.maxDb) g.wake = Math.max(0, g.wake - 3 * dt);
    if (m.sun) g.sunT = Math.min(100, g.t / m.limit * 100 * (1 - g.p * 0.85));
    render();
    // menang / kalah
    if (Math.abs(g.p - m.goal) < 0.001) return finish(true);
    if (m.maxDb && g.wake >= 100) return finish(false, `Suara motor ${fmt(curDb())} dB(A) di atas 35 dB(A) terlalu lama, si kecil terbangun. Glydea™ ULTRA di 7,5 cm/s hanya 29,8 dB(A).`);
    if (g.t > m.limit) return finish(false, `Waktu habis (${m.limit} detik nyata). ${m.id === 'tamu' ? 'Coba kecepatan 20 cm/s: 2 m hanya butuh 10 detik.' : m.id === 'bayi' ? 'Di 7,5 cm/s, 2 m butuh sekitar 27 detik. Langsung tekan tombol turun.' : 'Coba kecepatan yang lebih tinggi.'}`);
    requestAnimationFrame(tick);
  }

  function render() {
    const m = g.mis; if (!m) return;
    if (cl) {
      const w = OPEN_W + (CLOSED_W - OPEN_W) * g.p;
      cl.style.width = cr.style.width = w + '%';
      $('#g-dim').style.opacity = (g.p * 0.25).toFixed(3);
    }
    $('#g-pct').textContent = Math.round(g.p * 100) + '%';
    $('#g-st').textContent = g.over ? 'Selesai' : !g.started ? 'Siap' : g.moving ? 'Bergerak…' : 'Berhenti';
    $('#g-t').textContent = fmt(g.t);
    $('#g-tg').style.transform = `scaleX(${Math.min(1, g.t / m.limit)})`;
    $('#g-v').textContent = g.moving ? fmt(curCms()) : '0';
    $('#g-db').textContent = g.moving ? fmt(curDb()) : '–';
    const amp = g.moving ? Math.max(0.1, (curDb() - 25) / 22) : 0;
    eq.forEach((u, i) => u.style.transform = `scaleY(${g.moving ? Math.max(0.12, amp * (0.55 + 0.45 * Math.sin(performance.now() / 90 + i * 1.7))) : 0.12})`);
    if (m.maxDb) { $('#g-meter-u').style.transform = `scaleX(${g.wake / 100})`; $('#g-meter').classList.toggle('is-hot', g.moving && curDb() > m.maxDb); }
    if (m.sun) { $('#g-meter-u').style.transform = `scaleX(${g.sunT / 100})`; if ($('#g-sun')) $('#g-sun').style.opacity = (0.15 + (1 - g.p) * Math.min(1, g.t / m.limit) * 0.75).toFixed(2); }
    if (VIEW) VIEW.render({ p: g.p, moving: g.moving, db: g.moving ? curDb() : 0, wake: g.wake, sun: m.sun ? g.sunT : 0, over: g.over, mission: m.id });
  }

  /* ---------- hasil ---------- */
  function finish(win, why = '', setup = false) {
    g.over = true; g.moving = false; render();
    const m = g.mis, x = g.motor;
    const stars = win ? m.stars({ t: g.t, wake: g.wake }) : 0;
    if (stars > (best[m.id] || 0)) { best[m.id] = stars; save(best); }
    const good = {
      bayi: 'glydea-ultra-35e-rts', tamu: 'glydea-ultra-35e-rts', silau: 'glydea-ultra-60e-rts', sewa: 'movelite-wirefree-35-rts'
    }[m.id];
    const rec = D.motors.find(y => y.id === good);
    const tip = {
      bayi: 'Glydea™ ULTRA di mode senyap 7,5 cm/s: 29,8 dB(A).',
      tamu: 'Glydea™ ULTRA di 20 cm/s menempuh 2 m dalam 10 detik.',
      silau: 'Glydea™ ULTRA 60e: 60 kg hingga 10 m (55 kg di 12 m), kecepatan hingga 20 cm/s.',
      sewa: 'Movelite™ Wirefree 35 RTS: baterai isi ulang, 35 kg, track lurus hingga 6 m.'
    }[m.id];
    const next = MISSIONS[(MISSIONS.indexOf(m) + 1) % MISSIONS.length];
    $('#g-result').innerHTML = `
      <div class="gresult__card">
        <p class="eyebrow">${win ? 'Misi berhasil' : setup ? 'Motor tidak cocok' : 'Misi gagal'}</p>
        ${starsHtml(stars)}
        <h3>${win ? `Selesai dalam ${fmt(g.t)} detik nyata` : 'Coba lagi'}</h3>
        <p>${win ? (m.maxDb ? `Tingkat bayi terbangun: ${Math.round(g.wake)}%.` : `Motor: ${x.name}.`) : why}</p>
        <p class="gresult__tip"><b>Pilihan yang pas:</b> ${tip} <a href="${rec.url}">Lihat ${rec.name}</a></p>
        <div class="gresult__btns">
          <button class="btn btn--pill btn--gold" type="button" data-r="again">Ulangi</button>
          <button class="btn btn--pill btn--ghost" type="button" data-r="next">Misi ${next.no}: ${next.title}</button>
        </div>
      </div>`;
    $('#g-result').hidden = false;
    $$('[data-r]', $('#g-result')).forEach(b => b.addEventListener('click', () => {
      if (b.dataset.r === 'again') { $('#g-result').hidden = true; $('#g-load').hidden = false; $('#g-play').hidden = true; $('#main').classList.remove('is-playing'); reset(); }
      else open(next.id);
    }));
  }

  renderCards();
  const fromHash = () => { const h = location.hash.slice(1); if (MISSIONS.some(m => m.id === h)) open(h); };
  addEventListener('hashchange', fromHash); fromHash();
})();
