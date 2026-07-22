(function (global) {
  "use strict";

  const THREE = global.THREE;
  const DISCOVERIES = Object.freeze([
    Object.freeze({
      id: "sun",
      label: "陽光和花",
      result: "陽光照著花，花瓣慢慢打開了",
      speech: Object.freeze(["暖暖的陽光照下來。", "花瓣慢慢打開了。"]),
      wait: 1180
    }),
    Object.freeze({
      id: "rain",
      label: "雨雲和水",
      result: "雨點落進水裡，水面出現一圈一圈波紋",
      speech: Object.freeze(["雨點落進水裡。", "水面出現一圈一圈的波紋。"]),
      wait: 1480
    }),
    Object.freeze({
      id: "flower",
      label: "花朵和蜜蜂",
      result: "小蜜蜂飛到花旁邊找花蜜",
      speech: Object.freeze(["小蜜蜂飛到花旁邊找花蜜。", "牠的身上也會沾到花粉。"]),
      wait: 1450
    }),
    Object.freeze({
      id: "wind",
      label: "風和風車",
      result: "風車轉起來，讓我們看見風來了",
      speech: Object.freeze(["風本來看不見。", "風車轉起來，我們就知道風來了。"]),
      wait: 1380
    })
  ]);

  const OPENING = Object.freeze({
    prompt: "花園裡，誰會先動起來？",
    hint: "太陽、雲朵、花和風車，想先看哪一個就碰哪一個",
    speech: Object.freeze(["花園裡有幾個小變化。", "太陽、雲朵、花和風車，你想先看看哪一個？"])
  });

  function unsupportedController(options) {
    const showFallback = () => {
      if (options.fallback) options.fallback.hidden = false;
      if (options.host) options.host.hidden = true;
      options.onStatus?.("這台裝置暫時不能顯示 3D，可以和大人到窗邊看看天空和植物。", "fallback");
    };
    showFallback();
    return {
      supported: false,
      start: showFallback,
      pause() {},
      reset: showFallback,
      destroy() {},
      getSnapshot() {
        return { supported: false, complete: false, discovered: [], count: 0, total: DISCOVERIES.length };
      },
      getScreenPoint() { return null; },
      selectTarget() { return false; },
      samplePixels() { return Promise.resolve({ colors: 0, opaqueRatio: 0 }); }
    };
  }

  function createNatureGarden(options) {
    if (!THREE || !options?.host) return unsupportedController(options || {});

    const host = options.host;
    const fallback = options.fallback;
    const reduceMotion = global.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const animations = [];
    const interactiveMeshes = [];
    const targetAnchors = new Map();
    const halos = new Map();
    const discovered = new Set();
    const roundTouches = Object.fromEntries(DISCOVERIES.map((item) => [item.id, 0]));
    const colors = {
      sky: 0xbfeaf5,
      grass: 0x84ca83,
      grassDark: 0x3f9565,
      white: 0xfffcf8,
      cream: 0xffefd2,
      pink: 0xf58ead,
      coral: 0xf47e6f,
      yellow: 0xf7cb52,
      blue: 0x65a9df,
      teal: 0x5fb8aa,
      dark: 0x40364b,
      wood: 0xb98255,
      water: 0x62bfe0,
      lavender: 0x9d8bd8
    };

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true
      });
    } catch {
      return unsupportedController(options);
    }

    renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(colors.sky, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = "playroom-canvas";
    renderer.domElement.setAttribute("aria-label", "可自由觸控的兔兔 3D 自然花園");
    renderer.domElement.setAttribute("role", "application");
    renderer.domElement.tabIndex = 0;
    host.replaceChildren(renderer.domElement);
    host.hidden = false;
    if (fallback) fallback.hidden = true;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x4f8a63, 2.55);
    scene.add(hemi);
    const keyLight = new THREE.DirectionalLight(0xfff3d2, 4.1);
    keyLight.position.set(-4, 9, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -7;
    keyLight.shadow.camera.right = 7;
    keyLight.shadow.camera.top = 7;
    keyLight.shadow.camera.bottom = -3;
    scene.add(keyLight);
    const fill = new THREE.DirectionalLight(0xd9edff, 1.25);
    fill.position.set(7, 4, 5);
    scene.add(fill);

    const world = new THREE.Group();
    scene.add(world);

    const island = new THREE.Mesh(
      new THREE.CylinderGeometry(7.25, 7.8, 0.48, 56),
      toonMaterial(colors.grass)
    );
    island.position.y = -0.28;
    island.receiveShadow = true;
    world.add(island);

    const path = new THREE.Mesh(
      new THREE.RingGeometry(1.8, 3.55, 48, 1, 0.25, Math.PI * 1.18),
      toonMaterial(0xf6e5b9)
    );
    path.rotation.x = -Math.PI / 2;
    path.position.set(0.35, 0.015, 0.25);
    world.add(path);

    const pond = createPond();
    world.add(pond.root);

    addTree(-5.35, -1.8, 0.86);
    addTree(5.15, -2.55, 0.7);
    addCloudDecoration(-4.75, 5.45, -4.8, 0.72);
    addCloudDecoration(4.9, 5.85, -5.2, 0.55);
    addGroundFlowers();

    const bunny = createBunny();
    bunny.root.position.set(-3.55, 0.04, 0.25);
    bunny.root.rotation.y = -0.05;
    world.add(bunny.root);

    const sun = createSunTarget();
    sun.root.position.set(3.45, 4.05, -1.45);
    world.add(sun.root);

    const rain = createRainTarget();
    rain.root.position.set(-0.75, 3.2, -1.65);
    rain.root.userData.baseY = 3.2;
    world.add(rain.root);

    const flower = createFlowerTarget();
    flower.root.position.set(0.25, 0.02, 1.15);
    world.add(flower.root);

    const wind = createWindTarget();
    wind.root.position.set(3.3, 0.03, 0.55);
    world.add(wind.root);

    const sunBuds = [
      createBud(1.45, 0.12, 1.85, colors.coral),
      createBud(2.1, 0.08, 2.25, colors.yellow),
      createBud(2.62, 0.06, 1.75, colors.pink)
    ];
    sunBuds.forEach((bud) => world.add(bud.root));

    const bee = createBee();
    bee.root.visible = false;
    world.add(bee.root);

    const seeds = createSeeds();
    seeds.root.visible = false;
    world.add(seeds.root);

    let active = false;
    let locked = false;
    let complete = false;
    let completionReported = false;
    let frameId = 0;
    let resizeObserver;
    let transitionTimer = 0;
    let transitionSettle = null;
    let transitionToken = 0;
    let bunnyReacting = false;
    let lastTime = performance.now();

    syncHalos();
    resize();
    renderer.render(scene, camera);

    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("keydown", handleKeyDown);
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    function toonMaterial(color, settings = {}) {
      return new THREE.MeshStandardMaterial({
        color,
        roughness: settings.roughness ?? 0.72,
        metalness: settings.metalness ?? 0,
        emissive: settings.emissive ?? 0x000000,
        emissiveIntensity: settings.emissiveIntensity ?? 0,
        transparent: settings.transparent ?? false,
        opacity: settings.opacity ?? 1,
        depthWrite: settings.depthWrite ?? true
      });
    }

    function sphere(radius, material, width = 24, height = 16) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, width, height), material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    }

    function makeHitTarget(id, geometry, position = [0, 0, 0]) {
      const hit = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
      );
      hit.position.set(...position);
      hit.userData.discoveryId = id;
      hit.renderOrder = -1;
      interactiveMeshes.push(hit);
      targetAnchors.set(id, hit);
      return hit;
    }

    function makeHalo(id, radius, position = [0, 0, 0], color = 0xfff1a6) {
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
        toneMapped: false
      });
      const halo = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.055, 10, 48), material);
      halo.position.set(...position);
      halo.renderOrder = 4;
      halos.set(id, { mesh: halo, material });
      return halo;
    }

    function createPond() {
      const root = new THREE.Group();
      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(1.72, 1.82, 0.13, 44),
        toonMaterial(0x6fad7c)
      );
      rim.scale.z = 0.58;
      rim.position.y = 0.03;
      root.add(rim);
      const water = new THREE.Mesh(
        new THREE.CylinderGeometry(1.55, 1.6, 0.08, 44),
        toonMaterial(colors.water, { roughness: 0.35, emissive: 0x2f8db5, emissiveIntensity: 0.08 })
      );
      water.scale.z = 0.58;
      water.position.y = 0.12;
      root.add(water);
      const rings = [0.38, 0.7, 1.03].map((radius) => {
        const material = new THREE.MeshBasicMaterial({
          color: 0xdff8ff,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          toneMapped: false
        });
        const ring = new THREE.Mesh(new THREE.RingGeometry(radius - 0.035, radius, 40), material);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.18;
        ring.scale.z = 0.58;
        root.add(ring);
        return { mesh: ring, material, radius };
      });
      root.position.set(-0.35, 0, -1.1);
      return { root, water, rings };
    }

    function createSunTarget() {
      const root = new THREE.Group();
      const rays = new THREE.Group();
      const rayMaterial = toonMaterial(colors.yellow, { emissive: colors.yellow, emissiveIntensity: 0.24 });
      for (let index = 0; index < 12; index += 1) {
        const angle = index / 12 * Math.PI * 2;
        const ray = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.42, 4, 10), rayMaterial);
        ray.position.set(Math.cos(angle) * 1.08, Math.sin(angle) * 1.08, 0);
        ray.rotation.z = angle - Math.PI / 2;
        rays.add(ray);
      }
      root.add(rays);
      const core = sphere(0.7, toonMaterial(0xffdc62, { emissive: 0xffc83f, emissiveIntensity: 0.28 }), 28, 20);
      core.scale.z = 0.72;
      root.add(core);
      const cheekMaterial = toonMaterial(colors.coral);
      [-0.25, 0.25].forEach((x) => {
        const eye = sphere(0.055, toonMaterial(colors.dark), 12, 8);
        eye.position.set(x, 0.08, 0.66);
        root.add(eye);
        const cheek = sphere(0.075, cheekMaterial, 12, 8);
        cheek.scale.set(1.25, 0.55, 0.35);
        cheek.position.set(x * 1.42, -0.13, 0.64);
        root.add(cheek);
      });
      const halo = makeHalo("sun", 1.02, [0, 0, 0.18], 0xffef8e);
      root.add(halo);
      root.add(makeHitTarget("sun", new THREE.SphereGeometry(1.12, 18, 12), [0, 0, 0]));
      return { root, rays, core };
    }

    function createRainTarget() {
      const root = new THREE.Group();
      const cloudMaterial = toonMaterial(0xf7fbff, { emissive: 0xdcefff, emissiveIntensity: 0.1 });
      [[-0.58, 0, 0.58], [0, 0.2, 0.82], [0.67, -0.03, 0.6]].forEach(([x, y, size]) => {
        const puff = sphere(size, cloudMaterial, 20, 14);
        puff.scale.z = 0.52;
        puff.position.set(x, y, 0);
        root.add(puff);
      });
      const drops = new THREE.Group();
      const dropMaterial = toonMaterial(0x7cc9eb, { emissive: 0x4caedb, emissiveIntensity: 0.18 });
      for (let index = 0; index < 10; index += 1) {
        const drop = sphere(0.085, dropMaterial, 12, 8);
        drop.scale.set(0.58, 1.65, 0.58);
        drop.position.set(-0.95 + (index % 5) * 0.48, -0.65 - Math.floor(index / 5) * 0.55, (index % 2) * 0.12);
        drop.userData.baseY = drop.position.y;
        drops.add(drop);
      }
      drops.visible = false;
      root.add(drops);
      const halo = makeHalo("rain", 1.28, [0.02, 0.02, 0.2], 0xccefff);
      root.add(halo);
      root.add(makeHitTarget("rain", new THREE.BoxGeometry(2.75, 1.55, 1.1), [0, 0, 0]));
      return { root, drops };
    }

    function createFlowerTarget() {
      const root = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.095, 1.25, 10), toonMaterial(colors.grassDark));
      stem.position.y = 0.62;
      stem.castShadow = true;
      root.add(stem);
      [-1, 1].forEach((direction) => {
        const leaf = sphere(0.24, toonMaterial(0x61ad70), 16, 10);
        leaf.scale.set(1.15, 0.42, 0.62);
        leaf.position.set(direction * 0.23, 0.55, 0);
        leaf.rotation.z = direction * -0.42;
        root.add(leaf);
      });
      const petals = new THREE.Group();
      for (let index = 0; index < 7; index += 1) {
        const angle = index / 7 * Math.PI * 2;
        const petal = sphere(0.3, toonMaterial(index % 2 ? colors.pink : 0xffa6bf), 18, 12);
        petal.scale.set(0.68, 1.18, 0.42);
        petal.position.set(Math.cos(angle) * 0.42, Math.sin(angle) * 0.42, 0);
        petal.rotation.z = angle - Math.PI / 2;
        petals.add(petal);
      }
      petals.position.y = 1.35;
      root.add(petals);
      const center = sphere(0.31, toonMaterial(colors.yellow, { emissive: 0xffc744, emissiveIntensity: 0.12 }), 20, 14);
      center.position.set(0, 1.35, 0.18);
      root.add(center);
      const halo = makeHalo("flower", 0.95, [0, 1.35, 0.12], 0xffc5d4);
      root.add(halo);
      root.add(makeHitTarget("flower", new THREE.SphereGeometry(0.98, 18, 12), [0, 1.35, 0]));
      return { root, petals, center };
    }

    function createWindTarget() {
      const root = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 2.25, 10), toonMaterial(colors.wood));
      pole.position.y = 1.05;
      pole.castShadow = true;
      root.add(pole);
      const blades = new THREE.Group();
      blades.position.set(0, 2.15, 0.12);
      [colors.coral, colors.yellow, colors.blue, colors.lavender].forEach((color, index) => {
        const blade = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.78, 4, 12), toonMaterial(color));
        blade.position.y = 0.55;
        const holder = new THREE.Group();
        holder.rotation.z = index * Math.PI / 2;
        holder.add(blade);
        blades.add(holder);
      });
      root.add(blades);
      const hub = sphere(0.26, toonMaterial(colors.white, { emissive: 0xffffff, emissiveIntensity: 0.08 }), 18, 12);
      hub.position.set(0, 2.15, 0.34);
      root.add(hub);
      const halo = makeHalo("wind", 1.12, [0, 2.15, 0.12], 0xd9d0ff);
      root.add(halo);
      root.add(makeHitTarget("wind", new THREE.SphereGeometry(1.2, 18, 12), [0, 2.15, 0]));
      return { root, blades };
    }

    function createBud(x, y, z, color) {
      const root = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.65, 8), toonMaterial(colors.grassDark));
      stem.position.y = 0.32;
      root.add(stem);
      const petals = new THREE.Group();
      for (let index = 0; index < 6; index += 1) {
        const angle = index / 6 * Math.PI * 2;
        const petal = sphere(0.16, toonMaterial(color), 14, 9);
        petal.scale.set(0.68, 1.22, 0.4);
        petal.position.set(Math.cos(angle) * 0.22, Math.sin(angle) * 0.22, 0);
        petal.rotation.z = angle - Math.PI / 2;
        petals.add(petal);
      }
      petals.position.y = 0.72;
      petals.scale.setScalar(0.42);
      root.add(petals);
      const center = sphere(0.13, toonMaterial(colors.yellow), 14, 9);
      center.position.set(0, 0.72, 0.08);
      root.add(center);
      root.position.set(x, y, z);
      return { root, petals };
    }

    function createBee() {
      const root = new THREE.Group();
      const body = sphere(0.22, toonMaterial(colors.yellow), 18, 12);
      body.scale.set(1.35, 0.8, 0.82);
      root.add(body);
      [-0.14, 0.14].forEach((x) => {
        const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.035, 8, 18), toonMaterial(colors.dark));
        stripe.rotation.y = Math.PI / 2;
        stripe.position.x = x;
        root.add(stripe);
      });
      const head = sphere(0.15, toonMaterial(colors.dark), 16, 10);
      head.position.x = 0.3;
      root.add(head);
      const wings = new THREE.Group();
      [-1, 1].forEach((direction) => {
        const wing = sphere(0.17, toonMaterial(0xeaf8ff, { transparent: true, opacity: 0.86 }), 14, 9);
        wing.scale.set(1.1, 0.45, 0.55);
        wing.position.set(-0.02, direction * 0.2, 0.08);
        wings.add(wing);
      });
      root.add(wings);
      root.scale.setScalar(0.88);
      return { root, wings };
    }

    function createSeeds() {
      const root = new THREE.Group();
      const seedMaterial = toonMaterial(colors.white, { emissive: 0xffffff, emissiveIntensity: 0.08 });
      for (let index = 0; index < 9; index += 1) {
        const seed = new THREE.Group();
        const dot = sphere(0.055, seedMaterial, 10, 7);
        seed.add(dot);
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.012, 0.24, 6), toonMaterial(0xd8e7c5));
        tail.position.y = 0.13;
        tail.rotation.z = 0.45;
        seed.add(tail);
        seed.userData.offset = index / 9;
        root.add(seed);
      }
      return { root };
    }

    function createBunny() {
      const root = new THREE.Group();
      const fur = toonMaterial(colors.white);
      const furShade = toonMaterial(colors.cream);
      const pink = toonMaterial(colors.pink);
      const dark = toonMaterial(colors.dark);
      const outfit = toonMaterial(colors.teal);

      const body = sphere(0.92, fur);
      body.scale.set(0.9, 1.15, 0.82);
      body.position.y = 1.1;
      root.add(body);
      const belly = sphere(0.56, furShade);
      belly.scale.set(0.9, 1.08, 0.42);
      belly.position.set(0, 1.02, 0.72);
      root.add(belly);
      const overall = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 0.58, 5, 16), outfit);
      overall.scale.set(1, 0.9, 0.42);
      overall.position.set(0, 0.93, 0.83);
      overall.castShadow = true;
      root.add(overall);
      const badge = sphere(0.12, toonMaterial(colors.yellow), 14, 9);
      badge.scale.z = 0.35;
      badge.position.set(0, 1.16, 1.05);
      root.add(badge);

      const head = sphere(0.78, fur);
      head.scale.set(1, 0.93, 0.93);
      head.position.set(0, 2.25, 0.06);
      root.add(head);
      [-0.32, 0.32].forEach((x, index) => {
        const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.92, 5, 16), fur);
        ear.scale.set(0.9, 1, 0.68);
        ear.position.set(x, 3.28, 0.02);
        ear.rotation.z = index === 0 ? 0.16 : -0.16;
        ear.castShadow = true;
        root.add(ear);
        const inner = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.68, 5, 14), pink);
        inner.scale.z = 0.38;
        inner.position.set(x + (index === 0 ? -0.045 : 0.045), 3.29, 0.2);
        inner.rotation.z = ear.rotation.z;
        root.add(inner);
      });
      [-0.26, 0.26].forEach((x) => {
        const eye = sphere(0.09, dark, 18, 12);
        eye.scale.set(0.82, 1.12, 0.58);
        eye.position.set(x, 2.34, 0.72);
        root.add(eye);
        const eyeLight = sphere(0.025, toonMaterial(0xffffff), 12, 8);
        eyeLight.position.set(x - 0.02, 2.38, 0.772);
        root.add(eyeLight);
        const cheek = sphere(0.12, pink, 16, 10);
        cheek.scale.set(1.4, 0.65, 0.35);
        cheek.position.set(x * 1.48, 2.12, 0.71);
        root.add(cheek);
      });
      const nose = sphere(0.075, pink, 16, 10);
      nose.scale.set(1.1, 0.78, 0.72);
      nose.position.set(0, 2.18, 0.79);
      root.add(nose);
      const mouthLeft = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 8, 18, Math.PI), dark);
      mouthLeft.position.set(-0.08, 2.08, 0.79);
      mouthLeft.rotation.z = -0.08;
      root.add(mouthLeft);
      const mouthRight = mouthLeft.clone();
      mouthRight.position.x = 0.08;
      mouthRight.rotation.z = 0.08;
      root.add(mouthRight);
      [-0.7, 0.7].forEach((x, index) => {
        const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.56, 5, 14), fur);
        arm.position.set(x, 1.25, 0.25);
        arm.rotation.z = index === 0 ? -0.5 : 0.5;
        arm.castShadow = true;
        root.add(arm);
      });
      [-0.45, 0.45].forEach((x) => {
        const foot = sphere(0.34, fur, 20, 14);
        foot.scale.set(1.18, 0.58, 1.48);
        foot.position.set(x, 0.35, 0.44);
        root.add(foot);
      });
      const tail = sphere(0.35, furShade, 20, 14);
      tail.position.set(-0.72, 1, -0.48);
      root.add(tail);
      root.traverse((object) => {
        if (object.isMesh) object.castShadow = true;
      });
      return { root, head };
    }

    function addCloudDecoration(x, y, z, scale) {
      const cloud = new THREE.Group();
      const material = toonMaterial(colors.white, { emissive: 0xffffff, emissiveIntensity: 0.08 });
      [[-0.55, 0, 0.58], [0, 0.18, 0.82], [0.62, -0.03, 0.56]].forEach(([cx, cy, size]) => {
        const puff = sphere(size, material, 18, 12);
        puff.scale.z = 0.48;
        puff.position.set(cx, cy, 0);
        cloud.add(puff);
      });
      cloud.position.set(x, y, z);
      cloud.scale.setScalar(scale);
      scene.add(cloud);
    }

    function addTree(x, z, scale) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.34, 2, 12), toonMaterial(colors.wood));
      trunk.position.y = 1;
      trunk.castShadow = true;
      tree.add(trunk);
      [[0, 2.25, 0, 0.95], [-0.58, 2.05, 0.04, 0.72], [0.58, 2.05, -0.08, 0.72]].forEach(([lx, ly, lz, size]) => {
        const leaf = sphere(size, toonMaterial(colors.grassDark), 20, 14);
        leaf.position.set(lx, ly, lz);
        tree.add(leaf);
      });
      tree.position.set(x, 0, z);
      tree.scale.setScalar(scale);
      world.add(tree);
    }

    function addGroundFlowers() {
      const positions = [[-4.8, 1.7], [-4.2, 2.35], [-2.2, -2.15], [4.45, -1.65], [5, 1.8]];
      positions.forEach(([x, z], index) => {
        const flowerRoot = new THREE.Group();
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.38, 7), toonMaterial(colors.grassDark));
        stem.position.y = 0.19;
        flowerRoot.add(stem);
        const center = sphere(0.07, toonMaterial(colors.yellow), 10, 7);
        center.position.y = 0.43;
        flowerRoot.add(center);
        for (let petalIndex = 0; petalIndex < 5; petalIndex += 1) {
          const angle = petalIndex / 5 * Math.PI * 2;
          const petal = sphere(0.07, toonMaterial(index % 2 ? colors.pink : colors.white), 10, 7);
          petal.scale.set(0.7, 1.2, 0.4);
          petal.position.set(Math.cos(angle) * 0.11, 0.43 + Math.sin(angle) * 0.11, 0);
          petal.rotation.z = angle - Math.PI / 2;
          flowerRoot.add(petal);
        }
        flowerRoot.position.set(x, 0, z);
        world.add(flowerRoot);
      });
    }

    function handlePointerUp(event) {
      if (!active || locked || complete) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(interactiveMeshes.filter(isVisibleInScene), false)[0];
      if (hit?.object?.userData?.discoveryId) selectTarget(hit.object.userData.discoveryId);
    }

    function handleKeyDown(event) {
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      const next = DISCOVERIES.find((item) => !discovered.has(item.id)) || DISCOVERIES[0];
      selectTarget(next.id);
    }

    function selectTarget(id) {
      if (!active || locked || complete) return false;
      const item = DISCOVERIES.find((candidate) => candidate.id === id);
      if (!item) return false;

      locked = true;
      const firstInRound = !discovered.has(id);
      discovered.add(id);
      roundTouches[id] += 1;
      syncHalos();
      bunnyReact();
      const narration = options.speak?.([...item.speech], {
        kind: "result",
        stage: discovered.size - 1,
        taskId: item.id
      });
      options.onDiscovery?.({
        ...copyDiscovery(item),
        firstInRound,
        count: discovered.size,
        total: DISCOVERIES.length,
        remaining: DISCOVERIES.length - discovered.size,
        discovered: [...discovered],
        roundTouches: { ...roundTouches }
      });

      if (id === "sun") animateSun();
      if (id === "rain") animateRain();
      if (id === "flower") animateFlower();
      if (id === "wind") animateWind();
      scheduleSettle(reduceMotion ? Math.min(520, item.wait) : item.wait, narration, discovered.size === DISCOVERIES.length);
      return true;
    }

    function cancelTransition() {
      global.clearTimeout(transitionTimer);
      transitionTimer = 0;
      const settle = transitionSettle;
      transitionSettle = null;
      settle?.();
      transitionToken += 1;
      locked = false;
    }

    function scheduleSettle(wait, narration, shouldFinish) {
      cancelTransition();
      locked = true;
      const token = transitionToken;
      const minimum = new Promise((resolve) => {
        transitionSettle = resolve;
        transitionTimer = global.setTimeout(() => {
          transitionTimer = 0;
          transitionSettle = null;
          resolve();
        }, wait);
      });
      const narrationWait = narration && typeof narration.then === "function"
        ? Promise.race([
          Promise.resolve(narration).catch(() => null),
          new Promise((resolve) => global.setTimeout(resolve, 8000))
        ])
        : Promise.resolve();
      Promise.all([minimum, narrationWait]).then(() => {
        if (token !== transitionToken) return;
        locked = false;
        if (shouldFinish && discovered.size === DISCOVERIES.length) finish();
      });
    }

    function finish() {
      if (complete) return;
      complete = true;
      locked = false;
      const summary = {
        discoveries: [...discovered],
        labels: DISCOVERIES.filter((item) => discovered.has(item.id)).map((item) => item.label),
        roundTouches: { ...roundTouches }
      };
      options.onCompleteUi?.(summary);
      if (!completionReported) {
        completionReported = true;
        options.onComplete?.(summary);
      }
    }

    function syncHalos() {
      halos.forEach(({ material }, id) => {
        material.color.setHex(discovered.has(id) ? 0xffffff : haloColor(id));
        material.opacity = discovered.has(id) ? 0.28 : 0.62;
      });
    }

    function haloColor(id) {
      return { sun: 0xffef8e, rain: 0xccefff, flower: 0xffc5d4, wind: 0xd9d0ff }[id] || 0xffffff;
    }

    function animateSun() {
      const start = performance.now();
      const baseRotation = sun.rays.rotation.z;
      sunBuds.forEach((bud) => bud.petals.scale.setScalar(0.42));
      animations.push((now) => {
        const progress = Math.min(1, (now - start) / (reduceMotion ? 420 : 1080));
        const eased = progress * progress * (3 - 2 * progress);
        sun.rays.rotation.z = baseRotation + eased * Math.PI * (reduceMotion ? 0.25 : 0.85);
        sun.core.scale.set(1 + Math.sin(progress * Math.PI) * 0.08, 1 + Math.sin(progress * Math.PI) * 0.08, 0.72);
        sunBuds.forEach((bud, index) => {
          const local = Math.max(0, Math.min(1, progress * 1.35 - index * 0.12));
          bud.petals.scale.setScalar(0.42 + local * 0.58);
        });
        if (progress >= 1) {
          sun.core.scale.set(1, 1, 0.72);
          sunBuds.forEach((bud) => bud.petals.scale.setScalar(1));
          return false;
        }
        return true;
      });
    }

    function animateRain() {
      const start = performance.now();
      rain.drops.visible = true;
      pond.rings.forEach(({ mesh, material }) => {
        mesh.scale.set(0.45, 0.45, 0.3);
        material.opacity = 0;
      });
      animations.push((now) => {
        const duration = reduceMotion ? 500 : 1380;
        const progress = Math.min(1, (now - start) / duration);
        rain.drops.children.forEach((drop, index) => {
          const fall = (progress * 2.4 + index * 0.17) % 1;
          drop.position.y = drop.userData.baseY - fall * 3.8;
        });
        pond.rings.forEach(({ mesh, material }, index) => {
          const local = Math.max(0, Math.min(1, progress * 1.45 - index * 0.13));
          const scale = 0.45 + local * 0.55;
          mesh.scale.set(scale, scale, scale * 0.58);
          material.opacity = Math.sin(local * Math.PI) * 0.75;
        });
        if (progress >= 1) {
          rain.drops.visible = false;
          pond.rings.forEach(({ material }) => { material.opacity = 0; });
          return false;
        }
        return true;
      });
    }

    function animateFlower() {
      const start = performance.now();
      bee.root.visible = true;
      animations.push((now) => {
        const duration = reduceMotion ? 500 : 1350;
        const progress = Math.min(1, (now - start) / duration);
        const eased = progress * progress * (3 - 2 * progress);
        const orbit = Math.sin(eased * Math.PI * 1.35);
        bee.root.position.set(
          -1.1 + eased * 1.2 + orbit * 0.36,
          2.45 - eased * 0.76 + Math.sin(progress * Math.PI * 4) * 0.08,
          1.35 + Math.cos(progress * Math.PI * 2) * 0.25
        );
        bee.root.rotation.z = Math.sin(progress * Math.PI * 3) * 0.12;
        bee.wings.rotation.x = Math.sin(now * 0.05) * 0.48;
        flower.petals.rotation.z = Math.sin(progress * Math.PI * 2) * 0.08;
        if (progress >= 1) {
          bee.root.position.set(0.16, 1.72, 1.46);
          bee.root.rotation.z = 0;
          flower.petals.rotation.z = 0;
          return false;
        }
        return true;
      });
    }

    function animateWind() {
      const start = performance.now();
      const baseRotation = wind.blades.rotation.z;
      seeds.root.visible = true;
      animations.push((now) => {
        const duration = reduceMotion ? 480 : 1320;
        const progress = Math.min(1, (now - start) / duration);
        const eased = progress * progress * (3 - 2 * progress);
        wind.blades.rotation.z = baseRotation - eased * Math.PI * (reduceMotion ? 1.1 : 5.2);
        seeds.root.children.forEach((seed, index) => {
          const offset = seed.userData.offset;
          seed.position.set(
            2.4 - eased * (3.4 + offset * 1.2),
            2.45 + Math.sin((progress + offset) * Math.PI * 2.4) * 0.42 + offset * 0.55,
            0.8 + Math.cos((progress + offset) * Math.PI * 2) * 0.45
          );
          seed.rotation.z = progress * Math.PI * (2 + offset * 2);
        });
        if (progress >= 1) {
          seeds.root.visible = false;
          return false;
        }
        return true;
      });
    }

    function bunnyReact() {
      const start = performance.now();
      const baseY = 0.04;
      bunnyReacting = true;
      animations.push((now) => {
        const progress = Math.min(1, (now - start) / (reduceMotion ? 260 : 720));
        bunny.root.position.y = baseY + Math.sin(progress * Math.PI) * (reduceMotion ? 0.07 : 0.3);
        bunny.root.rotation.z = Math.sin(progress * Math.PI * 2) * (reduceMotion ? 0 : 0.035);
        if (progress >= 1) {
          bunny.root.position.y = baseY;
          bunny.root.rotation.z = 0;
          bunnyReacting = false;
          return false;
        }
        return true;
      });
    }

    function resize() {
      const rect = host.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      const phonePortrait = camera.aspect < 0.72;
      const tabletPortrait = camera.aspect >= 0.72 && camera.aspect < 1.05;
      camera.fov = phonePortrait ? 42 : tabletPortrait ? 39 : 36;
      camera.position.set(
        0,
        phonePortrait ? 5.4 : tabletPortrait ? 5.1 : 4.85,
        phonePortrait ? 16.1 : tabletPortrait ? 14.8 : 12.5
      );
      camera.lookAt(0, 1.75, 0);
      camera.updateProjectionMatrix();
      world.scale.setScalar(phonePortrait ? 0.78 : tabletPortrait ? 0.9 : 1);
      world.position.y = phonePortrait ? 0.28 : tabletPortrait ? 0.12 : 0;
      bunny.root.position.x = phonePortrait ? -2.82 : tabletPortrait ? -3.18 : -3.55;
      renderer.render(scene, camera);
    }

    function tick(now) {
      if (!active) return;
      const delta = Math.min(0.04, (now - lastTime) / 1000 || 0.016);
      lastTime = now;
      for (let index = animations.length - 1; index >= 0; index -= 1) {
        if (!animations[index](now)) animations.splice(index, 1);
      }
      if (!reduceMotion) {
        if (!bunnyReacting) bunny.root.position.y = 0.04 + Math.sin(now * 0.0021) * 0.024;
        bunny.head.rotation.z = Math.sin(now * 0.0011) * 0.025;
        rain.root.position.y = rain.root.userData.baseY + Math.sin(now * 0.0012) * 0.08;
        flower.root.rotation.z = Math.sin(now * 0.001) * 0.015;
        halos.forEach(({ mesh, material }, id) => {
          const offset = DISCOVERIES.findIndex((item) => item.id === id) * 0.65;
          const pulse = 1 + Math.sin(now * 0.0022 + offset) * 0.055;
          mesh.scale.setScalar(pulse);
          material.opacity = (discovered.has(id) ? 0.25 : 0.52) + Math.sin(now * 0.0022 + offset) * 0.09;
        });
        sun.rays.rotation.z += delta * 0.06;
      }
      renderer.render(scene, camera);
      frameId = global.requestAnimationFrame(tick);
    }

    function readyPayload(announce) {
      const count = discovered.size;
      return {
        prompt: count === 0 ? OPENING.prompt : `花園裡還有 ${DISCOVERIES.length - count} 個小變化`,
        hint: count === 0 ? OPENING.hint : "想看哪一個，就直接碰哪一個",
        speech: [...OPENING.speech],
        count,
        total: DISCOVERIES.length,
        discovered: [...discovered],
        announce
      };
    }

    function start(startOptions = {}) {
      active = true;
      lastTime = performance.now();
      resize();
      global.cancelAnimationFrame(frameId);
      frameId = global.requestAnimationFrame(tick);
      if (discovered.size === DISCOVERIES.length) {
        finish();
      } else {
        options.onReady?.(readyPayload(startOptions.announce !== false));
      }
    }

    function pause() {
      active = false;
      global.cancelAnimationFrame(frameId);
      cancelTransition();
      renderer.render(scene, camera);
    }

    function reset() {
      cancelTransition();
      animations.length = 0;
      discovered.clear();
      DISCOVERIES.forEach((item) => { roundTouches[item.id] = 0; });
      complete = false;
      completionReported = false;
      bee.root.visible = false;
      seeds.root.visible = false;
      rain.drops.visible = false;
      pond.rings.forEach(({ material }) => { material.opacity = 0; });
      sunBuds.forEach((bud) => bud.petals.scale.setScalar(0.42));
      sun.core.scale.set(1, 1, 0.72);
      flower.petals.rotation.z = 0;
      wind.blades.rotation.z = 0;
      bunny.root.position.y = 0.04;
      bunny.root.rotation.z = 0;
      syncHalos();
      if (!active) start({ announce: true });
      else options.onReady?.(readyPayload(true));
    }

    function destroy() {
      pause();
      resizeObserver?.disconnect();
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("keydown", handleKeyDown);
      renderer.dispose();
      host.replaceChildren();
    }

    function isVisibleInScene(object) {
      let current = object;
      while (current) {
        if (current.visible === false) return false;
        current = current.parent;
      }
      return true;
    }

    function getScreenPoint(id) {
      const anchor = targetAnchors.get(id);
      if (!anchor || !isVisibleInScene(anchor)) return null;
      scene.updateMatrixWorld(true);
      const point = new THREE.Vector3();
      anchor.getWorldPosition(point);
      point.project(camera);
      const rect = renderer.domElement.getBoundingClientRect();
      return {
        x: rect.left + (point.x + 1) * rect.width / 2,
        y: rect.top + (1 - point.y) * rect.height / 2,
        inFrame: Math.abs(point.x) <= 0.94 && Math.abs(point.y) <= 0.94
      };
    }

    function projectedBounds(object) {
      scene.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(object);
      const corners = [];
      for (const x of [box.min.x, box.max.x]) {
        for (const y of [box.min.y, box.max.y]) {
          for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z).project(camera));
        }
      }
      const left = Math.min(...corners.map((point) => point.x));
      const right = Math.max(...corners.map((point) => point.x));
      const top = Math.max(...corners.map((point) => point.y));
      const bottom = Math.min(...corners.map((point) => point.y));
      return {
        left: Number(left.toFixed(3)),
        right: Number(right.toFixed(3)),
        top: Number(top.toFixed(3)),
        bottom: Number(bottom.toFixed(3)),
        inFrame: left >= -0.96 && right <= 0.96 && bottom >= -0.96 && top <= 0.96
      };
    }

    function getSnapshot() {
      return {
        supported: true,
        active,
        locked,
        complete,
        count: discovered.size,
        total: DISCOVERIES.length,
        discovered: [...discovered],
        roundTouches: { ...roundTouches },
        targets: Object.fromEntries(DISCOVERIES.map((item) => [item.id, getScreenPoint(item.id)])),
        bunnyFrame: projectedBounds(bunny.root),
        motion: {
          sunRotation: Number(sun.rays.rotation.z.toFixed(4)),
          firstBudScale: Number(sunBuds[0].petals.scale.x.toFixed(4)),
          rainVisible: rain.drops.visible,
          beeVisible: bee.root.visible,
          beeX: Number(bee.root.position.x.toFixed(4)),
          windRotation: Number(wind.blades.rotation.z.toFixed(4)),
          seedsVisible: seeds.root.visible
        },
        canvas: {
          width: renderer.domElement.width,
          height: renderer.domElement.height,
          cssWidth: Math.round(renderer.domElement.getBoundingClientRect().width),
          cssHeight: Math.round(renderer.domElement.getBoundingClientRect().height)
        },
        rendererInfo: {
          geometries: renderer.info.memory.geometries,
          textures: renderer.info.memory.textures,
          calls: renderer.info.render.calls
        }
      };
    }

    async function samplePixels() {
      renderer.render(scene, camera);
      const source = renderer.domElement;
      const sample = document.createElement("canvas");
      sample.width = 64;
      sample.height = 64;
      const context = sample.getContext("2d", { willReadFrequently: true });
      context.drawImage(source, 0, 0, sample.width, sample.height);
      const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
      const unique = new Set();
      let opaque = 0;
      for (let index = 0; index < pixels.length; index += 16) {
        unique.add(`${pixels[index] >> 4}-${pixels[index + 1] >> 4}-${pixels[index + 2] >> 4}`);
        if (pixels[index + 3] > 240) opaque += 1;
      }
      return { colors: unique.size, opaqueRatio: opaque / (pixels.length / 16) };
    }

    return {
      supported: true,
      start,
      pause,
      reset,
      destroy,
      getSnapshot,
      getScreenPoint,
      selectTarget,
      samplePixels
    };
  }

  function copyDiscovery(item) {
    return { ...item, speech: [...item.speech] };
  }

  global.BunnyNatureGarden3D = {
    create: createNatureGarden,
    discoveries: DISCOVERIES.map(copyDiscovery),
    discoveryIds: DISCOVERIES.map((item) => item.id),
    revision: THREE?.REVISION || null
  };
})(window);
