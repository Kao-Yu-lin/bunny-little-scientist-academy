(function (global) {
  "use strict";

  const THREE = global.THREE;
  const ROLES = Object.freeze([
    Object.freeze({
      id: "cook",
      label: "小廚師",
      result: "兔兔戴上廚師帽，慢慢攪一鍋湯",
      speech: Object.freeze(["兔兔戴上廚師帽，慢慢攪一鍋湯。", "你覺得湯裡可以放什麼？"]),
      wait: 1520
    }),
    Object.freeze({
      id: "doctor",
      label: "小醫生",
      result: "兔兔先問小熊，再輕輕聽一聽",
      speech: Object.freeze(["兔兔先問小熊哪裡不舒服，再輕輕聽一聽。", "你想對小熊說什麼？"]),
      wait: 1640
    }),
    Object.freeze({
      id: "shop",
      label: "小店員",
      result: "兔兔提著籃子，選了一顆紅蘋果",
      speech: Object.freeze(["兔兔提著籃子，選了一顆紅蘋果。", "你還想把什麼放進籃子？"]),
      wait: 1480
    }),
    Object.freeze({
      id: "space",
      label: "太空人",
      result: "兔兔戴好頭盔，慢慢飄向亮亮的星星",
      speech: Object.freeze(["兔兔戴好頭盔，慢慢飄向亮亮的星星。", "你想和兔兔飛去哪裡？"]),
      wait: 1720
    })
  ]);

  const OPENING = Object.freeze({
    prompt: "兔兔今天先扮誰？",
    hint: "鍋子、醫藥箱、購物籃和火箭，想玩哪一個就直接碰哪一個",
    speech: Object.freeze(["這裡有四個好玩的角色。", "小廚師、小醫生、小店員或太空人，你想先扮誰？"])
  });

  function unsupportedController(options) {
    const showFallback = () => {
      if (options.fallback) options.fallback.hidden = false;
      if (options.host) options.host.hidden = true;
      options.onStatus?.("這台裝置暫時不能顯示 3D。可以和大人拿一個鍋子、袋子或帽子，一起玩假裝遊戲。", "fallback");
    };
    showFallback();
    return {
      supported: false,
      start: showFallback,
      pause() {},
      reset: showFallback,
      destroy() {},
      getSnapshot() {
        return { supported: false, complete: false, discovered: [], count: 0, total: ROLES.length };
      },
      getScreenPoint() { return null; },
      selectTarget() { return false; },
      samplePixels() { return Promise.resolve({ colors: 0, opaqueRatio: 0 }); }
    };
  }

  function createPretendTown(options) {
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
    const roundTouches = Object.fromEntries(ROLES.map((item) => [item.id, 0]));
    const colors = {
      sky: 0xbcecf1,
      grass: 0x8bd59a,
      grassDark: 0x4b9f72,
      path: 0xffe7b4,
      white: 0xfffcf8,
      cream: 0xffeed7,
      pink: 0xf492ad,
      coral: 0xf47f72,
      red: 0xe95e5e,
      yellow: 0xf8cf58,
      blue: 0x66addf,
      teal: 0x58b8a9,
      green: 0x6fbc72,
      dark: 0x41374c,
      wood: 0xb98053,
      lavender: 0xa590d8,
      silver: 0xcfd7e2
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
    renderer.toneMappingExposure = 1.06;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = "playroom-canvas";
    renderer.domElement.setAttribute("aria-label", "可自由選角色並和兔兔玩假裝遊戲的 3D 想像小鎮");
    renderer.domElement.setAttribute("role", "application");
    renderer.domElement.tabIndex = 0;
    host.replaceChildren(renderer.domElement);
    host.hidden = false;
    if (fallback) fallback.hidden = true;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x477c69, 2.7);
    scene.add(hemi);
    const keyLight = new THREE.DirectionalLight(0xfff0d6, 4.1);
    keyLight.position.set(-4, 9, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -7;
    keyLight.shadow.camera.right = 7;
    keyLight.shadow.camera.top = 7;
    keyLight.shadow.camera.bottom = -3;
    scene.add(keyLight);
    const fill = new THREE.DirectionalLight(0xdaf4ff, 1.35);
    fill.position.set(7, 4, 5);
    scene.add(fill);

    const world = new THREE.Group();
    scene.add(world);

    const townBase = new THREE.Mesh(
      new THREE.CylinderGeometry(7.35, 7.8, 0.5, 56),
      toonMaterial(colors.grass)
    );
    townBase.position.y = -0.27;
    townBase.receiveShadow = true;
    world.add(townBase);
    const path = new THREE.Mesh(
      new THREE.RingGeometry(3.45, 6.82, 56),
      toonMaterial(colors.path)
    );
    path.rotation.x = -Math.PI / 2;
    path.position.y = 0.005;
    world.add(path);
    const plaza = new THREE.Mesh(
      new THREE.CylinderGeometry(3.58, 3.72, 0.12, 48),
      toonMaterial(0xe7f3c9)
    );
    plaza.position.y = 0.01;
    plaza.receiveShadow = true;
    world.add(plaza);

    addCloud(-5.0, 5.6, -5.4, 0.62);
    addCloud(4.8, 5.25, -5.6, 0.5);
    addHouse(-5.1, -2.8, colors.coral, colors.yellow, 0.76);
    addHouse(5.25, -2.95, colors.blue, colors.lavender, 0.7);
    addTree(-5.0, 1.3, 0.72);
    addTree(5.15, 1.45, 0.66);
    addBunting();

    const bunny = createBunny();
    bunny.root.position.set(-3.35, 0.05, 0.25);
    world.add(bunny.root);

    const cook = createCookTarget();
    cook.root.position.set(3.38, 0.02, 1.25);
    world.add(cook.root);

    const shop = createShopTarget();
    shop.root.position.set(0.72, 0.04, 2.02);
    world.add(shop.root);

    const space = createSpaceTarget();
    space.root.position.set(3.18, 3.72, -1.72);
    world.add(space.root);

    const doctor = createDoctorTarget();
    doctor.root.position.set(-1.05, 0.03, -1.32);
    world.add(doctor.root);

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
    let currentRole = "";
    let activeFruit = -1;

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
        depthWrite: settings.depthWrite ?? true,
        side: settings.side ?? THREE.FrontSide
      });
    }

    function sphere(radius, material, width = 24, height = 16) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, width, height), material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    }

    function box(size, material) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
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
      hit.userData.roleId = id;
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

    function heartMesh(size, color) {
      const shape = new THREE.Shape();
      shape.moveTo(0, -0.36);
      shape.bezierCurveTo(-0.65, -0.02, -0.62, 0.62, -0.22, 0.62);
      shape.bezierCurveTo(0, 0.62, 0, 0.42, 0, 0.34);
      shape.bezierCurveTo(0, 0.42, 0, 0.62, 0.22, 0.62);
      shape.bezierCurveTo(0.62, 0.62, 0.65, -0.02, 0, -0.36);
      const mesh = new THREE.Mesh(
        new THREE.ShapeGeometry(shape, 18),
        toonMaterial(color, { emissive: color, emissiveIntensity: 0.2, side: THREE.DoubleSide })
      );
      mesh.scale.setScalar(size);
      return mesh;
    }

    function starMesh(radius, color) {
      const shape = new THREE.Shape();
      for (let index = 0; index < 10; index += 1) {
        const angle = Math.PI / 2 + index * Math.PI / 5;
        const r = index % 2 === 0 ? radius : radius * 0.45;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (index === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.closePath();
      return new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        toonMaterial(color, { emissive: color, emissiveIntensity: 0.22, side: THREE.DoubleSide })
      );
    }

    function createBunny() {
      const root = new THREE.Group();
      const fur = toonMaterial(colors.white);
      const furShade = toonMaterial(colors.cream);
      const pink = toonMaterial(colors.pink);
      const dark = toonMaterial(colors.dark);
      const outfit = toonMaterial(colors.teal);
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
      const shirtMark = starMesh(0.14, colors.yellow);
      shirtMark.position.set(0, 1.18, 1.06);
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
        pivot.position.set(side * 0.39, 0.65, 0.18);
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.42, 5, 14), fur);
        leg.position.y = -0.28;
        leg.castShadow = true;
        pivot.add(leg);
        const foot = sphere(0.32, fur, 18, 11);
        foot.scale.set(1.2, 0.58, 1.35);
        foot.position.set(0, -0.59, 0.18);
        pivot.add(foot);
        root.add(pivot);
        return { pivot, foot };
      }

      const leftArm = makeArm(-1);
      const rightArm = makeArm(1);
      const leftLeg = makeLeg(-1);
      const rightLeg = makeLeg(1);

      const chefHat = new THREE.Group();
      const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.5, 0.32, 22), toonMaterial(colors.white));
      hatBand.position.y = 3.0;
      chefHat.add(hatBand);
      [-0.3, 0, 0.3].forEach((x, index) => {
        const puff = sphere(0.36, toonMaterial(colors.white), 18, 12);
        puff.position.set(x, 3.27 + (index === 1 ? 0.12 : 0), 0);
        chefHat.add(puff);
      });
      chefHat.visible = false;
      root.add(chefHat);

      const stethoscope = new THREE.Group();
      const tube = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 8, 30, Math.PI * 1.5), toonMaterial(colors.lavender));
      tube.position.set(0, 1.38, 0.96);
      tube.rotation.z = Math.PI * 0.25;
      stethoscope.add(tube);
      const chest = sphere(0.12, toonMaterial(colors.silver, { metalness: 0.25 }), 16, 10);
      chest.position.set(0.3, 1.1, 1.0);
      stethoscope.add(chest);
      stethoscope.visible = false;
      root.add(stethoscope);

      const apron = new THREE.Group();
      const apronBody = box([0.78, 0.88, 0.12], toonMaterial(colors.coral));
      apronBody.position.set(0, 1.08, 1.03);
      apron.add(apronBody);
      const apronPocket = box([0.42, 0.24, 0.08], toonMaterial(colors.yellow));
      apronPocket.position.set(0, 0.95, 1.12);
      apron.add(apronPocket);
      apron.visible = false;
      root.add(apron);

      const roleBasket = new THREE.Group();
      const basketBody = box([0.64, 0.42, 0.38], toonMaterial(colors.wood));
      roleBasket.add(basketBody);
      const basketHandle = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.045, 8, 24, Math.PI), toonMaterial(colors.wood));
      basketHandle.position.y = 0.22;
      roleBasket.add(basketHandle);
      roleBasket.position.set(0.8, 0.78, 0.92);
      roleBasket.visible = false;
      root.add(roleBasket);

      const helmet = new THREE.Group();
      const visor = sphere(0.95, toonMaterial(0xb8e8f5, {
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
        emissive: 0x4fa9ca,
        emissiveIntensity: 0.18
      }), 28, 20);
      visor.position.set(0, 2.36, 0.08);
      visor.scale.set(1, 0.95, 0.98);
      helmet.add(visor);
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.09, 10, 32), toonMaterial(colors.silver));
      collar.position.set(0, 1.77, 0.08);
      collar.rotation.x = Math.PI / 2;
      helmet.add(collar);
      helmet.visible = false;
      root.add(helmet);

      return {
        root,
        head,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg,
        chefHat,
        stethoscope,
        apron,
        roleBasket,
        helmet
      };
    }

    function createCookTarget() {
      const root = new THREE.Group();
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.68, 0.9, 28), toonMaterial(colors.coral));
      pot.position.y = 0.55;
      pot.castShadow = true;
      root.add(pot);
      const soup = new THREE.Mesh(new THREE.CylinderGeometry(0.67, 0.67, 0.08, 28), toonMaterial(colors.yellow, {
        emissive: 0xf09b32,
        emissiveIntensity: 0.14
      }));
      soup.position.y = 1.02;
      root.add(soup);
      [-1, 1].forEach((side) => {
        const handle = box([0.48, 0.15, 0.18], toonMaterial(colors.dark));
        handle.position.set(side * 0.9, 0.68, 0);
        root.add(handle);
      });
      const spoonPivot = new THREE.Group();
      spoonPivot.position.set(0.18, 1.03, 0.12);
      const spoon = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.35, 10), toonMaterial(colors.wood));
      spoon.position.y = 0.52;
      spoon.rotation.z = -0.32;
      spoonPivot.add(spoon);
      const spoonHead = sphere(0.16, toonMaterial(colors.wood), 16, 10);
      spoonHead.scale.set(0.72, 1.25, 0.5);
      spoonHead.position.set(-0.19, 1.08, 0);
      spoonPivot.add(spoonHead);
      root.add(spoonPivot);
      const steam = new THREE.Group();
      [0, 1, 2].forEach((index) => {
        const puff = sphere(0.18 + index * 0.035, toonMaterial(0xffffff, {
          transparent: true,
          opacity: 0.72,
          depthWrite: false,
          emissive: 0xffffff,
          emissiveIntensity: 0.2
        }), 16, 10);
        puff.userData.baseX = -0.32 + index * 0.3;
        puff.userData.baseY = 1.45 + index * 0.24;
        puff.position.set(puff.userData.baseX, puff.userData.baseY, 0.08);
        steam.add(puff);
      });
      steam.visible = false;
      root.add(steam);
      root.add(makeHalo("cook", 1.13, [0, 0.9, 0.2], 0xffc6b5));
      root.add(makeHitTarget("cook", new THREE.SphereGeometry(1.18, 18, 12), [0, 0.88, 0]));
      return { root, pot, soup, spoonPivot, steam };
    }

    function createDoctorTarget() {
      const root = new THREE.Group();
      const teddy = new THREE.Group();
      const bearMaterial = toonMaterial(0xc98d60);
      const bearCream = toonMaterial(colors.cream);
      const bearBody = sphere(0.52, bearMaterial, 20, 14);
      bearBody.scale.set(0.88, 1.1, 0.76);
      bearBody.position.y = 0.68;
      teddy.add(bearBody);
      const bearHead = sphere(0.46, bearMaterial, 20, 14);
      bearHead.position.y = 1.4;
      teddy.add(bearHead);
      [-0.31, 0.31].forEach((x) => {
        const ear = sphere(0.17, bearMaterial, 14, 10);
        ear.position.set(x, 1.72, 0);
        teddy.add(ear);
        const eye = sphere(0.045, toonMaterial(colors.dark), 12, 8);
        eye.position.set(x * 0.52, 1.46, 0.42);
        teddy.add(eye);
      });
      const muzzle = sphere(0.2, bearCream, 16, 10);
      muzzle.scale.z = 0.58;
      muzzle.position.set(0, 1.28, 0.39);
      teddy.add(muzzle);
      root.add(teddy);
      const bag = box([1.2, 0.72, 0.48], toonMaterial(colors.white));
      bag.position.set(1.02, 0.48, 0.1);
      root.add(bag);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.06, 8, 24, Math.PI), toonMaterial(colors.dark));
      handle.position.set(1.02, 0.85, 0.1);
      root.add(handle);
      const crossV = box([0.16, 0.48, 0.08], toonMaterial(colors.red));
      crossV.position.set(1.02, 0.48, 0.37);
      root.add(crossV);
      const crossH = box([0.48, 0.16, 0.08], toonMaterial(colors.red));
      crossH.position.set(1.02, 0.48, 0.37);
      root.add(crossH);
      const heart = heartMesh(0.54, colors.pink);
      heart.position.set(0, 2.08, 0.25);
      heart.visible = false;
      root.add(heart);
      root.add(makeHalo("doctor", 1.42, [0.35, 0.92, 0.18], 0xdcd3ff));
      root.add(makeHitTarget("doctor", new THREE.BoxGeometry(2.35, 2.4, 0.72), [0.35, 0.92, 0]));
      return { root, teddy, bag, heart };
    }

    function createShopTarget() {
      const root = new THREE.Group();
      const basket = new THREE.Group();
      const basketBody = box([1.5, 0.62, 0.76], toonMaterial(colors.wood));
      basketBody.position.y = 0.45;
      basket.add(basketBody);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.065, 8, 28, Math.PI), toonMaterial(colors.wood));
      handle.position.y = 0.76;
      basket.add(handle);
      root.add(basket);
      const fruits = [];
      [
        [-0.46, colors.red],
        [0, colors.yellow],
        [0.46, colors.green]
      ].forEach(([x, color], index) => {
        const fruit = sphere(0.29, toonMaterial(color, { emissive: color, emissiveIntensity: 0.06 }), 18, 12);
        fruit.position.set(x, 0.92 + (index === 1 ? 0.08 : 0), 0.08);
        fruit.userData.baseY = fruit.position.y;
        root.add(fruit);
        const leaf = sphere(0.1, toonMaterial(colors.grassDark), 12, 8);
        leaf.scale.set(1.2, 0.35, 0.72);
        leaf.position.set(x + 0.08, fruit.position.y + 0.28, 0.08);
        root.add(leaf);
        fruits.push(fruit);
      });
      const sign = box([1.85, 0.52, 0.16], toonMaterial(colors.yellow));
      sign.position.set(0, 1.72, -0.12);
      root.add(sign);
      [colors.red, colors.blue, colors.green].forEach((color, index) => {
        const dot = sphere(0.12, toonMaterial(color), 12, 8);
        dot.position.set(-0.46 + index * 0.46, 1.72, 0.0);
        root.add(dot);
      });
      root.add(makeHalo("shop", 1.1, [0, 0.78, 0.18], 0xc6ebd2));
      root.add(makeHitTarget("shop", new THREE.BoxGeometry(2.1, 2.05, 0.72), [0, 0.85, 0]));
      return { root, basket, fruits };
    }

    function createSpaceTarget() {
      const root = new THREE.Group();
      const rocket = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.48, 1.42, 22), toonMaterial(colors.white));
      rocket.add(body);
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.62, 22), toonMaterial(colors.coral));
      nose.position.y = 1.02;
      rocket.add(nose);
      const windowMesh = sphere(0.18, toonMaterial(colors.blue, { emissive: colors.blue, emissiveIntensity: 0.25 }), 16, 10);
      windowMesh.scale.z = 0.48;
      windowMesh.position.set(0, 0.28, 0.38);
      rocket.add(windowMesh);
      [-1, 1].forEach((side) => {
        const fin = new THREE.Mesh(new THREE.ConeGeometry(0.23, 0.62, 3), toonMaterial(colors.yellow));
        fin.position.set(side * 0.42, -0.53, 0);
        fin.rotation.z = side * -0.32;
        rocket.add(fin);
      });
      rocket.position.set(0.18, 0, 0);
      rocket.rotation.z = -0.18;
      root.add(rocket);
      const flames = new THREE.Group();
      [colors.yellow, colors.coral].forEach((color, index) => {
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.18 - index * 0.05, 0.65 - index * 0.12, 14), toonMaterial(color, {
          emissive: color,
          emissiveIntensity: 0.55
        }));
        flame.position.set(0.18, -1.05 + index * 0.08, 0);
        flame.rotation.z = Math.PI;
        flames.add(flame);
      });
      flames.visible = false;
      root.add(flames);
      const planet = sphere(0.46, toonMaterial(colors.lavender, { emissive: 0x6952aa, emissiveIntensity: 0.16 }), 22, 14);
      planet.position.set(-1.02, 0.62, -0.15);
      root.add(planet);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.055, 8, 32), toonMaterial(colors.yellow));
      ring.position.copy(planet.position);
      ring.rotation.x = 1.08;
      root.add(ring);
      const stars = new THREE.Group();
      [[-0.58, 1.45], [0.94, 1.35], [1.18, -0.18]].forEach(([x, y], index) => {
        const star = starMesh(0.2 + index * 0.035, index === 1 ? colors.pink : colors.yellow);
        star.position.set(x, y, 0.25);
        star.userData.baseY = y;
        stars.add(star);
      });
      root.add(stars);
      root.add(makeHalo("space", 1.15, [0, 0.22, 0.2], 0xffef9f));
      root.add(makeHitTarget("space", new THREE.SphereGeometry(1.35, 18, 12), [0, 0.18, 0]));
      return { root, rocket, flames, planet, stars };
    }

    function addCloud(x, y, z, scale) {
      const cloud = new THREE.Group();
      [[-0.42, 0, 0.45], [0, 0.18, 0.58], [0.45, 0, 0.42]].forEach(([cx, cy, radius]) => {
        const puff = sphere(radius, toonMaterial(colors.white, { roughness: 0.9 }), 20, 12);
        puff.position.set(cx, cy, 0);
        cloud.add(puff);
      });
      cloud.position.set(x, y, z);
      cloud.scale.setScalar(scale);
      world.add(cloud);
    }

    function addHouse(x, z, wallColor, roofColor, scale) {
      const house = new THREE.Group();
      const wall = box([2.2, 1.8, 1.35], toonMaterial(wallColor));
      wall.position.y = 0.92;
      house.add(wall);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.65, 1.15, 4), toonMaterial(roofColor));
      roof.position.y = 2.25;
      roof.rotation.y = Math.PI / 4;
      house.add(roof);
      const door = box([0.62, 1.05, 0.12], toonMaterial(colors.wood));
      door.position.set(0, 0.53, 0.75);
      house.add(door);
      [-0.72, 0.72].forEach((wx) => {
        const windowMesh = box([0.42, 0.42, 0.1], toonMaterial(0xbce9f4, { emissive: 0x68bdd1, emissiveIntensity: 0.12 }));
        windowMesh.position.set(wx, 1.15, 0.75);
        house.add(windowMesh);
      });
      house.position.set(x, 0, z);
      house.scale.setScalar(scale);
      world.add(house);
    }

    function addTree(x, z, scale) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 1.7, 12), toonMaterial(colors.wood));
      trunk.position.y = 0.85;
      tree.add(trunk);
      [[0, 1.85, 0.75], [-0.46, 1.62, 0.52], [0.48, 1.62, 0.55]].forEach(([tx, ty, radius]) => {
        const crown = sphere(radius, toonMaterial(colors.green), 18, 12);
        crown.position.set(tx, ty, 0);
        tree.add(crown);
      });
      tree.position.set(x, 0, z);
      tree.scale.setScalar(scale);
      world.add(tree);
    }

    function addBunting() {
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 5.5, 6), toonMaterial(0xf2e5c5));
      rope.position.set(0, 4.68, -3.8);
      rope.rotation.z = Math.PI / 2;
      world.add(rope);
      [colors.coral, colors.yellow, colors.blue, colors.lavender, colors.teal].forEach((color, index) => {
        const flag = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.55, 3), toonMaterial(color));
        flag.position.set(-2.1 + index * 1.05, 4.38, -3.75);
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
      if (hit?.object?.userData?.roleId) selectTarget(hit.object.userData.roleId);
    }

    function handleKeyDown(event) {
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      const next = ROLES.find((item) => !discovered.has(item.id)) || ROLES[0];
      selectTarget(next.id);
    }

    function selectTarget(id) {
      if (!active || locked || complete) return false;
      const item = ROLES.find((candidate) => candidate.id === id);
      if (!item) return false;

      resetActiveVisuals();
      locked = true;
      currentRole = id;
      const firstInRound = !discovered.has(id);
      discovered.add(id);
      roundTouches[id] += 1;
      syncHalos();
      const narration = options.speak?.([...item.speech], {
        kind: "result",
        stage: discovered.size - 1,
        taskId: item.id
      });
      options.onRole?.({
        ...copyRole(item),
        firstInRound,
        count: discovered.size,
        total: ROLES.length,
        remaining: ROLES.length - discovered.size,
        discovered: [...discovered],
        roundTouches: { ...roundTouches }
      });

      if (id === "cook") animateCook();
      if (id === "doctor") animateDoctor();
      if (id === "shop") animateShop();
      if (id === "space") animateSpace();
      scheduleSettle(reduceMotion ? Math.min(560, item.wait) : item.wait, narration, discovered.size === ROLES.length);
      return true;
    }

    function resetBunnyPose() {
      bunny.root.position.y = 0.05;
      bunny.root.rotation.z = 0;
      bunny.root.scale.setScalar(1);
      bunny.head.rotation.z = 0;
      bunny.leftArm.pivot.rotation.z = -0.45;
      bunny.rightArm.pivot.rotation.z = 0.45;
      bunny.leftLeg.pivot.rotation.z = 0;
      bunny.rightLeg.pivot.rotation.z = 0;
      bunny.leftLeg.pivot.position.y = 0.65;
      bunny.rightLeg.pivot.position.y = 0.65;
    }

    function hideRoleAccessories() {
      bunny.chefHat.visible = false;
      bunny.stethoscope.visible = false;
      bunny.apron.visible = false;
      bunny.roleBasket.visible = false;
      bunny.helmet.visible = false;
      cook.steam.visible = false;
      doctor.heart.visible = false;
      space.flames.visible = false;
      activeFruit = -1;
    }

    function resetActiveVisuals() {
      animations.length = 0;
      bunnyAnimating = false;
      currentRole = "";
      resetBunnyPose();
      hideRoleAccessories();
      cook.spoonPivot.rotation.z = 0;
      doctor.teddy.rotation.z = 0;
      doctor.heart.scale.setScalar(0.54);
      shop.fruits.forEach((fruit) => { fruit.position.y = fruit.userData.baseY; });
      shop.basket.scale.setScalar(1);
      space.rocket.rotation.z = -0.18;
      space.stars.children.forEach((star) => {
        star.position.y = star.userData.baseY;
        star.scale.setScalar(1);
      });
    }

    function applyRolePose(id) {
      resetBunnyPose();
      hideRoleAccessories();
      currentRole = id;
      if (id === "cook") {
        bunny.chefHat.visible = true;
        cook.steam.visible = true;
        bunny.leftArm.pivot.rotation.z = -0.68;
        bunny.rightArm.pivot.rotation.z = 0.72;
      }
      if (id === "doctor") {
        bunny.stethoscope.visible = true;
        doctor.heart.visible = true;
        bunny.rightArm.pivot.rotation.z = -0.18;
      }
      if (id === "shop") {
        bunny.apron.visible = true;
        bunny.roleBasket.visible = true;
        activeFruit = 0;
        bunny.rightArm.pivot.rotation.z = 0.16;
      }
      if (id === "space") {
        bunny.helmet.visible = true;
        space.flames.visible = true;
        bunny.root.position.y = reduceMotion ? 0.18 : 0.3;
        bunny.leftArm.pivot.rotation.z = -1.22;
        bunny.rightArm.pivot.rotation.z = 1.22;
      }
    }

    function animateCook() {
      const start = performance.now();
      bunnyAnimating = true;
      bunny.chefHat.visible = true;
      cook.steam.visible = true;
      animations.push((now) => {
        const duration = reduceMotion ? 520 : 1420;
        const progress = Math.min(1, (now - start) / duration);
        const stir = Math.sin(progress * Math.PI * 6);
        const lift = Math.sin(progress * Math.PI);
        cook.spoonPivot.rotation.z = progress * Math.PI * (reduceMotion ? 0.42 : 1.7);
        bunny.leftArm.pivot.rotation.z = -0.65 + stir * 0.22;
        bunny.rightArm.pivot.rotation.z = 0.68 - stir * 0.28;
        bunny.root.position.y = 0.05 + Math.abs(stir) * (reduceMotion ? 0.02 : 0.06);
        cook.steam.children.forEach((puff, index) => {
          puff.position.x = puff.userData.baseX + Math.sin(progress * Math.PI * 3 + index) * 0.08;
          puff.position.y = puff.userData.baseY + lift * (0.18 + index * 0.06);
          puff.scale.setScalar(0.82 + lift * 0.3);
        });
        if (progress >= 1) {
          applyRolePose("cook");
          bunnyAnimating = false;
          return false;
        }
        return true;
      });
    }

    function animateDoctor() {
      const start = performance.now();
      bunnyAnimating = true;
      bunny.stethoscope.visible = true;
      doctor.heart.visible = true;
      animations.push((now) => {
        const duration = reduceMotion ? 560 : 1580;
        const progress = Math.min(1, (now - start) / duration);
        const listen = Math.sin(progress * Math.PI);
        const beat = Math.max(0, Math.sin(progress * Math.PI * 6));
        bunny.rightArm.pivot.rotation.z = 0.45 - listen * 0.95;
        bunny.head.rotation.z = -listen * (reduceMotion ? 0.04 : 0.12);
        doctor.teddy.rotation.z = Math.sin(progress * Math.PI * 4) * listen * (reduceMotion ? 0.015 : 0.055);
        doctor.heart.scale.setScalar(0.54 + beat * 0.22);
        doctor.heart.position.y = 2.08 + listen * 0.16;
        if (progress >= 1) {
          applyRolePose("doctor");
          doctor.heart.position.y = 2.08;
          bunnyAnimating = false;
          return false;
        }
        return true;
      });
    }

    function animateShop() {
      const start = performance.now();
      bunnyAnimating = true;
      bunny.apron.visible = true;
      bunny.roleBasket.visible = true;
      activeFruit = 0;
      animations.push((now) => {
        const duration = reduceMotion ? 520 : 1380;
        const progress = Math.min(1, (now - start) / duration);
        const bounce = Math.sin(progress * Math.PI);
        const wave = Math.sin(progress * Math.PI * 5) * bounce;
        shop.fruits[0].position.y = shop.fruits[0].userData.baseY + bounce * (reduceMotion ? 0.18 : 0.52);
        shop.fruits[0].rotation.z = progress * Math.PI * (reduceMotion ? 0.35 : 1.4);
        shop.basket.scale.set(1 + bounce * 0.07, 1 + bounce * 0.04, 1 + bounce * 0.07);
        bunny.rightArm.pivot.rotation.z = 0.2 - wave * 0.24;
        bunny.leftArm.pivot.rotation.z = -0.45 - bounce * 0.28;
        if (progress >= 1) {
          shop.fruits[0].position.y = shop.fruits[0].userData.baseY;
          shop.fruits[0].rotation.z = 0;
          shop.basket.scale.setScalar(1);
          applyRolePose("shop");
          bunnyAnimating = false;
          return false;
        }
        return true;
      });
    }

    function animateSpace() {
      const start = performance.now();
      bunnyAnimating = true;
      bunny.helmet.visible = true;
      space.flames.visible = true;
      animations.push((now) => {
        const duration = reduceMotion ? 560 : 1640;
        const progress = Math.min(1, (now - start) / duration);
        const float = Math.sin(progress * Math.PI);
        const shimmer = Math.sin(progress * Math.PI * 8);
        bunny.root.position.y = 0.05 + float * (reduceMotion ? 0.2 : 0.58);
        bunny.root.rotation.z = shimmer * float * (reduceMotion ? 0.012 : 0.05);
        bunny.leftArm.pivot.rotation.z = -0.45 - float * 0.78;
        bunny.rightArm.pivot.rotation.z = 0.45 + float * 0.78;
        space.rocket.rotation.z = -0.18 + shimmer * float * (reduceMotion ? 0.02 : 0.08);
        space.flames.scale.set(1, 0.82 + Math.abs(shimmer) * 0.42, 1);
        space.stars.children.forEach((star, index) => {
          star.position.y = star.userData.baseY + float * (0.08 + index * 0.04);
          star.scale.setScalar(1 + Math.max(0, Math.sin(progress * Math.PI * 5 + index)) * 0.2);
        });
        if (progress >= 1) {
          space.flames.scale.setScalar(1);
          space.rocket.rotation.z = -0.18;
          space.stars.children.forEach((star) => {
            star.position.y = star.userData.baseY;
            star.scale.setScalar(1);
          });
          applyRolePose("space");
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
        if (shouldFinish && discovered.size === ROLES.length) finish();
      });
    }

    function finish() {
      if (complete) return;
      complete = true;
      locked = false;
      const summary = {
        roles: [...discovered],
        labels: ROLES.filter((item) => discovered.has(item.id)).map((item) => item.label),
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
      return { cook: 0xffc6b5, doctor: 0xdcd3ff, shop: 0xc6ebd2, space: 0xffef9f }[id] || 0xffffff;
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
      bunny.root.position.x = phonePortrait ? -2.52 : tabletPortrait ? -3.05 : -3.35;
      renderer.render(scene, camera);
    }

    function tick(now) {
      if (!active) return;
      for (let index = animations.length - 1; index >= 0; index -= 1) {
        if (!animations[index](now)) animations.splice(index, 1);
      }
      if (!reduceMotion) {
        if (!bunnyAnimating) {
          const baseY = currentRole === "space" ? 0.3 : 0.05;
          bunny.root.position.y = baseY + Math.sin(now * 0.0021) * (currentRole === "space" ? 0.08 : 0.024);
        }
        bunny.head.rotation.z = Math.sin(now * 0.0011) * 0.024;
        halos.forEach(({ mesh, material }, id) => {
          const offset = ROLES.findIndex((item) => item.id === id) * 0.65;
          const pulse = 1 + Math.sin(now * 0.0022 + offset) * 0.055;
          mesh.scale.setScalar(pulse);
          material.opacity = (discovered.has(id) ? 0.25 : 0.52) + Math.sin(now * 0.0022 + offset) * 0.09;
        });
        if (currentRole === "cook") {
          cook.steam.children.forEach((puff, index) => {
            puff.position.y = puff.userData.baseY + Math.sin(now * 0.0018 + index) * 0.08;
          });
        }
        if (currentRole === "doctor") doctor.heart.scale.setScalar(0.54 + Math.max(0, Math.sin(now * 0.004)) * 0.07);
        if (currentRole === "space") space.stars.rotation.z = Math.sin(now * 0.0012) * 0.04;
      }
      renderer.render(scene, camera);
      frameId = global.requestAnimationFrame(tick);
    }

    function readyPayload(announce) {
      const count = discovered.size;
      return {
        prompt: count === 0 ? OPENING.prompt : `想像小鎮還有 ${ROLES.length - count} 個角色可以玩`,
        hint: count === 0 ? OPENING.hint : "想扮誰就直接碰哪一個；剛才的角色也可以再玩",
        speech: [...OPENING.speech],
        count,
        total: ROLES.length,
        discovered: [...discovered],
        announce
      };
    }

    function start(startOptions = {}) {
      active = true;
      resize();
      global.cancelAnimationFrame(frameId);
      frameId = global.requestAnimationFrame(tick);
      if (discovered.size === ROLES.length) finish();
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
      ROLES.forEach((item) => { roundTouches[item.id] = 0; });
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
      const box3 = new THREE.Box3().setFromObject(object);
      const corners = [];
      for (const x of [box3.min.x, box3.max.x]) {
        for (const y of [box3.min.y, box3.max.y]) {
          for (const z of [box3.min.z, box3.max.z]) corners.push(new THREE.Vector3(x, y, z).project(camera));
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
        total: ROLES.length,
        discovered: [...discovered],
        roundTouches: { ...roundTouches },
        targets: Object.fromEntries(ROLES.map((item) => [item.id, getScreenPoint(item.id)])),
        bunnyFrame: projectedBounds(bunny.root),
        motion: {
          currentRole,
          chefHatVisible: bunny.chefHat.visible,
          steamVisible: cook.steam.visible,
          spoonRotation: Number(cook.spoonPivot.rotation.z.toFixed(4)),
          stethoscopeVisible: bunny.stethoscope.visible,
          heartVisible: doctor.heart.visible,
          heartScale: Number(doctor.heart.scale.x.toFixed(4)),
          teddyTilt: Number(doctor.teddy.rotation.z.toFixed(4)),
          apronVisible: bunny.apron.visible,
          basketVisible: bunny.roleBasket.visible,
          activeFruit,
          fruitY: Number(shop.fruits[0].position.y.toFixed(4)),
          helmetVisible: bunny.helmet.visible,
          flamesVisible: space.flames.visible,
          bunnyY: Number(bunny.root.position.y.toFixed(4)),
          rocketTilt: Number(space.rocket.rotation.z.toFixed(4)),
          leftArmRotation: Number(bunny.leftArm.pivot.rotation.z.toFixed(4)),
          rightArmRotation: Number(bunny.rightArm.pivot.rotation.z.toFixed(4))
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

  function copyRole(item) {
    return { ...item, speech: [...item.speech] };
  }

  global.BunnyPretendTown3D = {
    create: createPretendTown,
    roles: ROLES.map(copyRole),
    roleIds: ROLES.map((item) => item.id),
    revision: THREE?.REVISION || null
  };
})(window);
