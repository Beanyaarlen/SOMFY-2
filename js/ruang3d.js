/* Ruang 3D Somfy — jelajahi ruangan (WASD / analog), pilih ruangan, motor, kecepatan, dan kain.
   Ruangan, jendela, gorden prosedural; perabot dari Meshy (assets/models3d); motor dari katalog (assets/models). */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const canvas = $('#r3'); if (!canvas || !window.THREE) return;
  const T = THREE, D = window.SOMFY_DATA;
  const num = s => parseFloat(String(s).replace(',', '.'));
  const fmt = (n, d = 1) => n.toLocaleString('id-ID', { maximumFractionDigits: d });
  const touch = matchMedia('(pointer: coarse)').matches;

  /* ================= renderer ================= */
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, touch ? 1.5 : 1.75));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene(); scene.background = new T.Color(0x1a2a36);
  const pmrem = new T.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new T.RoomEnvironment(), 0.04).texture;
  const camera = new T.PerspectiveCamera(60, 16 / 9, 0.05, 60);
  camera.rotation.order = 'YXZ';

  /* ================= ruangan ================= */
  const W = 7, H = 2.9, Dp = 6.4, WIN_W = 4.2, WIN_H = 2.3, WIN_Y = 0.25, WALL_Z = -2.6;
  const mat = (c, r = 0.85, m = 0) => new T.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const add = (geo, m, pos, rot) => { const o = new T.Mesh(geo, m); if (pos) o.position.set(...pos); if (rot) o.rotation.set(...rot); o.receiveShadow = true; scene.add(o); return o; };
  add(new T.PlaneGeometry(W, Dp), mat(0x9a7350, 0.55), [0, 0, WALL_Z + Dp / 2], [-Math.PI / 2, 0, 0]);
  for (let i = -W / 2; i <= W / 2; i += 0.22) add(new T.PlaneGeometry(0.004, Dp), mat(0x7f5e3e, 0.7), [i, 0.001, WALL_Z + Dp / 2], [-Math.PI / 2, 0, 0]);
  const wallMat = mat(0xe6ddcf, 0.95);
  const wb = (w, h, x, y) => { const m = add(new T.BoxGeometry(w, h, 0.18), wallMat, [x, y, WALL_Z - 0.09]); m.castShadow = true; };
  const side = (W - WIN_W) / 2;
  wb(side, H, -W / 2 + side / 2, H / 2); wb(side, H, W / 2 - side / 2, H / 2);
  wb(WIN_W, WIN_Y, 0, WIN_Y / 2); wb(WIN_W, H - WIN_Y - WIN_H, 0, WIN_Y + WIN_H + (H - WIN_Y - WIN_H) / 2);
  add(new T.PlaneGeometry(Dp, H), wallMat, [-W / 2, H / 2, WALL_Z + Dp / 2], [0, Math.PI / 2, 0]);
  add(new T.PlaneGeometry(Dp, H), wallMat, [W / 2, H / 2, WALL_Z + Dp / 2], [0, -Math.PI / 2, 0]);
  add(new T.PlaneGeometry(W, H), wallMat, [0, H / 2, WALL_Z + Dp], [0, Math.PI, 0]);
  add(new T.PlaneGeometry(W, Dp), mat(0xf5f1ea, 1), [0, H, WALL_Z + Dp / 2], [Math.PI / 2, 0, 0]);
  add(new T.BoxGeometry(W, 0.08, 0.02), mat(0xffffff, 0.6), [0, 0.04, WALL_Z + Dp - 0.01]);   // plint
  const frameMat = mat(0x2a2a2a, 0.4, 0.6);
  const fr = (w, h, x, y) => { const m = add(new T.BoxGeometry(w, h, 0.08), frameMat, [x, y, WALL_Z - 0.05]); m.castShadow = true; };
  fr(WIN_W, 0.06, 0, WIN_Y); fr(WIN_W, 0.06, 0, WIN_Y + WIN_H);
  [-WIN_W / 2, -WIN_W / 6, WIN_W / 6, WIN_W / 2].forEach(x => fr(0.06, WIN_H, x, WIN_Y + WIN_H / 2));
  add(new T.PlaneGeometry(WIN_W, WIN_H), new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.12 }), [0, WIN_Y + WIN_H / 2, WALL_Z - 0.06]);
  // pintu di dinding belakang (dekorasi)
  add(new T.BoxGeometry(0.95, 2.1, 0.04), mat(0x8a6646, 0.6), [-2.2, 1.05, WALL_Z + Dp - 0.03]);
  // luar
  const sky = document.createElement('canvas'); sky.width = 4; sky.height = 256;
  const sc = sky.getContext('2d'), gr = sc.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#4f8fcf'); gr.addColorStop(0.6, '#9cc6e6'); gr.addColorStop(1, '#efd9b0'); sc.fillStyle = gr; sc.fillRect(0, 0, 4, 256);
  const skyTex = new T.CanvasTexture(sky); skyTex.encoding = T.sRGBEncoding;
  { const m = new T.Mesh(new T.PlaneGeometry(34, 16), new T.MeshBasicMaterial({ map: skyTex })); m.position.set(0, 5, -13); scene.add(m); }
  add(new T.PlaneGeometry(34, 11), mat(0x557f3c, 1), [0, -0.02, -8], [-Math.PI / 2, 0, 0]);
  for (let i = 0; i < 10; i++) add(new T.SphereGeometry(0.55 + (i % 3) * 0.3, 16, 12), mat([0x3f6b2f, 0x4a7a34, 0x36602a][i % 3], 1), [-8 + i * 1.75, 0.45, -6 - (i % 4) * 0.8]);

  /* ================= cahaya ================= */
  const hemi = new T.HemisphereLight(0xfff4e0, 0x5b4a3a, 0.4); scene.add(hemi);
  const sun = new T.DirectionalLight(0xfff0d0, 2.4);
  sun.position.set(-3.5, 5.5, -9); sun.target.position.set(0.4, 0, 0.8);
  sun.castShadow = true; sun.shadow.mapSize.set(touch ? 1024 : 2048, touch ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -3, near: 1, far: 24 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02; scene.add(sun, sun.target);
  const lamp = new T.PointLight(0xffd29a, 0, 7, 2); lamp.position.set(0, 2.6, 0.6); scene.add(lamp);

  /* ================= track, motor, gorden ================= */
  const TRACK_Y = WIN_Y + WIN_H + 0.14, CUR_Z = WALL_Z + 0.16;
  const track = add(new T.BoxGeometry(WIN_W + 0.6, 0.05, 0.05), mat(0xe9e9e6, 0.35, 0.3), [0, TRACK_Y + 0.03, CUR_Z]); track.castShadow = true;
  const motorSlot = new T.Group(); motorSlot.position.set(WIN_W / 2 + 0.22, TRACK_Y - 0.14, CUR_Z + 0.02); scene.add(motorSlot);
  const ring = new T.Mesh(new T.TorusGeometry(0.12, 0.008, 8, 40), new T.MeshBasicMaterial({ color: 0xfdb913, transparent: true, opacity: 0 }));
  ring.rotation.x = Math.PI / 2; ring.position.set(WIN_W / 2 + 0.22, TRACK_Y - 0.36, CUR_Z + 0.02); scene.add(ring);

  const FABRIC = {
    vitrase:  { color: 0xf3ead8, opacity: 0.55, shadow: false, block: 0.35, label: 'Vitrase (tembus cahaya)' },
    dimout:   { color: 0xd9cbb2, opacity: 0.92, shadow: true,  block: 0.7,  label: 'Dimout' },
    blackout: { color: 0x6f6458, opacity: 1,    shadow: true,  block: 0.95, label: 'Blackout' },
  };
  const curMat = new T.MeshStandardMaterial({ roughness: 0.95, side: T.DoubleSide, transparent: true });
  const PANEL_MAX = WIN_W / 2 + 0.3, PANEL_MIN = 0.32, CUR_H = TRACK_Y - 0.04;
  const mkPanel = dir => {
    const geo = new T.PlaneGeometry(1, CUR_H, 90, 8), m = new T.Mesh(geo, curMat);
    m.userData = { dir, base: geo.attributes.position.array.slice() }; m.receiveShadow = true; scene.add(m); return m;
  };
  const panels = [mkPanel(-1), mkPanel(1)];
  const shapePanel = (m, w, t, moving) => {
    const pos = m.geometry.attributes.position, base = m.userData.base, dir = m.userData.dir;
    const amp = 0.025 + 0.075 * (1 - (w - PANEL_MIN) / (PANEL_MAX - PANEL_MIN));
    for (let i = 0; i < pos.count; i++) {
      const u = base[i * 3] + 0.5, y = base[i * 3 + 1], low = 1 - (y + CUR_H / 2) / CUR_H;
      const x = dir < 0 ? -WIN_W / 2 - 0.3 + u * w : WIN_W / 2 + 0.3 - u * w;
      const sway = Math.sin(t * 2 + u * 6) * (moving ? 0.012 : 0.003) * low;
      pos.setXYZ(i, x, y + CUR_H / 2, CUR_Z + Math.sin(u * 14 * Math.PI) * amp + sway);
    }
    pos.needsUpdate = true; m.geometry.computeVertexNormals();
  };

  /* ================= pemuat model ================= */
  const loader = new T.GLTFLoader(), cache = {};
  const loadScript = name => new Promise((res, rej) => {
    if (window.SOMFY_MODELS && window.SOMFY_MODELS[name]) return res(window.SOMFY_MODELS[name]);
    const s = document.createElement('script'); s.src = /^p\d/.test(name) ? `assets/models/${name}.js` : `assets/models3d/${name}.js`;
    s.onload = () => res(window.SOMFY_MODELS[name]); s.onerror = rej; document.head.appendChild(s);
  });
  const loadGLB = name => cache[name] || (cache[name] = loadScript(name).then(url => new Promise((res, rej) => loader.load(url, g => res(g.scene), undefined, rej))));
  const tameEnv = root => root.traverse(o => { if (o.isMesh && o.material) [].concat(o.material).forEach(m => { if ('envMapIntensity' in m) m.envMapIntensity = 0.35; }); });
  tameEnv(scene);
  const place = (obj, { size, axis = 'x', x = 0, z = 0, ry = 0 }) => {
    obj.rotation.y = ry;
    const s = new T.Vector3(); new T.Box3().setFromObject(obj).getSize(s);
    obj.scale.setScalar(size / (axis === 'y' ? s.y : Math.max(s.x, s.z)));
    const b = new T.Box3().setFromObject(obj), c = new T.Vector3(); b.getCenter(c);
    obj.position.set(obj.position.x + x - c.x, obj.position.y - b.min.y, obj.position.z + z - c.z);
    obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return obj;
  };

  /* ================= ruangan (tata letak) ================= */
  const ROOMS = {
    tamu:     { name: 'Ruang tamu', items: [['sofa', { size: 2.1, x: -2.7, z: -0.3, ry: Math.PI / 2 }], ['meja-kopi', { size: 0.85, x: -1.45, z: -0.3 }], ['tanaman', { size: 1.5, axis: 'y', x: 2.7, z: -1.9 }]] },
    keluarga: { name: 'Ruang keluarga', items: [['kabinet-tv', { size: 1.7, x: -3.0, z: 0.2, ry: Math.PI / 2 }], ['sofa', { size: 2.1, x: 1.6, z: 0.2, ry: -Math.PI / 2 }], ['meja-kopi', { size: 0.8, x: -0.6, z: 0.2 }], ['tanaman', { size: 1.5, axis: 'y', x: 2.8, z: -2.0 }]] },
    tidur:    { name: 'Kamar tidur', items: [['ranjang', { size: 2.1, x: 1.9, z: -0.7, ry: -Math.PI / 2 }], ['tanaman', { size: 1.5, axis: 'y', x: -2.7, z: -1.9 }]] },
    bayi:     { name: 'Kamar bayi', items: [['boks-bayi', { size: 1.3, x: -0.9, z: 0.1, ry: 0.15 }], ['tanaman', { size: 1.5, axis: 'y', x: 2.7, z: -1.9 }]] },
  };
  const furniture = new T.Group(); scene.add(furniture);
  let blockers = [], roomId = null;
  const loadEl = $('#r3-load');
  const setRoom = async id => {
    roomId = id; furniture.clear(); blockers = [];
    loadEl.hidden = false; loadEl.textContent = 'Memuat perabot…';
    const items = ROOMS[id].items;
    const objs = await Promise.all(items.map(([n]) => loadGLB(n).catch(() => null)));
    if (roomId !== id) return;
    objs.forEach((o, i) => {
      if (!o) return;
      const obj = place(o.clone(true), items[i][1]); tameEnv(obj); furniture.add(obj);
      const b = new T.Box3().setFromObject(obj); b.expandByScalar(0.22); blockers.push(b);
    });
    loadEl.hidden = true;
    pushOut();
  };

  /* ================= motor ================= */
  let motor = null, motorReq = 0;
  const setMotorModel = async m => {
    const req = ++motorReq;
    $('#r3-load').hidden = false; loadEl.textContent = 'Memuat motor…';
    const o = await loadGLB(m.model).catch(() => null);
    if (req !== motorReq) return;
    motorSlot.clear();
    if (o) {
      const c3 = o.clone(true); c3.rotation.set(0, Math.PI, 0);
      const s = new T.Vector3(); new T.Box3().setFromObject(c3).getSize(s);
      c3.scale.setScalar(0.44 / s.y);
      const b = new T.Box3().setFromObject(c3), c = new T.Vector3(); b.getCenter(c);
      c3.position.sub(c); tameEnv(c3); motorSlot.add(c3);
    }
    loadEl.hidden = true;
  };

  /* ================= state gorden ================= */
  const st = { p: 0, target: 0, cms: 15, db: 37.3, t: 0, speedUp: 1, fabric: 'dimout' };
  const applyFabric = () => {
    const f = FABRIC[st.fabric];
    curMat.color.set(f.color); curMat.opacity = f.opacity; curMat.needsUpdate = true;
    panels.forEach(p => p.castShadow = f.shadow);
  };
  applyFabric();

  /* ================= kontrol orang pertama ================= */
  const player = { x: 0.6, z: 2.6, yaw: 0.12, pitch: -0.04, eye: 1.6 };
  const keys = {};
  let active = false;                                    // keyboard hanya saat ruang 3D aktif
  const view = $('#r3-view');
  view.addEventListener('pointerdown', () => { active = true; view.classList.add('is-active'); });
  document.addEventListener('pointerdown', e => { if (!view.contains(e.target)) { active = false; view.classList.remove('is-active'); } });
  const KEYMAP = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r', ShiftLeft: 'run', ShiftRight: 'run', KeyQ: 'tl', KeyE: 'tr' };
  addEventListener('keydown', e => {
    if (!active && !document.fullscreenElement) return;
    const k = KEYMAP[e.code]; if (!k) return;
    keys[k] = true; e.preventDefault(); hideHint();
  });
  addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) keys[k] = false; });
  addEventListener('blur', () => Object.keys(keys).forEach(k => keys[k] = false));

  // seret untuk melihat sekeliling (mouse & sentuh)
  let drag = null;
  canvas.addEventListener('pointerdown', e => { drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; try { canvas.setPointerCapture(e.pointerId); } catch (_) {} });
  canvas.addEventListener('pointermove', e => {
    if (!drag || drag.id !== e.pointerId) return;
    const k = touch ? 0.006 : 0.0042;
    player.yaw -= (e.clientX - drag.x) * k; player.pitch -= (e.clientY - drag.y) * k;
    player.pitch = Math.max(-1.1, Math.min(1.1, player.pitch));
    drag.x = e.clientX; drag.y = e.clientY; hideHint();
  });
  const endDrag = e => { if (drag && drag.id === e.pointerId) drag = null; };
  canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
  // zoom: roda mouse / tombol
  const zoom = d => { camera.fov = Math.max(30, Math.min(75, camera.fov + d)); camera.updateProjectionMatrix(); $('#r3-zoomv').textContent = Math.round(60 / camera.fov * 100) + '%'; };
  canvas.addEventListener('wheel', e => { e.preventDefault(); zoom(Math.sign(e.deltaY) * 3); }, { passive: false });
  $('#r3-zin').addEventListener('click', () => zoom(-6));
  $('#r3-zout').addEventListener('click', () => zoom(6));

  // analog virtual (HP / tablet)
  const stick = $('#r3-stick'), knob = $('#r3-knob'), joy = { x: 0, y: 0, id: null };
  const joyMove = e => {
    const r = stick.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = r.width / 2;
    let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy);
    if (d > R) { dx *= R / d; dy *= R / d; }
    joy.x = dx / R; joy.y = dy / R; knob.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  stick.addEventListener('pointerdown', e => { e.stopPropagation(); joy.id = e.pointerId; try { stick.setPointerCapture(e.pointerId); } catch (_) {} joyMove(e); hideHint(); active = true; });
  stick.addEventListener('pointermove', e => { if (joy.id === e.pointerId) joyMove(e); });
  const joyEnd = e => { if (joy.id !== e.pointerId) return; joy.id = null; joy.x = joy.y = 0; knob.style.transform = ''; };
  stick.addEventListener('pointerup', joyEnd); stick.addEventListener('pointercancel', joyEnd);

  const hint = $('#r3-hint');
  const hideHint = () => { if (!hint.hidden) hint.classList.add('is-gone'); setTimeout(() => hint.hidden = true, 400); };

  // tabrakan sederhana: dinding + perabot
  const BX = [-W / 2 + 0.3, W / 2 - 0.3], BZ = [WALL_Z + 0.42, WALL_Z + Dp - 0.3];
  function pushOut() {
    player.x = Math.max(BX[0], Math.min(BX[1], player.x));
    player.z = Math.max(BZ[0], Math.min(BZ[1], player.z));
    blockers.forEach(b => {
      if (player.x > b.min.x && player.x < b.max.x && player.z > b.min.z && player.z < b.max.z) {
        const d = [player.x - b.min.x, b.max.x - player.x, player.z - b.min.z, b.max.z - player.z], i = d.indexOf(Math.min(...d));
        if (i === 0) player.x = b.min.x; else if (i === 1) player.x = b.max.x; else if (i === 2) player.z = b.min.z; else player.z = b.max.z;
      }
    });
  }

  // tempat pandang cepat
  const SPOTS = {
    pintu:   { x: 0.6, z: 2.6, yaw: 0.12, pitch: -0.04 },
    jendela: { x: 0.2, z: -0.9, yaw: 0, pitch: 0.12 },
    motor:   { x: 1.45, z: -1.35, yaw: -0.55, pitch: 0.5 },
  };
  $$('[data-spot]').forEach(b => b.addEventListener('click', () => { Object.assign(player, SPOTS[b.dataset.spot]); pushOut(); hideHint(); }));

  /* ================= layar penuh ================= */
  const fsBtn = $('#r3-fs');
  const isFs = () => document.fullscreenElement === view || document.webkitFullscreenElement === view || view.classList.contains('is-pseudo-fs');
  const setFsUi = () => { const on = isFs(); fsBtn.setAttribute('aria-pressed', on); fsBtn.querySelector('span').textContent = on ? 'Keluar' : 'Layar penuh'; document.body.classList.toggle('r3-lock', view.classList.contains('is-pseudo-fs')); setTimeout(resize, 60); };
  fsBtn.addEventListener('click', async () => {
    if (isFs()) {
      if (document.fullscreenElement) await document.exitFullscreen(); else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      view.classList.remove('is-pseudo-fs'); setFsUi(); return;
    }
    try {
      if (view.requestFullscreen) await view.requestFullscreen({ navigationUI: 'hide' });
      else if (view.webkitRequestFullscreen) view.webkitRequestFullscreen();
      else throw 0;
    } catch (e) { view.classList.add('is-pseudo-fs'); }   // iPhone: layar penuh semu
    active = true; setFsUi();
  });
  document.addEventListener('fullscreenchange', setFsUi);
  document.addEventListener('webkitfullscreenchange', setFsUi);
  addEventListener('keydown', e => { if (e.key === 'Escape' && view.classList.contains('is-pseudo-fs')) { view.classList.remove('is-pseudo-fs'); setFsUi(); } });

  /* ================= panel kanan ================= */
  const radio = (sel, fn) => $$(sel).forEach(b => b.addEventListener('click', () => {
    $$(sel).forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-checked', x === b); }); fn(b);
  }));
  radio('[data-room]', b => setRoom(b.dataset.room));
  radio('[data-fabric]', b => { st.fabric = b.dataset.fabric; applyFabric(); });
  radio('[data-x]', b => { st.speedUp = +b.dataset.x; });
  const speedWrap = $('#r3-speeds');
  speedWrap.innerHTML = D.speeds.map(s => `<button type="button" role="radio" aria-checked="${s.cms === '15'}" class="${s.cms === '15' ? 'is-on' : ''}" data-cms="${s.cms}" data-db="${s.db}">${s.cms}<small>${s.db} dB</small></button>`).join('');
  radio('#r3-speeds button', b => { st.cms = num(b.dataset.cms); st.db = num(b.dataset.db); showMotor(); });
  const list = $('#r3-motors');
  list.innerHTML = D.motors.map(m => `
    <button type="button" class="r3m" role="radio" aria-checked="false" data-id="${m.id}">
      <img src="assets/thumbs/${m.model}.webp" alt="" loading="lazy">
      <span><b>${m.name}</b><small>${m.kg} kg · track ${m.track_m} m · ${m.speed} · ${m.db_min} dB(A)</small></span>
    </button>`).join('');
  radio('.r3m', b => pickMotor(b.dataset.id));
  function pickMotor(id) {
    motor = D.motors.find(m => m.id === id);
    $$('.r3m').forEach(x => { const on = x.dataset.id === id; x.classList.toggle('is-on', on); x.setAttribute('aria-checked', on); });
    const gly = motor.family === 'glydea';
    $('#r3-speed-sec').hidden = !gly;
    if (!gly) { st.cms = 15; st.db = num(motor.db_min); }
    else { const on = $('#r3-speeds .is-on'); st.cms = num(on.dataset.cms); st.db = num(on.dataset.db); }
    setMotorModel(motor); showMotor();
  }
  function showMotor() {
    const m = motor; if (!m) return;
    $('#r3-mname').textContent = m.name;
    $('#r3-mmeta').textContent = `${m.kg} kg · track ${m.track_m} m · ${m.power}`;
    $('#r3-mlink').href = m.url;
    $('#r3-time').textContent = fmt(200 / st.cms);
    $('#r3-chip').textContent = `${m.name.replace('Glydea™ ULTRA', 'Glydea').replace('Movelite™', 'Movelite')} · ${fmt(st.cms)} cm/s · ${fmt(st.db)} dB(A)`;
  }

  // remote (panel & di dalam layar)
  const led = $$('.r3-led');
  const blink = () => { led.forEach(l => l.classList.add('on')); setTimeout(() => led.forEach(l => l.classList.remove('on')), 240); };
  $$('[data-cmd]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation(); blink();
    const c = b.dataset.cmd;
    if (c === 'open') st.target = 0; else if (c === 'close') st.target = 1;
    else st.target = Math.abs(st.target - st.p) > 0.001 ? st.p : 0.5;   // my: stop, atau ke posisi favorit
    st.t = 0;
  }));

  /* ================= HUD ================= */
  const eq = $$('.r3 .eq u');
  const hud = moving => {
    $('#r3-t').textContent = fmt(st.t);
    $('#r3-v').textContent = moving ? fmt(st.cms) : '0';
    $('#r3-db').textContent = moving ? fmt(st.db) : '–';
    $('#r3-pct').textContent = Math.round(st.p * 100) + '%';
    $('#r3-st').textContent = moving ? 'Bergerak…' : st.p < 0.005 ? 'Terbuka' : st.p > 0.995 ? 'Tertutup' : Math.abs(st.p - 0.5) < 0.01 ? 'Posisi “my”' : 'Berhenti';
    const amp = moving ? Math.max(0.1, (st.db - 25) / 22) : 0;
    eq.forEach((u, i) => u.style.transform = `scaleY(${moving ? Math.max(0.12, amp * (0.55 + 0.45 * Math.sin(performance.now() / 90 + i * 1.7))) : 0.12})`);
  };

  /* ================= loop ================= */
  function resize() {
    const r = canvas.parentElement.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas.parentElement); resize();
  let visible = true;
  new IntersectionObserver(e => visible = e[0].isIntersecting).observe(canvas);
  const clock = new T.Clock(); let last = 0;
  const fwd = new T.Vector3(), right = new T.Vector3();
  function loop() {
    requestAnimationFrame(loop);
    const t = clock.getElapsedTime(), dt = Math.min(0.05, t - last); last = t;
    // gorden (waktu nyata × percepatan)
    const rem = st.target - st.p, moving = Math.abs(rem) > 0.0005;
    if (moving) {
      const step = st.cms / 200 * dt * st.speedUp;
      st.p += Math.sign(rem) * Math.min(Math.abs(rem), step);
      st.t += dt * st.speedUp;
    }
    if (!visible || !canvas.clientWidth) return;
    // gerak pemain
    const sp = (keys.run ? 2.6 : 1.5) * dt;
    let mf = (keys.f ? 1 : 0) - (keys.b ? 1 : 0) - joy.y, ms = (keys.r ? 1 : 0) - (keys.l ? 1 : 0) + joy.x;
    if (keys.tl) player.yaw += 1.6 * dt; if (keys.tr) player.yaw -= 1.6 * dt;
    const len = Math.hypot(mf, ms); if (len > 1) { mf /= len; ms /= len; }
    if (len > 0.02) {
      fwd.set(-Math.sin(player.yaw), 0, -Math.cos(player.yaw)); right.set(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
      player.x += (fwd.x * mf + right.x * ms) * sp; player.z += (fwd.z * mf + right.z * ms) * sp;
      pushOut();
    }
    const bob = len > 0.02 ? Math.sin(t * 9) * 0.012 : 0;
    camera.position.set(player.x, player.eye + bob, player.z);
    camera.rotation.set(player.pitch, player.yaw, 0);
    // tampilan
    const w = PANEL_MIN + (PANEL_MAX - PANEL_MIN) * st.p;
    panels.forEach(p => shapePanel(p, w, t, moving));
    const light = 1 - st.p * FABRIC[st.fabric].block;
    sun.intensity = 0.15 + 2.3 * light; hemi.intensity = 0.12 + 0.3 * light;
    lamp.intensity = light < 0.45 ? (0.45 - light) * 3 : 0;
    renderer.toneMappingExposure = 0.58 + 0.24 * light;
    ring.material.opacity = moving ? 0.3 + 0.6 * Math.max(0, (st.db - 25) / 22) * (0.6 + 0.4 * Math.sin(t * 14)) : 0;
    ring.scale.setScalar(moving ? 1 + 0.25 * Math.sin(t * 9) : 1);
    hud(moving);
    renderer.render(scene, camera);
  }
  loop();
  setRoom('tamu');
  pickMotor('glydea-ultra-35e-rts');
  if (touch) hint.querySelector('[data-hint="touch"]').hidden = false; else hint.querySelector('[data-hint="desk"]').hidden = false;
})();
