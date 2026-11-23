/* Misi Gorden 3D — tampilan Three.js untuk logika game.js.
   Ruangan, jendela, dan gorden dibuat prosedural; perabot dari Meshy (assets/models3d). */
(() => {
  const canvas = document.getElementById('g3d');
  if (!canvas || !window.THREE) return;
  const T = THREE;

  /* ---------- renderer & scene ---------- */
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene();
  scene.background = new T.Color(0x1a2a36);
  const pmrem = new T.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new T.RoomEnvironment(), 0.04).texture;

  const camera = new T.PerspectiveCamera(42, 16 / 9, 0.1, 60);
  camera.position.set(1.25, 1.45, 3.7);
  const controls = new T.OrbitControls(camera, canvas);
  controls.target.set(0, 1.1, -1.3);
  controls.enableDamping = true; controls.enablePan = false;
  controls.minDistance = 2.8; controls.maxDistance = 6.5;
  controls.minPolarAngle = 1.05; controls.maxPolarAngle = 1.62;
  controls.minAzimuthAngle = -0.65; controls.maxAzimuthAngle = 0.65;

  /* ---------- ruangan ---------- */
  const W = 7, H = 2.9, Dp = 6, WIN_W = 4.2, WIN_H = 2.3, WIN_Y = 0.25, WALL_Z = -2.6;
  const mat = (c, r = 0.85, m = 0) => new T.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const floorMat = mat(0x9a7350, 0.55);
  const floor = new T.Mesh(new T.PlaneGeometry(W, Dp), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.z = WALL_Z + Dp / 2; floor.receiveShadow = true; scene.add(floor);
  // papan lantai halus (garis)
  const planks = new T.Group();
  for (let i = -W / 2; i <= W / 2; i += 0.22) {
    const l = new T.Mesh(new T.PlaneGeometry(0.004, Dp), mat(0x8d6a47, 0.7));
    l.rotation.x = -Math.PI / 2; l.position.set(i, 0.001, WALL_Z + Dp / 2); planks.add(l);
  }
  scene.add(planks);
  const wallMat = mat(0xe6ddcf, 0.95);
  // dinding belakang dengan lubang jendela (4 potong)
  const wb = (w, h, x, y) => { const m = new T.Mesh(new T.BoxGeometry(w, h, 0.18), wallMat); m.position.set(x, y, WALL_Z - 0.09); m.receiveShadow = true; m.castShadow = true; scene.add(m); };
  const side = (W - WIN_W) / 2;
  wb(side, H, -W / 2 + side / 2, H / 2);
  wb(side, H, W / 2 - side / 2, H / 2);
  wb(WIN_W, WIN_Y, 0, WIN_Y / 2);
  wb(WIN_W, H - WIN_Y - WIN_H, 0, WIN_Y + WIN_H + (H - WIN_Y - WIN_H) / 2);
  const sideWall = (x, ry) => { const m = new T.Mesh(new T.PlaneGeometry(Dp, H), wallMat); m.position.set(x, H / 2, WALL_Z + Dp / 2); m.rotation.y = ry; m.receiveShadow = true; scene.add(m); };
  sideWall(-W / 2, Math.PI / 2); sideWall(W / 2, -Math.PI / 2);
  const ceil = new T.Mesh(new T.PlaneGeometry(W, Dp), mat(0xf5f1ea, 1)); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, WALL_Z + Dp / 2); scene.add(ceil);
  // kusen + kaca
  const frameMat = mat(0x2a2a2a, 0.4, 0.6);
  const fr = (w, h, x, y) => { const m = new T.Mesh(new T.BoxGeometry(w, h, 0.08), frameMat); m.position.set(x, y, WALL_Z - 0.05); m.castShadow = true; scene.add(m); };
  fr(WIN_W, 0.06, 0, WIN_Y); fr(WIN_W, 0.06, 0, WIN_Y + WIN_H);
  [-WIN_W / 2, -WIN_W / 6, WIN_W / 6, WIN_W / 2].forEach(x => fr(0.06, WIN_H, x, WIN_Y + WIN_H / 2));
  const glass = new T.Mesh(new T.PlaneGeometry(WIN_W, WIN_H), new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transmission: 0.95, transparent: true, opacity: 0.18 }));
  glass.position.set(0, WIN_Y + WIN_H / 2, WALL_Z - 0.06); scene.add(glass);
  // luar: langit + taman
  const skyCanvas = document.createElement('canvas'); skyCanvas.width = 4; skyCanvas.height = 256;
  const sc = skyCanvas.getContext('2d'); const gr = sc.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#4f8fcf'); gr.addColorStop(0.6, '#9cc6e6'); gr.addColorStop(1, '#efd9b0'); sc.fillStyle = gr; sc.fillRect(0, 0, 4, 256);
  const skyTex = new T.CanvasTexture(skyCanvas); skyTex.encoding = T.sRGBEncoding;
  const sky = new T.Mesh(new T.PlaneGeometry(30, 14), new T.MeshBasicMaterial({ map: skyTex })); sky.position.set(0, 5, -12); scene.add(sky);
  const lawn = new T.Mesh(new T.PlaneGeometry(30, 10), mat(0x557f3c, 1)); lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, -0.02, -8); scene.add(lawn);
  for (let i = 0; i < 9; i++) {           // semak & pohon sederhana di luar
    const b = new T.Mesh(new T.SphereGeometry(0.5 + Math.random() * 0.7, 16, 12), mat([0x3f6b2f, 0x4a7a34, 0x36602a][i % 3], 1));
    b.position.set(-7 + i * 1.8 + Math.random(), 0.4, -6 - Math.random() * 3); scene.add(b);
  }

  /* ---------- cahaya ---------- */
  const hemi = new T.HemisphereLight(0xfff4e0, 0x5b4a3a, 0.55); scene.add(hemi);
  const sun = new T.DirectionalLight(0xfff0d0, 3.2);
  sun.position.set(-3.5, 5.5, -9); sun.target.position.set(0.4, 0, 0.6);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -3, near: 1, far: 22 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  const lamp = new T.PointLight(0xffd29a, 0, 6, 2); lamp.position.set(2.4, 2.4, 0.6); scene.add(lamp);   // lampu ruangan saat gelap

  /* ---------- track + motor ---------- */
  const TRACK_Y = WIN_Y + WIN_H + 0.14, CUR_Z = WALL_Z + 0.16;
  const track = new T.Mesh(new T.BoxGeometry(WIN_W + 0.5, 0.05, 0.05), mat(0xe9e9e6, 0.35, 0.3));
  track.position.set(0, TRACK_Y + 0.03, CUR_Z); track.castShadow = true; scene.add(track);
  const motorSlot = new T.Group(); motorSlot.position.set(WIN_W / 2 + 0.2, TRACK_Y - 0.12, CUR_Z); scene.add(motorSlot);
  const motorRing = new T.Mesh(new T.TorusGeometry(0.11, 0.008, 8, 40), new T.MeshBasicMaterial({ color: 0xfdb913, transparent: true, opacity: 0 }));
  motorRing.rotation.x = Math.PI / 2; motorRing.position.set(WIN_W / 2 + 0.2, TRACK_Y - 0.28, CUR_Z); scene.add(motorRing);

  /* ---------- gorden (kain berlipit prosedural) ---------- */
  const PANEL_MAX = WIN_W / 2 + 0.25, PANEL_MIN = 0.32, CUR_H = TRACK_Y - 0.04;
  const curMat = new T.MeshStandardMaterial({ color: 0xe9dcc3, roughness: 0.95, side: T.DoubleSide, transparent: true, opacity: 0.97 });
  const SEG_X = 90, SEG_Y = 8;
  const mkPanel = dir => {
    const geo = new T.PlaneGeometry(1, CUR_H, SEG_X, SEG_Y);
    const m = new T.Mesh(geo, curMat); m.castShadow = true; m.receiveShadow = true;
    m.userData = { dir, base: geo.attributes.position.array.slice() };
    scene.add(m); return m;
  };
  const panels = [mkPanel(-1), mkPanel(1)];
  const shapePanel = (m, w, t) => {
    const pos = m.geometry.attributes.position, base = m.userData.base, dir = m.userData.dir;
    const folds = 14, amp = 0.025 + 0.075 * (1 - (w - PANEL_MIN) / (PANEL_MAX - PANEL_MIN));   // makin rapat, lipatan makin dalam
    for (let i = 0; i < pos.count; i++) {
      const u = base[i * 3] + 0.5, y = base[i * 3 + 1];            // u: 0..1 dari tepi luar ke tepi dalam
      const x = dir < 0 ? -WIN_W / 2 - 0.25 + u * w : WIN_W / 2 + 0.25 - u * w;
      const sway = Math.sin(t * 2 + u * 6) * 0.004 * (1 - (y + CUR_H / 2) / CUR_H);
      pos.setXYZ(i, x, y + CUR_H / 2, CUR_Z + Math.sin(u * folds * Math.PI) * amp + sway);
    }
    pos.needsUpdate = true; m.geometry.computeVertexNormals();
  };

  /* ---------- perabot dari Meshy ---------- */
  const loader = new T.GLTFLoader();
  const cache = {};
  const loadScript = name => new Promise((res, rej) => {
    if (window.SOMFY_MODELS && window.SOMFY_MODELS[name]) return res(window.SOMFY_MODELS[name]);
    const s = document.createElement('script'); s.src = name.startsWith('p') ? `assets/models/${name}.js` : `assets/models3d/${name}.js`;
    s.onload = () => res(window.SOMFY_MODELS[name]); s.onerror = rej; document.head.appendChild(s);
  });
  const loadGLB = name => cache[name] || (cache[name] = loadScript(name).then(url => new Promise((res, rej) => loader.load(url, g => res(g.scene), undefined, rej))));
  const place = (obj, { size, axis = 'x', x = 0, z = 0, ry = 0 }) => {
    obj.rotation.y = ry;
    const box = new T.Box3().setFromObject(obj), s = new T.Vector3(); box.getSize(s);
    const k = size / (axis === 'y' ? s.y : Math.max(s.x, s.z));
    obj.scale.setScalar(k);
    const b2 = new T.Box3().setFromObject(obj), c = new T.Vector3(); b2.getCenter(c);
    obj.position.set(obj.position.x + x - c.x, obj.position.y - b2.min.y, obj.position.z + z - c.z);
    obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return obj;
  };
  const LAYOUT = {   // ukuran nyata perkiraan (m)
    bayi:  [['boks-bayi', { size: 1.3, x: -0.6, z: -0.4, ry: 0.15 }], ['tanaman', { size: 1.5, axis: 'y', x: 2.6, z: -1.8 }]],
    tamu:  [['sofa', { size: 2.1, x: -2.7, z: -0.3, ry: Math.PI / 2 }], ['meja-kopi', { size: 0.85, x: -1.45, z: -0.3 }], ['tanaman', { size: 1.5, axis: 'y', x: 2.7, z: -1.9 }]],
    silau: [['kabinet-tv', { size: 1.7, x: -3.0, z: -0.2, ry: Math.PI / 2 }], ['sofa', { size: 2.1, x: 1.3, z: 0.3, ry: -Math.PI / 2 }], ['meja-kopi', { size: 0.8, x: -0.6, z: 0.3 }]],
    sewa:  [['ranjang', { size: 2.1, x: 1.9, z: -0.7, ry: -Math.PI / 2 }], ['tanaman', { size: 1.5, axis: 'y', x: -2.7, z: -1.9 }]],
  };
  const furniture = new T.Group(); scene.add(furniture);
  let tvGlare = null, zzz = null, current = null;
  const sprite = (txt, color) => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
    x.font = '600 72px Figtree, system-ui, sans-serif'; x.fillStyle = color; x.textAlign = 'center'; x.fillText(txt, 128, 92);
    const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false })); sp.scale.set(0.5, 0.25, 1); return sp;
  };

  const loadEl = document.getElementById('g3d-load');
  const setMission = async id => {
    current = id;
    furniture.clear(); tvGlare = null; zzz = null;
    loadEl.hidden = false; loadEl.textContent = 'Memuat perabot…';
    const items = LAYOUT[id] || [];
    const objs = await Promise.all(items.map(([n]) => loadGLB(n).catch(() => null)));
    if (current !== id) return;
    objs.forEach((o, i) => {
      if (!o) return;
      const obj = place(o.clone(true), items[i][1]); obj.name = items[i][0]; tameEnv(obj); furniture.add(obj);
      if (items[i][0] === 'boks-bayi') { zzz = sprite('z z z', '#5d7685'); zzz.position.set(items[i][1].x, 1.35, items[i][1].z); furniture.add(zzz); }
      if (items[i][0] === 'kabinet-tv') {
        tvGlare = new T.Mesh(new T.PlaneGeometry(1.1, 0.6), new T.MeshBasicMaterial({ color: 0xfff2c4, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }));
        tvGlare.position.set(items[i][1].x + 0.42, 0.95, items[i][1].z); tvGlare.rotation.y = Math.PI / 2; furniture.add(tvGlare);
      }
    });
    loadEl.hidden = true;
  };

  // motor Glydea di ujung track (model katalog yang sama dengan halaman produk)
  loadGLB('p117_Glydea_ULTRA_35e_RTS').then(o => {
    const m = o.clone(true); m.rotation.set(0, Math.PI, 0);
    const b = new T.Box3().setFromObject(m), s = new T.Vector3(); b.getSize(s);
    m.scale.setScalar(0.42 / s.y);
    const b2 = new T.Box3().setFromObject(m), c = new T.Vector3(); b2.getCenter(c);
    m.position.sub(c); m.position.y -= 0.05;
    tameEnv(m); motorSlot.add(m);
  }).catch(() => {});

  const tameEnv = root => root.traverse(o => { if (o.isMesh && o.material) [].concat(o.material).forEach(m => { if ('envMapIntensity' in m) m.envMapIntensity = 0.35; }); });
  tameEnv(scene);

  /* ---------- state dari game.js ---------- */
  let st = { p: 0, moving: false, db: 0, wake: 0, sun: 0, mission: 'bayi' };
  window.GAME_VIEW = {
    setMission,
    render: s => { st = s; }
  };

  /* ---------- loop ---------- */
  const resize = () => {
    const r = canvas.parentElement.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas.parentElement); resize();
  let visible = true;
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(canvas);
  const clock = new T.Clock();
  const loop = () => {
    requestAnimationFrame(loop);
    if (!visible || !canvas.clientWidth) return;
    if (renderer.domElement.width === 0) resize();
    const t = clock.getElapsedTime();
    const w = PANEL_MIN + (PANEL_MAX - PANEL_MIN) * st.p;
    panels.forEach(p => shapePanel(p, w, t));
    const open = 1 - st.p;
    sun.intensity = 0.25 + 2.2 * open;
    hemi.intensity = 0.16 + 0.24 * open;
    lamp.intensity = st.p > 0.6 ? (st.p - 0.6) * 2.2 : 0;
    renderer.toneMappingExposure = 0.6 + 0.22 * open;
    motorRing.material.opacity = st.moving ? 0.25 + 0.6 * Math.max(0, (st.db - 25) / 22) * (0.6 + 0.4 * Math.sin(t * 14)) : 0;
    motorRing.scale.setScalar(st.moving ? 1 + 0.25 * Math.sin(t * 9) : 1);
    if (zzz) { zzz.position.y = 1.35 + Math.sin(t * 1.5) * 0.05; const hot = st.wake > 50; zzz.material.opacity = hot ? 0.5 + 0.5 * Math.sin(t * 10) : 0.85; zzz.material.color.set(hot ? 0xff6a3d : 0xffffff); }
    if (tvGlare) tvGlare.material.opacity = Math.min(0.85, (st.sun / 100) * open * 1.4);
    controls.update();
    renderer.render(scene, camera);
  };
  loop();
  setMission('bayi');
})();
