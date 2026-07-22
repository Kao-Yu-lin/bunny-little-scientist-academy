(function (global) {
  "use strict";

  const THREE = global.THREE;
  const ACTIVITIES = Object.freeze([
    Object.freeze({
      id: "drum",
      label: "拍拍鼓",
      result: "鼓聲咚咚響，兔兔跟著拍拍手",
      speech: Object.freeze(["鼓聲咚、咚、咚。", "你也可以跟著拍拍手。"]),
      wait: 1480
    }),
    Object.freeze({
      id: "march",
      label: "左右踏步",
      result: "左右腳印輪流亮，兔兔慢慢踏步",
      speech: Object.freeze(["左、右，腳印一個接一個亮起來。", "你可以扶著大人，慢慢踏步。"]),
      wait: 1620
    }),
    Object.freeze({
      id: "stretch",
      label: "向上伸展",
      result: "兔兔把兩隻手伸得高高的",
      speech: Object.freeze(["兔兔把兩隻手伸得高高的。", "你也可以把手伸向天空。"]),
      wait: 1420
    }),
    Object.freeze({
      id: "balance",
      label: "慢慢平衡",
      result: "兔兔張開雙手，慢慢站穩",
      speech: Object.freeze(["兔兔張開手，慢慢站穩。", "想試試看時，請讓大人在旁邊陪你。"]),
      wait: 1680
    })
  ]);

  const OPENING = Object.freeze({
    prompt: "兔兔先做哪一個動作？",
    hint: "鼓、腳印、星星和平衡木，想跟哪一個就直接碰哪一個",
    speech: Object.freeze(["動動島有四個小地方。", "拍拍鼓、踏踏步、伸伸手，或慢慢平衡，你想先跟哪一個？"])
  });

  function unsupportedController(options) {
    const showFallback = () => {
      if (options.fallback) options.fallback.hidden = false;
      if (options.host) options.host.hidden = true;
      options.onStatus?.("這台裝置暫時不能顯示 3D。可以請大人陪你拍拍手、伸伸手，再慢慢走幾步。", "fallback");
    };
    showFallback();
    return {
      supported: false,
      start: showFallback,
      pause() {},
      reset: showFallback,
      destroy() {},
      getSnapshot() {
        return { supported: false, complete: false, discovered: [], count: 0, total: ACTIVITIES.length };
      },
      getScreenPoint() { return null; },
      selectTarget() { return false; },
      samplePixels() { return Promise.resolve({ colors: 0, opaqueRatio: 0 }); }
    };
  }

  function createMovementIsland(options) {
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
    const roundTouches = Object.fromEntries(ACTIVITIES.map((item) => [item.id, 0]));
    const colors = {
      sky: 0xbcebf3,
      sea: 0x53b7cf,
      grass: 0x82cb86,
      grassDark: 0x3f9568,
      white: 0xfffcf8,
      cream: 0xffefd6,
      pink: 0xf58faa,
      coral: 0xf47e70,
      yellow: 0xf8cd52,
      blue: 0x62a9df,
      teal: 0x58b5a8,
      dark: 0x40364b,
      wood: 0xb77f53,
      lavender: 0xa38bd5
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
    renderer.domElement.setAttribute("aria-label", "可自由觸控並跟兔兔模仿的 3D 動動島");
    renderer.domElement.setAttribute("role", "application");
    renderer.domElement.tabIndex = 0;
    host.replaceChildren(renderer.domElement);
    host.hidden = false;
    if (fallback) fallback.hidden = true;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x3f8068, 2.6);
    scene.add(hemi);
    const keyLight = new THREE.DirectionalLight(0xfff2d4, 4.2);
    keyLight.position.set(-4, 9, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -7;
    keyLight.shadow.camera.right = 7;
    keyLight.shadow.camera.top = 7;
    keyLight.shadow.camera.bottom = -3;
    scene.add(keyLight);
    const fill = new THREE.DirectionalLight(0xdaf1ff, 1.3);
    fill.position.set(7, 4, 5);
    scene.add(fill);

    const world = new THREE.Group();
    scene.add(world);

    const sea = new THREE.Mesh(
      new THREE.CylinderGeometry(9.4, 9.9, 0.38, 64),
      toonMaterial(colors.sea, { roughness: 0.42, emissive: 0x2589a8, emissiveIntensity: 0.07 })
    );
    sea.position.y = -0.52;
    sea.receiveShadow = true;
    world.add(sea);

    const island = new THREE.Mesh(
      new THREE.CylinderGeometry(7.1, 7.65, 0.5, 56),
      toonMaterial(colors.grass)
    );
    island.position.y = -0.24;
    island.receiveShadow = true;
    world.add(island);

    const sandRing = new THREE.Mesh(
      new THREE.RingGeometry(5.85, 7.05, 56),
      toonMaterial(0xf5dfaa)
    );
    sandRing.rotation.x = -Math.PI / 2;
    sandRing.position.y = 0.025;
    world.add(sandRing);

    addCloud(-4.9, 5.65, -5.2, 0.64);
    addCloud(4.7, 5.35, -5.4, 0.52);
    addPalm(-5.25, -2.1, 0.78);
    addPalm(5.15, -2.45, 0.7);
    addFlags();

    const bunny = createBunny();
    bunny.root.position.set(-3.35, 0.05, 0.25);
    world.add(bunny.root);

    const drum = createDrumTarget();
    drum.root.position.set(3.45, 0.02, 1.15);
    world.add(drum.root);

    const march = createMarchTarget();
    march.root.position.set(0.55, 0.05, 2.0);
    world.add(march.root);

    const stretch = createStretchTarget();
    stretch.root.position.set(3.15, 3.75, -1.55);
    world.add(stretch.root);

    const balance = createBalanceTarget();
    balance.root.position.set(0.55, 0.03, -1.45);
    world.add(balance.root);

    let active = false;
    let locked = false;
    let complete = false;
    let completionReported = false;
    let frameId = 0;
    let resizeObserver;
    let transitionTimer = 0;
    let transitionSettle = null;
    let transitionToken = 0;
    let bunnyAnimating = false;
    let activeFootprint = -1;
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
      hit.userData.activityId = id;
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

    function createBunny() {
      const root = new THREE.Group();
      const fur = toonMaterial(colors.white);
      const furShade = toonMaterial(colors.cream);
      const pink = toonMaterial(colors.pink);
      const dark = toonMaterial(colors.dark);
      const outfit = toonMaterial(colors.coral);
      const trim = toonMaterial(colors.yellow);

      const body = sphere(0.9, fur);
      body.scale.set(0.9, 1.14, 0.82);
      body.position.y = 1.12;
      root.add(body);
      const belly = sphere(0.55, furShade);
      belly.scale.set(0.9, 1.05, 0.42);
      belly.position.set(0, 1.02, 0.7);
      root.add(belly);
      const shirt = new THREE.Mesh(new THREE.CapsuleGeometry(0.49, 0.54, 5, 16), outfit);
      shirt.scale.set(1, 0.9, 0.43);
      shirt.position.set(0, 1.02, 0.82);
      shirt.castShadow = true;
      root.add(shirt);
      const shirtMark = sphere(0.13, trim, 14, 9);
      shirtMark.scale.z = 0.35;
      shirtMark.position.set(0, 1.2, 1.04);
      root.add(shirtMark);

      const head = sphere(0.77, fur);
      head.scale.set(1, 0.93, 0.93);
      head.position.set(0, 2.27, 0.04);
      root.add(head);
      [-0.32, 0.32].forEach((x, index) => {
        const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.9, 5, 16), fur);
        ear.scale.set(0.9, 1, 0.68);
        ear.position.set(x, 3.28, 0.01);
        ear.rotation.z = index === 0 ? 0.14 : -0.14;
        ear.castShadow = true;
        root.add(ear);
        const inner = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.66, 5, 14), pink);
        inner.scale.z = 0.38;
        inner.position.set(x + (index === 0 ? -0.04 : 0.04), 3.29, 0.19);
        inner.rotation.z = ear.rotation.z;
        root.add(inner);
      });
      [-0.26, 0.26].forEach((x) => {
        const eye = sphere(0.09, dark, 18, 12);
        eye.scale.set(0.82, 1.12, 0.58);
        eye.position.set(x, 2.35, 0.71);
        root.add(eye);
        const eyeLight = sphere(0.025, toonMaterial(0xffffff), 12, 8);
        eyeLight.position.set(x - 0.02, 2.39, 0.763);
        root.add(eyeLight);
        const cheek = sphere(0.12, pink, 16, 10);
        cheek.scale.set(1.4, 0.65, 0.35);
        cheek.position.set(x * 1.48, 2.13, 0.7);
        root.add(cheek);
      });
      const nose = sphere(0.075, pink, 16, 10);
      nose.scale.set(1.1, 0.78, 0.72);
      nose.position.set(0, 2.19, 0.78);
      root.add(nose);
      const mouthLeft = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 8, 18, Math.PI), dark);
      mouthLeft.position.set(-0.08, 2.09, 0.78);
      mouthLeft.rotation.z = -0.08;
      root.add(mouthLeft);
      const mouthRight = mouthLeft.clone();
      mouthRight.position.x = 0.08;
      mouthRight.rotation.z = 0.08;
      root.add(mouthRight);

      function makeArm(side) {
        const pivot = new THREE.Group();
        pivot.position.set(side * 0.66, 1.62, 0.27);
        pivot.rotation.z = side * 0.45;
        const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.52, 5, 14), fur);
        arm.position.y = -0.34;
        arm.castShadow = true;
        pivot.add(arm);
        const hand = sphere(0.19, fur, 16, 10);
        hand.position.y = -0.72;
        pivot.add(hand);
        root.add(pivot);
        return { pivot, hand };
      }

      function makeLeg(side) {
        const pivot = new THREE.Group();
        pivot.position.set(side * 0.35, 0.65, 0.1);
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.34, 5, 14), fur);
        leg.position.y = -0.25;
        leg.castShadow = true;
        pivot.add(leg);
        const foot = sphere(0.33, fur, 20, 14);
        foot.scale.set(1.15, 0.56, 1.42);
        foot.position.set(side * 0.04, -0.54, 0.34);
        pivot.add(foot);
        root.add(pivot);
        return { pivot, foot };
      }

      const leftArm = makeArm(-1);
      const rightArm = makeArm(1);
      const leftLeg = makeLeg(-1);
      const rightLeg = makeLeg(1);
      const tail = sphere(0.34, furShade, 20, 14);
      tail.position.set(-0.72, 1.05, -0.45);
      root.add(tail);
      root.traverse((object) => {
        if (object.isMesh) object.castShadow = true;
      });
      return { root, head, leftArm, rightArm, leftLeg, rightLeg };
    }

    function createDrumTarget() {
      const root = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.72, 0.82, 0.72, 28),
        toonMaterial(colors.coral)
      );
      body.rotation.x = Math.PI / 2;
      body.position.y = 0.86;
      body.castShadow = true;
      root.add(body);
      const skinMaterial = toonMaterial(0xffefd0, { emissive: colors.yellow, emissiveIntensity: 0.08 });
      const skin = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.08, 28), skinMaterial);
      skin.rotation.x = Math.PI / 2;
      skin.position.set(0, 0.86, 0.4);
      root.add(skin);
      for (let index = 0; index < 8; index += 1) {
        const angle = index / 8 * Math.PI * 2;
        const peg = sphere(0.055, toonMaterial(colors.yellow), 10, 7);
        peg.position.set(Math.cos(angle) * 0.58, 0.86 + Math.sin(angle) * 0.58, 0.47);
        root.add(peg);
      }
      const notes = new THREE.Group();
      for (let index = 0; index < 5; index += 1) {
        const note = new THREE.Group();
        const dot = sphere(0.11, toonMaterial(index % 2 ? colors.lavender : colors.yellow, { emissive: colors.yellow, emissiveIntensity: 0.12 }), 12, 8);
        note.add(dot);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.48, 6), toonMaterial(colors.dark));
        stem.position.set(0.1, 0.23, 0);
        note.add(stem);
        note.userData.offset = index / 5;
        notes.add(note);
      }
      notes.visible = false;
      root.add(notes);
      root.add(makeHalo("drum", 1.05, [0, 0.9, 0.18], 0xffc4b9));
      root.add(makeHitTarget("drum", new THREE.SphereGeometry(1.12, 18, 12), [0, 0.88, 0]));
      return { root, skin, skinMaterial, notes };
    }

    function createMarchTarget() {
      const root = new THREE.Group();
      const footprints = [];
      const placements = [
        [-0.58, 0.05, 0.5, -0.16, colors.blue],
        [0.08, 0.06, 0.18, 0.14, colors.coral],
        [-0.34, 0.07, -0.3, -0.14, colors.blue],
        [0.35, 0.08, -0.62, 0.15, colors.coral]
      ];
      placements.forEach(([x, y, z, rotation, color], index) => {
        const material = toonMaterial(color, { emissive: color, emissiveIntensity: 0.08 });
        const foot = new THREE.Group();
        const sole = sphere(0.3, material, 18, 12);
        sole.scale.set(0.62, 0.22, 1.2);
        foot.add(sole);
        const toe = sphere(0.22, material, 16, 10);
        toe.scale.set(0.72, 0.22, 0.82);
        toe.position.z = -0.32;
        foot.add(toe);
        foot.position.set(x, y, z);
        foot.rotation.y = rotation;
        root.add(foot);
        footprints.push({ root: foot, material, index });
      });
      root.add(makeHalo("march", 1.05, [0, 0.55, 0], 0xbfe7ff));
      root.add(makeHitTarget("march", new THREE.BoxGeometry(2.2, 1.25, 2.2), [0, 0.42, 0]));
      return { root, footprints };
    }

    function createStretchTarget() {
      const root = new THREE.Group();
      const shape = new THREE.Shape();
      for (let index = 0; index < 10; index += 1) {
        const radius = index % 2 === 0 ? 0.82 : 0.37;
        const angle = -Math.PI / 2 + index * Math.PI / 5;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (index === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.closePath();
      const starMaterial = toonMaterial(colors.yellow, { emissive: 0xffc13d, emissiveIntensity: 0.28 });
      const star = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, {
        depth: 0.22,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.055,
        bevelThickness: 0.055
      }), starMaterial);
      star.position.z = -0.11;
      star.castShadow = true;
      root.add(star);
      const ribbons = new THREE.Group();
      [-0.28, 0.28].forEach((x, index) => {
        const ribbon = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.62, 4, 8), toonMaterial(index ? colors.lavender : colors.coral));
        ribbon.position.set(x, -1.08, 0);
        ribbon.rotation.z = index ? -0.18 : 0.18;
        ribbons.add(ribbon);
      });
      root.add(ribbons);
      root.add(makeHalo("stretch", 1.12, [0, 0, 0.18], 0xffef9e));
      root.add(makeHitTarget("stretch", new THREE.SphereGeometry(1.2, 18, 12), [0, 0, 0]));
      return { root, star, starMaterial, ribbons };
    }

    function createBalanceTarget() {
      const root = new THREE.Group();
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 2.75, 18), toonMaterial(colors.wood));
      log.rotation.z = Math.PI / 2;
      log.position.y = 0.45;
      log.castShadow = true;
      root.add(log);
      [-1.08, 1.08].forEach((x) => {
        const support = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.55, 12), toonMaterial(0x8d684a));
        support.position.set(x, 0.24, 0);
        root.add(support);
      });
      const bird = new THREE.Group();
      const birdBody = sphere(0.18, toonMaterial(colors.blue), 14, 9);
      birdBody.scale.set(1.2, 0.8, 0.75);
      bird.add(birdBody);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 10), toonMaterial(colors.yellow));
      beak.rotation.z = -Math.PI / 2;
      beak.position.x = 0.24;
      bird.add(beak);
      bird.position.set(-0.75, 0.88, 0.05);
      root.add(bird);
      root.add(makeHalo("balance", 1.4, [0, 0.72, 0.12], 0xd9d0ff));
      root.add(makeHitTarget("balance", new THREE.BoxGeometry(3.2, 1.5, 1.25), [0, 0.55, 0]));
      return { root, log, bird };
    }

    function addCloud(x, y, z, scale) {
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

    function addPalm(x, z, scale) {
      const palm = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.34, 2.55, 12), toonMaterial(colors.wood));
      trunk.position.y = 1.22;
      trunk.rotation.z = x < 0 ? -0.08 : 0.08;
      trunk.castShadow = true;
      palm.add(trunk);
      for (let index = 0; index < 6; index += 1) {
        const holder = new THREE.Group();
        holder.position.y = 2.5;
        holder.rotation.y = index / 6 * Math.PI * 2;
        const leaf = sphere(0.58, toonMaterial(colors.grassDark), 18, 11);
        leaf.scale.set(0.45, 0.18, 1.55);
        leaf.position.z = 0.72;
        leaf.rotation.x = -0.24;
        holder.add(leaf);
        palm.add(holder);
      }
      palm.position.set(x, 0, z);
      palm.scale.setScalar(scale);
      world.add(palm);
    }

    function addFlags() {
      const ropeMaterial = toonMaterial(0xf2e5c5);
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 5.5, 6), ropeMaterial);
      rope.position.set(0, 4.65, -3.8);
      rope.rotation.z = Math.PI / 2;
      world.add(rope);
      [colors.coral, colors.yellow, colors.blue, colors.lavender, colors.teal].forEach((color, index) => {
        const flag = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.55, 3), toonMaterial(color));
        flag.position.set(-2.1 + index * 1.05, 4.35, -3.75);
        flag.rotation.z = Math.PI;
        world.add(flag);
      });
    }

    function handlePointerUp(event) {
      if (!active || locked || complete) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(interactiveMeshes.filter(isVisibleInScene), false)[0];
      if (hit?.object?.userData?.activityId) selectTarget(hit.object.userData.activityId);
    }

    function handleKeyDown(event) {
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      const next = ACTIVITIES.find((item) => !discovered.has(item.id)) || ACTIVITIES[0];
      selectTarget(next.id);
    }

    function selectTarget(id) {
      if (!active || locked || complete) return false;
      const item = ACTIVITIES.find((candidate) => candidate.id === id);
      if (!item) return false;

      resetActiveVisuals();
      locked = true;
      const firstInRound = !discovered.has(id);
      discovered.add(id);
      roundTouches[id] += 1;
      syncHalos();
      const narration = options.speak?.([...item.speech], {
        kind: "result",
        stage: discovered.size - 1,
        taskId: item.id
      });
      options.onActivity?.({
        ...copyActivity(item),
        firstInRound,
        count: discovered.size,
        total: ACTIVITIES.length,
        remaining: ACTIVITIES.length - discovered.size,
        discovered: [...discovered],
        roundTouches: { ...roundTouches }
      });

      if (id === "drum") animateDrum();
      if (id === "march") animateMarch();
      if (id === "stretch") animateStretch();
      if (id === "balance") animateBalance();
      scheduleSettle(reduceMotion ? Math.min(560, item.wait) : item.wait, narration, discovered.size === ACTIVITIES.length);
      return true;
    }

    function resetBunnyPose() {
      bunny.root.position.y = 0.05;
      bunny.root.rotation.z = 0;
      bunny.root.scale.setScalar(1);
      bunny.leftArm.pivot.rotation.z = -0.45;
      bunny.rightArm.pivot.rotation.z = 0.45;
      bunny.leftLeg.pivot.rotation.z = 0;
      bunny.rightLeg.pivot.rotation.z = 0;
      bunny.leftLeg.pivot.position.y = 0.65;
      bunny.rightLeg.pivot.position.y = 0.65;
    }

    function resetActiveVisuals() {
      animations.length = 0;
      bunnyAnimating = false;
      activeFootprint = -1;
      resetBunnyPose();
      drum.notes.visible = false;
      drum.skin.scale.set(1, 1, 1);
      drum.skinMaterial.emissiveIntensity = 0.08;
      march.footprints.forEach(({ root, material }) => {
        root.scale.setScalar(1);
        material.emissiveIntensity = 0.08;
      });
      stretch.star.scale.setScalar(1);
      stretch.star.rotation.z = 0;
      stretch.starMaterial.emissiveIntensity = 0.28;
      balance.log.rotation.x = 0;
      balance.log.rotation.z = Math.PI / 2;
      balance.bird.rotation.z = 0;
    }

    function animateDrum() {
      const start = performance.now();
      drum.notes.visible = true;
      bunnyAnimating = true;
      animations.push((now) => {
        const duration = reduceMotion ? 520 : 1400;
        const progress = Math.min(1, (now - start) / duration);
        const beats = Math.sin(progress * Math.PI * 6);
        const pulse = Math.max(0, beats);
        drum.skin.scale.set(1 + pulse * 0.11, 1, 1 + pulse * 0.11);
        drum.skinMaterial.emissiveIntensity = 0.08 + pulse * 0.55;
        bunny.leftArm.pivot.rotation.z = -0.72 + pulse * 1.1;
        bunny.rightArm.pivot.rotation.z = 0.72 - pulse * 1.1;
        bunny.root.position.y = 0.05 + Math.abs(Math.sin(progress * Math.PI * 3)) * (reduceMotion ? 0.04 : 0.12);
        drum.notes.children.forEach((note, index) => {
          const offset = note.userData.offset;
          note.position.set(
            -0.65 + index * 0.32,
            1.45 + progress * (1.15 + offset * 0.5),
            0.35
          );
          note.rotation.z = progress * Math.PI * (1.2 + offset);
          note.scale.setScalar(0.72 + Math.sin(Math.min(1, progress * 1.3) * Math.PI) * 0.45);
        });
        if (progress >= 1) {
          resetBunnyPose();
          drum.notes.visible = false;
          drum.skin.scale.set(1, 1, 1);
          drum.skinMaterial.emissiveIntensity = 0.08;
          bunnyAnimating = false;
          return false;
        }
        return true;
      });
    }

    function animateMarch() {
      const start = performance.now();
      bunnyAnimating = true;
      animations.push((now) => {
        const duration = reduceMotion ? 560 : 1540;
        const progress = Math.min(1, (now - start) / duration);
        const step = Math.min(3, Math.floor(progress * 4));
        activeFootprint = step;
        march.footprints.forEach(({ root, material }, index) => {
          const isActive = index === step;
          const scale = isActive ? 1.28 : 1;
          root.scale.setScalar(scale);
          material.emissiveIntensity = isActive ? 0.72 : 0.08;
        });
        const swing = Math.sin(progress * Math.PI * 8);
        bunny.leftLeg.pivot.rotation.z = swing * (reduceMotion ? 0.12 : 0.28);
        bunny.rightLeg.pivot.rotation.z = -swing * (reduceMotion ? 0.12 : 0.28);
        bunny.leftLeg.pivot.position.y = 0.65 + Math.max(0, swing) * (reduceMotion ? 0.05 : 0.18);
        bunny.rightLeg.pivot.position.y = 0.65 + Math.max(0, -swing) * (reduceMotion ? 0.05 : 0.18);
        bunny.leftArm.pivot.rotation.z = -0.45 - swing * 0.18;
        bunny.rightArm.pivot.rotation.z = 0.45 - swing * 0.18;
        bunny.root.position.y = 0.05 + Math.abs(swing) * (reduceMotion ? 0.025 : 0.07);
        if (progress >= 1) {
          march.footprints.forEach(({ root, material }) => {
            root.scale.setScalar(1);
            material.emissiveIntensity = 0.08;
          });
          activeFootprint = -1;
          resetBunnyPose();
          bunnyAnimating = false;
          return false;
        }
        return true;
      });
    }

    function animateStretch() {
      const start = performance.now();
      bunnyAnimating = true;
      animations.push((now) => {
        const duration = reduceMotion ? 520 : 1340;
        const progress = Math.min(1, (now - start) / duration);
        const reach = Math.sin(progress * Math.PI);
        bunny.leftArm.pivot.rotation.z = -0.45 + reach * (-2.1);
        bunny.rightArm.pivot.rotation.z = 0.45 + reach * 2.1;
        bunny.root.scale.set(1, 1 + reach * (reduceMotion ? 0.025 : 0.08), 1);
        bunny.root.position.y = 0.05 + reach * (reduceMotion ? 0.04 : 0.13);
        stretch.star.rotation.z = progress * Math.PI * (reduceMotion ? 0.35 : 1.4);
        stretch.star.scale.setScalar(1 + reach * 0.16);
        stretch.starMaterial.emissiveIntensity = 0.28 + reach * 0.62;
        stretch.ribbons.rotation.z = Math.sin(progress * Math.PI * 3) * (reduceMotion ? 0.04 : 0.15);
        if (progress >= 1) {
          resetBunnyPose();
          stretch.star.scale.setScalar(1);
          stretch.star.rotation.z = 0;
          stretch.starMaterial.emissiveIntensity = 0.28;
          stretch.ribbons.rotation.z = 0;
          bunnyAnimating = false;
          return false;
        }
        return true;
      });
    }

    function animateBalance() {
      const start = performance.now();
      bunnyAnimating = true;
      animations.push((now) => {
        const duration = reduceMotion ? 560 : 1600;
        const progress = Math.min(1, (now - start) / duration);
        const pose = Math.sin(progress * Math.PI);
        const wobble = Math.sin(progress * Math.PI * 4) * pose;
        bunny.leftArm.pivot.rotation.z = -0.45 + pose * (-Math.PI / 2 + 0.45);
        bunny.rightArm.pivot.rotation.z = 0.45 + pose * (Math.PI / 2 - 0.45);
        bunny.rightLeg.pivot.rotation.z = pose * 0.78;
        bunny.rightLeg.pivot.position.y = 0.65 + pose * (reduceMotion ? 0.08 : 0.25);
        bunny.root.rotation.z = wobble * (reduceMotion ? 0.012 : 0.055);
        bunny.root.position.y = 0.05 + pose * (reduceMotion ? 0.025 : 0.08);
        balance.log.rotation.x = wobble * (reduceMotion ? 0.015 : 0.055);
        balance.bird.rotation.z = -wobble * 0.2;
        if (progress >= 1) {
          resetBunnyPose();
          balance.log.rotation.x = 0;
          balance.bird.rotation.z = 0;
          bunnyAnimating = false;
          return false;
        }
        return true;
      });
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
        if (shouldFinish && discovered.size === ACTIVITIES.length) finish();
      });
    }

    function finish() {
      if (complete) return;
      complete = true;
      locked = false;
      const summary = {
        activities: [...discovered],
        labels: ACTIVITIES.filter((item) => discovered.has(item.id)).map((item) => item.label),
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
      return { drum: 0xffc4b9, march: 0xbfe7ff, stretch: 0xffef9e, balance: 0xd9d0ff }[id] || 0xffffff;
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
        phonePortrait ? 5.45 : tabletPortrait ? 5.12 : 4.85,
        phonePortrait ? 16.25 : tabletPortrait ? 14.9 : 12.65
      );
      camera.lookAt(0, 1.72, 0);
      camera.updateProjectionMatrix();
      world.scale.setScalar(phonePortrait ? 0.77 : tabletPortrait ? 0.9 : 1);
      world.position.y = phonePortrait ? 0.3 : tabletPortrait ? 0.12 : 0;
      bunny.root.position.x = phonePortrait ? -2.72 : tabletPortrait ? -3.05 : -3.35;
      renderer.render(scene, camera);
    }

    function tick(now) {
      if (!active) return;
      lastTime = now;
      for (let index = animations.length - 1; index >= 0; index -= 1) {
        if (!animations[index](now)) animations.splice(index, 1);
      }
      if (!reduceMotion) {
        if (!bunnyAnimating) bunny.root.position.y = 0.05 + Math.sin(now * 0.0021) * 0.024;
        bunny.head.rotation.z = Math.sin(now * 0.0011) * 0.025;
        halos.forEach(({ mesh, material }, id) => {
          const offset = ACTIVITIES.findIndex((item) => item.id === id) * 0.65;
          const pulse = 1 + Math.sin(now * 0.0022 + offset) * 0.055;
          mesh.scale.setScalar(pulse);
          material.opacity = (discovered.has(id) ? 0.25 : 0.52) + Math.sin(now * 0.0022 + offset) * 0.09;
        });
        stretch.root.rotation.z = Math.sin(now * 0.0012) * 0.025;
      }
      renderer.render(scene, camera);
      frameId = global.requestAnimationFrame(tick);
    }

    function readyPayload(announce) {
      const count = discovered.size;
      return {
        prompt: count === 0 ? OPENING.prompt : `動動島還有 ${ACTIVITIES.length - count} 個動作可以看`,
        hint: count === 0 ? OPENING.hint : "想跟哪一個，就直接碰哪一個；剛才的也可以再做",
        speech: [...OPENING.speech],
        count,
        total: ACTIVITIES.length,
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
      if (discovered.size === ACTIVITIES.length) finish();
      else options.onReady?.(readyPayload(startOptions.announce !== false));
    }

    function pause() {
      active = false;
      global.cancelAnimationFrame(frameId);
      cancelTransition();
      resetActiveVisuals();
      renderer.render(scene, camera);
    }

    function reset() {
      cancelTransition();
      resetActiveVisuals();
      discovered.clear();
      ACTIVITIES.forEach((item) => { roundTouches[item.id] = 0; });
      complete = false;
      completionReported = false;
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
        reducedMotion: reduceMotion,
        active,
        locked,
        complete,
        count: discovered.size,
        total: ACTIVITIES.length,
        discovered: [...discovered],
        roundTouches: { ...roundTouches },
        targets: Object.fromEntries(ACTIVITIES.map((item) => [item.id, getScreenPoint(item.id)])),
        bunnyFrame: projectedBounds(bunny.root),
        motion: {
          notesVisible: drum.notes.visible,
          drumPulse: Number(drum.skin.scale.x.toFixed(4)),
          activeFootprint,
          leftFootY: Number(bunny.leftLeg.pivot.position.y.toFixed(4)),
          rightFootY: Number(bunny.rightLeg.pivot.position.y.toFixed(4)),
          leftArmRotation: Number(bunny.leftArm.pivot.rotation.z.toFixed(4)),
          rightArmRotation: Number(bunny.rightArm.pivot.rotation.z.toFixed(4)),
          bunnyTilt: Number(bunny.root.rotation.z.toFixed(4)),
          rightLegRotation: Number(bunny.rightLeg.pivot.rotation.z.toFixed(4)),
          starRotation: Number(stretch.star.rotation.z.toFixed(4))
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

  function copyActivity(item) {
    return { ...item, speech: [...item.speech] };
  }

  global.BunnyMovementIsland3D = {
    create: createMovementIsland,
    activities: ACTIVITIES.map(copyActivity),
    activityIds: ACTIVITIES.map((item) => item.id),
    revision: THREE?.REVISION || null
  };
})(window);
