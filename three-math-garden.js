(function (global) {
  "use strict";

  const THREE = global.THREE;
  const TASK_IDS = ["count", "exact", "more", "add-one"];
  const NUMBER_WORDS = ["零", "一", "二", "三", "四", "五"];

  function clampLevel(value) {
    return Math.max(1, Math.min(3, Number(value) || 1));
  }

  function makeRound(levelValue, seedValue) {
    const level = clampLevel(levelValue);
    const seed = Math.max(0, Number(seedValue) || 0);
    const max = level + 2;
    const countTarget = 2 + (seed % Math.max(1, max - 1));
    const exactTarget = 1 + ((seed + level) % max);
    const exactOther = exactTarget === max ? exactTarget - 1 : exactTarget + 1;
    const exactTargetOnLeft = seed % 2 === 0;
    const moreLow = Math.max(1, level);
    const moreHigh = Math.min(max, moreLow + (level === 3 ? 1 : 2));
    const moreTargetOnLeft = seed % 3 === 1;
    const addBase = 1 + ((seed + 1) % Math.max(1, max - 1));

    return {
      level,
      max,
      countTarget,
      exactTarget,
      exactLeft: exactTargetOnLeft ? exactTarget : exactOther,
      exactRight: exactTargetOnLeft ? exactOther : exactTarget,
      exactCorrect: exactTargetOnLeft ? "left" : "right",
      moreLeft: moreTargetOnLeft ? moreHigh : moreLow,
      moreRight: moreTargetOnLeft ? moreLow : moreHigh,
      moreCorrect: moreTargetOnLeft ? "left" : "right",
      addBase,
      addResult: addBase + 1
    };
  }

  function taskCopyForRound(round) {
    return [
      {
        id: TASK_IDS[0],
        prompt: `幫兔兔摘 ${round.countTarget} 根胡蘿蔔`,
        hint: `現在只要：一根一根輕碰，放 ${round.countTarget} 根`,
        speech: ["我們一起整理胡蘿蔔。", `請放${NUMBER_WORDS[round.countTarget]}根進籃子。`],
        resultSpeech: [`現在有${NUMBER_WORDS[round.countTarget]}根。`, "剛好是我們要的數量。"]
      },
      {
        id: TASK_IDS[1],
        prompt: `哪個籃子剛好有 ${round.exactTarget} 根？`,
        hint: `現在只要：輕碰剛好有 ${round.exactTarget} 根的籃子`,
        speech: ["兩個籃子不一樣。", `哪一個剛好有${NUMBER_WORDS[round.exactTarget]}根？指給我看。`],
        resultSpeech: [`這裡有${NUMBER_WORDS[round.exactTarget]}根。`, "和我們要找的數量一樣。"]
      },
      {
        id: TASK_IDS[2],
        prompt: "哪個籃子的胡蘿蔔比較多？",
        hint: "現在只要：輕碰胡蘿蔔比較多的籃子",
        speech: ["兩個籃子都裝好了。", "哪一邊的胡蘿蔔比較多？"],
        resultSpeech: [`這邊有${NUMBER_WORDS[Math.max(round.moreLeft, round.moreRight)]}根。`, "它比另一邊多。"]
      },
      {
        id: TASK_IDS[3],
        prompt: `有 ${round.addBase} 根，再放 1 根`,
        hint: "現在只要：輕碰旁邊那一根胡蘿蔔",
        speech: [`籃子裡已經有${NUMBER_WORDS[round.addBase]}根。`, "再放一根，會變成幾根呢？"],
        resultSpeech: [`${NUMBER_WORDS[round.addBase]}根，再來一根。`, `現在是${NUMBER_WORDS[round.addResult]}根。`]
      }
    ];
  }

  function unsupportedController(options) {
    const showFallback = () => {
      if (options.fallback) options.fallback.hidden = false;
      if (options.host) options.host.hidden = true;
      options.onStatus?.("這台裝置暫時不能顯示 3D，兔兔先用圖卡陪你數一數。", "fallback");
    };
    showFallback();
    return {
      supported: false,
      start: showFallback,
      pause() {},
      reset: showFallback,
      destroy() {},
      getSnapshot() { return { supported: false, stage: 0, complete: false }; },
      getScreenPoint() { return null; },
      selectTarget() { return false; },
      samplePixels() { return Promise.resolve({ colors: 0, opaqueRatio: 0 }); }
    };
  }

  function createMathGarden(options) {
    if (!THREE || !options?.host) return unsupportedController(options || {});

    const host = options.host;
    const fallback = options.fallback;
    const reduceMotion = global.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const interactiveMeshes = [];
    const targetRoots = new Map();
    const animations = [];
    const colors = {
      sky: 0xd4f1f7,
      grass: 0x8bd18a,
      grassDark: 0x4f9b68,
      white: 0xfffcf8,
      cream: 0xfff0d3,
      pink: 0xf59ab6,
      dark: 0x44384d,
      mint: 0x73bbae,
      orange: 0xf18b3f,
      orangeLight: 0xffb25f,
      leaf: 0x58a76d,
      soil: 0x9b684c,
      soilLight: 0xc88a63,
      basket: 0xd59a5f,
      basketDark: 0x9d6847,
      yellow: 0xf4cf57
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
    renderer.domElement.className = "playroom-canvas math-garden-canvas";
    renderer.domElement.setAttribute("aria-label", "可觸控的 3D 兔兔數學花園");
    renderer.domElement.setAttribute("role", "application");
    renderer.domElement.tabIndex = 0;
    host.replaceChildren(renderer.domElement);
    host.hidden = false;
    if (fallback) fallback.hidden = true;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x5f9368, 2.45));
    const sun = new THREE.DirectionalLight(0xfff2d7, 4.25);
    sun.position.set(-5, 9, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -7;
    sun.shadow.camera.right = 7;
    sun.shadow.camera.top = 7;
    sun.shadow.camera.bottom = -3;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xd8ebff, 1.2);
    fill.position.set(6, 4, 6);
    scene.add(fill);

    const world = new THREE.Group();
    scene.add(world);

    const island = new THREE.Mesh(
      new THREE.CylinderGeometry(7.2, 7.7, 0.45, 56),
      material(colors.grass)
    );
    island.position.y = -0.25;
    island.receiveShadow = true;
    world.add(island);

    addCloud(-4.5, 5.25, -3.8, 1.0);
    addCloud(4.8, 5.6, -4.8, 0.82);
    addTree(-5.1, -1.8, 0.86);
    addTree(5.25, -2.4, 0.76);
    addFence();
    addFlowers();

    const bunny = createBunny();
    bunny.root.position.set(-3.25, 0.05, 0.25);
    bunny.root.rotation.y = -0.06;
    world.add(bunny.root);

    const countRoot = new THREE.Group();
    const choiceRoot = new THREE.Group();
    const addRoot = new THREE.Group();
    world.add(countRoot, choiceRoot, addRoot);

    const gardenBed = createGardenBed();
    countRoot.add(gardenBed);
    const countBasket = createBasket("count-basket", false);
    countBasket.root.position.set(3.05, 0.08, 0.9);
    countRoot.add(countBasket.root);

    const carrotPositions = [
      [-1.55, 0.2, 0.88],
      [-0.6, 0.2, 1.08],
      [0.35, 0.2, 0.82],
      [1.3, 0.2, 1.08],
      [2.18, 0.2, 0.82]
    ];
    const fieldCarrots = carrotPositions.map((position, index) => {
      const carrot = createCarrot(`carrot${index}`, true, 1);
      carrot.root.position.set(...position);
      carrot.root.userData.home = new THREE.Vector3(...position);
      carrot.root.userData.collected = false;
      countRoot.add(carrot.root);
      targetRoots.set(`carrot${index}`, carrot.root);
      return carrot.root;
    });

    const leftBasket = createBasket("left", true);
    const rightBasket = createBasket("right", true);
    leftBasket.root.position.set(-0.55, 0.08, 0.9);
    rightBasket.root.position.set(2.15, 0.08, 0.9);
    choiceRoot.add(leftBasket.root, rightBasket.root);
    targetRoots.set("left", leftBasket.root);
    targetRoots.set("right", rightBasket.root);

    const addBasket = createBasket("add-basket", false);
    addBasket.root.position.set(0.25, 0.08, 0.9);
    addRoot.add(addBasket.root);
    const addCarrot = createCarrot("add", true, 1.18);
    addCarrot.root.position.set(2.45, 0.35, 0.92);
    addCarrot.root.userData.home = addCarrot.root.position.clone();
    addRoot.add(addCarrot.root);
    targetRoots.set("add", addCarrot.root);

    let round = makeRound(options.getLevel?.(), options.getRound?.());
    let stage = 0;
    let countProgress = 0;
    let exactFirstTry = true;
    let moreFirstTry = true;
    let complete = false;
    let active = false;
    let locked = false;
    let completionReported = false;
    let reminderCount = 0;
    let bunnyJumping = false;
    let frameId = 0;
    let resizeObserver;
    let transitionTimer = 0;
    let transitionToken = 0;
    let lastTime = performance.now();

    setStage(0, false);
    resize();
    renderer.render(scene, camera);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("keydown", handleKeyDown);
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    function material(color, settings = {}) {
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

    function sphere(radius, meshMaterial, width = 24, height = 16) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, width, height), meshMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    }

    function createBunny() {
      const root = new THREE.Group();
      const fur = material(colors.white);
      const furShade = material(colors.cream);
      const pink = material(colors.pink);
      const dark = material(colors.dark);
      const outfit = material(colors.mint);

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

      const head = sphere(0.78, fur);
      head.scale.set(1, 0.94, 0.94);
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
        const eye = sphere(0.095, dark, 18, 12);
        eye.scale.set(0.84, 1.16, 0.6);
        eye.position.set(x, 2.35, 0.72);
        root.add(eye);
        const light = sphere(0.026, material(0xffffff), 12, 8);
        light.position.set(x - 0.02, 2.39, 0.775);
        root.add(light);
        const cheek = sphere(0.12, pink, 16, 10);
        cheek.scale.set(1.4, 0.65, 0.35);
        cheek.position.set(x * 1.48, 2.12, 0.71);
        root.add(cheek);
      });

      const nose = sphere(0.075, pink, 16, 10);
      nose.scale.set(1.1, 0.78, 0.72);
      nose.position.set(0, 2.18, 0.79);
      root.add(nose);
      const smile = sphere(0.06, dark, 14, 8);
      smile.scale.set(1.0, 0.18, 0.2);
      smile.position.set(0, 2.06, 0.785);
      root.add(smile);

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

      const flower = new THREE.Group();
      const center = sphere(0.075, material(colors.yellow), 12, 8);
      flower.add(center);
      for (let index = 0; index < 5; index += 1) {
        const angle = index / 5 * Math.PI * 2;
        const petal = sphere(0.07, pink, 12, 8);
        petal.scale.set(0.7, 1.2, 0.42);
        petal.position.set(Math.cos(angle) * 0.12, Math.sin(angle) * 0.12, 0);
        petal.rotation.z = angle - Math.PI / 2;
        flower.add(petal);
      }
      flower.position.set(-0.52, 3.62, 0.18);
      flower.scale.setScalar(1.15);
      root.add(flower);

      root.traverse((object) => {
        if (object.isMesh) object.castShadow = true;
      });
      return { root, head };
    }

    function createCarrot(key, interactive, scale) {
      const root = new THREE.Group();
      root.userData.key = key;
      root.scale.setScalar(scale);
      root.userData.baseScale = scale;

      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.035, 0.68, 16),
        material(colors.orange, { roughness: 0.58 })
      );
      body.position.y = 0.33;
      body.castShadow = true;
      body.userData.key = key;
      root.add(body);

      [-0.13, 0, 0.13].forEach((x, index) => {
        const leaf = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.045, 0.3, 4, 10),
          material(colors.leaf)
        );
        leaf.position.set(x, 0.82, 0);
        leaf.rotation.z = (index - 1) * 0.32;
        leaf.castShadow = true;
        root.add(leaf);
      });

      if (interactive) interactiveMeshes.push(body);
      return { root, body };
    }

    function createBasket(key, interactive) {
      const root = new THREE.Group();
      root.userData.key = key;
      root.userData.baseScale = 1;
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.78, 0.62, 0.66, 18),
        material(colors.basket, { roughness: 0.74 })
      );
      body.position.y = 0.34;
      body.castShadow = true;
      body.receiveShadow = true;
      root.add(body);
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.73, 0.075, 10, 24),
        material(colors.basketDark)
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.68;
      root.add(rim);
      const handle = new THREE.Mesh(
        new THREE.TorusGeometry(0.67, 0.055, 10, 28, Math.PI),
        material(colors.basketDark)
      );
      handle.position.y = 0.72;
      root.add(handle);

      const carrots = new THREE.Group();
      root.add(carrots);

      if (interactive) {
        const hit = new THREE.Mesh(
          new THREE.SphereGeometry(1.02, 12, 8),
          material(0xffffff, { transparent: true, opacity: 0, depthWrite: false })
        );
        hit.position.y = 0.7;
        hit.userData.key = key;
        root.add(hit);
        interactiveMeshes.push(hit);
      }
      return { root, carrots };
    }

    function setBasketCount(basket, count) {
      basket.carrots.clear();
      for (let index = 0; index < count; index += 1) {
        const carrot = createCarrot(`mini-${index}`, false, 0.56).root;
        const column = index % 3;
        const row = Math.floor(index / 3);
        carrot.position.set((column - 1) * 0.32, 0.58 + row * 0.18, (row % 2) * 0.14 - 0.05);
        carrot.rotation.z = (column - 1) * 0.12;
        basket.carrots.add(carrot);
      }
    }

    function createGardenBed() {
      const root = new THREE.Group();
      const soil = new THREE.Mesh(
        new THREE.BoxGeometry(4.8, 0.24, 2.15),
        material(colors.soil)
      );
      soil.position.set(0.35, 0.05, 0.9);
      soil.receiveShadow = true;
      root.add(soil);
      [-2.05, 2.75].forEach((x) => {
        const edge = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.42, 2.32),
          material(colors.soilLight)
        );
        edge.position.set(x, 0.15, 0.9);
        edge.castShadow = true;
        root.add(edge);
      });
      return root;
    }

    function addCloud(x, y, z, scale) {
      const cloud = new THREE.Group();
      const cloudMaterial = material(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.08 });
      [[-0.55, 0, 0.58], [0, 0.18, 0.82], [0.62, -0.03, 0.56]].forEach(([cx, cy, size]) => {
        const puff = sphere(size, cloudMaterial, 18, 12);
        puff.scale.z = 0.48;
        puff.position.set(cx, cy, 0);
        cloud.add(puff);
      });
      cloud.position.set(x, y, z);
      cloud.scale.setScalar(scale);
      world.add(cloud);
    }

    function addTree(x, z, scale) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.34, 2, 12), material(colors.basketDark));
      trunk.position.y = 1;
      trunk.castShadow = true;
      tree.add(trunk);
      [[0, 2.25, 0, 0.95], [-0.58, 2.05, 0.04, 0.72], [0.58, 2.05, -0.08, 0.72]].forEach(([lx, ly, lz, size]) => {
        const leaf = sphere(size, material(colors.grassDark), 20, 14);
        leaf.position.set(lx, ly, lz);
        tree.add(leaf);
      });
      tree.position.set(x, 0, z);
      tree.scale.setScalar(scale);
      world.add(tree);
    }

    function addFence() {
      const fence = new THREE.Group();
      for (let index = 0; index < 7; index += 1) {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.95, 0.14),
          material(colors.cream)
        );
        post.position.set(-2.9 + index * 0.95, 0.48, -2.15);
        post.castShadow = true;
        fence.add(post);
      }
      [0.35, 0.68].forEach((y) => {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(6.0, 0.12, 0.12),
          material(colors.cream)
        );
        rail.position.set(-0.05, y, -2.15);
        rail.castShadow = true;
        fence.add(rail);
      });
      world.add(fence);
    }

    function addFlowers() {
      const positions = [[-4.7, 1.5], [-4.1, 2.2], [-2.6, -1.7], [3.7, -1.7], [4.7, 1.7], [3.0, 2.45]];
      positions.forEach(([x, z], flowerIndex) => {
        const flower = new THREE.Group();
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.42, 8), material(colors.leaf));
        stem.position.y = 0.2;
        flower.add(stem);
        const center = sphere(0.08, material(colors.yellow), 12, 8);
        center.position.y = 0.46;
        flower.add(center);
        for (let index = 0; index < 5; index += 1) {
          const angle = index / 5 * Math.PI * 2;
          const petal = sphere(0.08, material(flowerIndex % 2 ? colors.pink : 0xffffff), 12, 8);
          petal.scale.set(0.72, 1.22, 0.45);
          petal.position.set(Math.cos(angle) * 0.13, 0.46 + Math.sin(angle) * 0.13, 0);
          petal.rotation.z = angle - Math.PI / 2;
          flower.add(petal);
        }
        flower.position.set(x, 0, z);
        world.add(flower);
      });
    }

    function taskDetails() {
      return taskCopyForRound(round)[stage];
    }

    function setStage(nextStage, announce = true) {
      global.clearTimeout(transitionTimer);
      transitionToken += 1;
      stage = Math.max(0, Math.min(TASK_IDS.length - 1, nextStage));
      complete = false;
      locked = false;
      reminderCount = 0;
      countRoot.visible = stage === 0;
      choiceRoot.visible = stage === 1 || stage === 2;
      addRoot.visible = stage === 3;

      if (stage === 0) {
        countProgress = 0;
        setBasketCount(countBasket, 0);
        fieldCarrots.forEach((carrot) => {
          carrot.position.copy(carrot.userData.home);
          carrot.rotation.set(0, 0, 0);
          carrot.scale.setScalar(carrot.userData.baseScale || 1);
          carrot.userData.collected = false;
          carrot.visible = true;
        });
      } else if (stage === 1) {
        setBasketCount(leftBasket, round.exactLeft);
        setBasketCount(rightBasket, round.exactRight);
        resetBasketPose(leftBasket.root, -0.55);
        resetBasketPose(rightBasket.root, 2.15);
      } else if (stage === 2) {
        setBasketCount(leftBasket, round.moreLeft);
        setBasketCount(rightBasket, round.moreRight);
        resetBasketPose(leftBasket.root, -0.55);
        resetBasketPose(rightBasket.root, 2.15);
      } else {
        setBasketCount(addBasket, round.addBase);
        addCarrot.root.position.copy(addCarrot.root.userData.home);
        addCarrot.root.rotation.set(0, 0, 0);
        addCarrot.root.scale.setScalar(addCarrot.root.userData.baseScale || 1.18);
        addCarrot.root.visible = true;
      }

      const task = taskDetails();
      options.onTask?.({ ...task, stage, total: TASK_IDS.length, max: round.max, announce });
    }

    function resetBasketPose(root, x) {
      root.position.set(x, 0.08, 0.9);
      root.rotation.set(0, 0, 0);
      root.scale.setScalar(1);
    }

    function handlePointerUp(event) {
      if (!active || locked || complete) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(interactiveMeshes.filter(isVisibleInScene), false);
      const key = hits[0]?.object?.userData?.key;
      if (key) selectTarget(key);
    }

    function handleKeyDown(event) {
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      if (stage === 0) {
        const carrot = fieldCarrots.find((item) => !item.userData.collected);
        if (carrot) selectTarget(carrot.userData.key);
      } else if (stage === 1) {
        selectTarget(round.exactCorrect);
      } else if (stage === 2) {
        selectTarget(round.moreCorrect);
      } else {
        selectTarget("add");
      }
    }

    function selectTarget(key) {
      if (!active || locked || complete) return false;
      if (stage === 0) return collectCarrot(key);
      if (stage === 1) return chooseBasket(key, round.exactCorrect, "exact");
      if (stage === 2) return chooseBasket(key, round.moreCorrect, "more");
      if (stage === 3 && key === "add") return addOne();
      return false;
    }

    function collectCarrot(key) {
      const carrot = targetRoots.get(key);
      if (!key.startsWith("carrot") || !carrot || carrot.userData.collected) return false;
      carrot.userData.collected = true;
      countProgress += 1;
      moveCarrotToBasket(carrot, countProgress - 1);
      const done = countProgress >= round.countTarget;
      options.onStatus?.(
        done ? `剛剛好，摘到 ${countProgress} 根了！` : `摘了 ${countProgress} 根，再找一根`,
        done ? "correct" : "counting"
      );
      const narration = options.speak?.(done
        ? [`現在有${NUMBER_WORDS[countProgress]}根。`, "剛好是我們要的數量。"]
        : [`現在有${NUMBER_WORDS[countProgress]}根。`, `還差${NUMBER_WORDS[round.countTarget - countProgress]}根，我們再找一根。`], {
        kind: done ? "result" : "progress",
        stage,
        taskId: TASK_IDS[stage]
      });
      if (done) {
        locked = true;
        bunnyJump();
        scheduleNext(reduceMotion ? 420 : 900, narration);
      }
      return true;
    }

    function chooseBasket(key, expected, scoredTask) {
      if (!["left", "right"].includes(key)) return false;
      const root = targetRoots.get(key);
      if (key !== expected) {
        if (scoredTask === "exact") exactFirstTry = false;
        if (scoredTask === "more") moreFirstTry = false;
        wiggle(root);
        pulseGlow(targetRoots.get(expected));
        countBasketItems();
        reminderCount += 1;
        options.onStatus?.("看看正在發光的籃子，我們再數一次", "try-again");
        if (reminderCount === 1) {
          options.speak?.(["兩邊的數量不一樣。", "看它們亮一亮，我們再數一次。"], {
            kind: "retry",
            stage,
            taskId: TASK_IDS[stage]
          });
        }
        return false;
      }

      locked = true;
      bounce(root);
      bunnyJump();
      let narration;
      if (stage === 1) {
        options.onStatus?.(`這裡有 ${round.exactTarget} 根，數量剛剛好`, "correct");
        narration = options.speak?.([`這裡有${NUMBER_WORDS[round.exactTarget]}根。`, "和我們要找的數量一樣。"], {
          kind: "result",
          stage,
          taskId: TASK_IDS[stage]
        });
      } else {
        const moreCount = Math.max(round.moreLeft, round.moreRight);
        options.onStatus?.(`這邊有 ${moreCount} 根，比另一邊多`, "correct");
        narration = options.speak?.([`這邊有${NUMBER_WORDS[moreCount]}根。`, "它比另一邊多。"], {
          kind: "result",
          stage,
          taskId: TASK_IDS[stage]
        });
      }
      scheduleNext(reduceMotion ? 430 : 920, narration);
      return true;
    }

    function addOne() {
      locked = true;
      const root = addCarrot.root;
      const start = performance.now();
      const from = root.position.clone();
      const to = new THREE.Vector3(0.25, 0.75 + Math.floor(round.addBase / 3) * 0.12, 0.9);
      animations.push((now) => {
        const duration = reduceMotion ? 360 : 820;
        const raw = Math.min(1, (now - start) / duration);
        const progress = raw * raw * (3 - 2 * raw);
        root.position.lerpVectors(from, to, progress);
        root.rotation.z = progress * Math.PI * 0.45;
        return raw < 1;
      });
      options.onStatus?.(`現在有 ${round.addResult} 根了！`, "correct");
      const narration = options.speak?.([`${NUMBER_WORDS[round.addBase]}根，再來一根。`, `現在是${NUMBER_WORDS[round.addResult]}根。`], {
        kind: "result",
        stage,
        taskId: TASK_IDS[stage]
      });
      bunnyJump();
      scheduleNext(reduceMotion ? 500 : 1080, narration);
      return true;
    }

    function scheduleNext(wait, narration) {
      global.clearTimeout(transitionTimer);
      const token = ++transitionToken;
      const minimum = new Promise((resolve) => {
        transitionTimer = global.setTimeout(resolve, wait);
      });
      const narrationWait = narration && typeof narration.then === "function"
        ? Promise.race([
          Promise.resolve(narration).catch(() => null),
          new Promise((resolve) => global.setTimeout(resolve, 8000))
        ])
        : Promise.resolve();
      Promise.all([minimum, narrationWait]).then(() => {
        if (token !== transitionToken) return;
        if (stage < TASK_IDS.length - 1) setStage(stage + 1, true);
        else finish();
      });
    }

    function finish() {
      complete = true;
      locked = false;
      const summary = {
        firstTryCorrect: Number(exactFirstTry) + Number(moreFirstTry),
        scoredTasks: 2,
        stable: exactFirstTry && moreFirstTry,
        round: { ...round }
      };
      let progress;
      if (!completionReported) {
        completionReported = true;
        progress = options.onComplete?.(summary);
      }
      options.onCompleteUi?.({ ...summary, ...(progress || {}) });
    }

    function moveCarrotToBasket(root, index) {
      const start = performance.now();
      const from = root.position.clone();
      const target = new THREE.Vector3(
        countBasket.root.position.x + ((index % 3) - 1) * 0.26,
        0.72 + Math.floor(index / 3) * 0.14,
        countBasket.root.position.z + (index % 2) * 0.08
      );
      animations.push((now) => {
        const duration = reduceMotion ? 260 : 620;
        const raw = Math.min(1, (now - start) / duration);
        const progress = raw * raw * (3 - 2 * raw);
        root.position.lerpVectors(from, target, progress);
        root.position.y += Math.sin(progress * Math.PI) * (reduceMotion ? 0.08 : 0.7);
        root.rotation.z = progress * 0.25;
        return raw < 1;
      });
    }

    function countBasketItems() {
      [leftBasket, rightBasket].forEach((basket, basketIndex) => {
        [...basket.carrots.children].forEach((carrot, itemIndex) => {
          const start = performance.now() + (basketIndex * 2 + itemIndex) * (reduceMotion ? 20 : 70);
          const baseY = carrot.position.y;
          animations.push((now) => {
            if (now < start) return true;
            const progress = Math.min(1, (now - start) / (reduceMotion ? 160 : 360));
            carrot.position.y = baseY + Math.sin(progress * Math.PI) * (reduceMotion ? 0.05 : 0.18);
            if (progress >= 1) {
              carrot.position.y = baseY;
              return false;
            }
            return true;
          });
        });
      });
    }

    function wiggle(root) {
      const start = performance.now();
      const originalX = root.position.x;
      animations.push((now) => {
        const progress = Math.min(1, (now - start) / (reduceMotion ? 220 : 440));
        root.position.x = originalX + Math.sin(progress * Math.PI * 6) * (1 - progress) * 0.15;
        if (progress >= 1) {
          root.position.x = originalX;
          return false;
        }
        return true;
      });
    }

    function pulseGlow(root) {
      if (!root) return;
      const materials = [];
      root.traverse((object) => {
        const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
        objectMaterials.filter((item) => item?.emissive).forEach((item) => {
          materials.push({ material: item, intensity: item.emissiveIntensity });
        });
      });
      const start = performance.now();
      animations.push((now) => {
        const progress = Math.min(1, (now - start) / (reduceMotion ? 360 : 900));
        const glow = Math.sin(progress * Math.PI) * 0.7;
        materials.forEach(({ material, intensity }) => {
          material.emissiveIntensity = intensity + glow;
        });
        if (progress >= 1) {
          materials.forEach(({ material, intensity }) => { material.emissiveIntensity = intensity; });
        }
        return progress < 1;
      });
    }

    function bounce(root) {
      const start = performance.now();
      const baseY = root.position.y;
      animations.push((now) => {
        const progress = Math.min(1, (now - start) / (reduceMotion ? 260 : 700));
        root.position.y = baseY + Math.sin(progress * Math.PI) * (reduceMotion ? 0.08 : 0.38);
        const pulse = 1 + Math.sin(progress * Math.PI) * 0.1;
        root.scale.setScalar(pulse);
        if (progress >= 1) {
          root.position.y = baseY;
          root.scale.setScalar(1);
          return false;
        }
        return true;
      });
    }

    function bunnyJump() {
      const start = performance.now();
      const baseY = 0.05;
      bunnyJumping = true;
      animations.push((now) => {
        const progress = Math.min(1, (now - start) / (reduceMotion ? 260 : 760));
        bunny.root.position.y = baseY + Math.sin(progress * Math.PI) * (reduceMotion ? 0.08 : 0.33);
        bunny.root.rotation.z = Math.sin(progress * Math.PI * 2) * (reduceMotion ? 0 : 0.04);
        if (progress >= 1) {
          bunny.root.position.y = baseY;
          bunny.root.rotation.z = 0;
          bunnyJumping = false;
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
      camera.fov = phonePortrait ? 40 : tabletPortrait ? 38 : 35;
      camera.position.set(
        0,
        phonePortrait ? 5.25 : tabletPortrait ? 5.0 : 4.75,
        phonePortrait ? 15.9 : tabletPortrait ? 14.6 : 12.2
      );
      camera.lookAt(0, 1.52, 0);
      camera.updateProjectionMatrix();
      world.scale.setScalar(phonePortrait ? 0.79 : tabletPortrait ? 0.91 : 1);
      world.position.y = phonePortrait ? 0.27 : tabletPortrait ? 0.13 : 0;
      bunny.root.position.x = phonePortrait ? -2.42 : tabletPortrait ? -2.62 : -3.25;
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
        if (!bunnyJumping) bunny.root.position.y = 0.05 + Math.sin(now * 0.0022) * 0.025;
        bunny.head.rotation.z = Math.sin(now * 0.0011) * 0.025;
        if (stage === 0 && !locked) {
          fieldCarrots.forEach((carrot, index) => {
            if (!carrot.userData.collected) carrot.rotation.z = Math.sin(now * 0.002 + index) * 0.035;
          });
        }
        if (stage === 3 && !locked) addCarrot.root.rotation.y += delta * 0.34;
      }
      renderer.render(scene, camera);
      frameId = global.requestAnimationFrame(tick);
    }

    function start(startOptions = {}) {
      active = true;
      lastTime = performance.now();
      resize();
      global.cancelAnimationFrame(frameId);
      frameId = global.requestAnimationFrame(tick);
      const task = taskDetails();
      options.onTask?.({ ...task, stage, total: TASK_IDS.length, max: round.max, announce: startOptions.announce !== false });
    }

    function pause() {
      active = false;
      global.cancelAnimationFrame(frameId);
      renderer.render(scene, camera);
    }

    function reset() {
      global.clearTimeout(transitionTimer);
      transitionToken += 1;
      animations.length = 0;
      completionReported = false;
      exactFirstTry = true;
      moreFirstTry = true;
      complete = false;
      round = makeRound(options.getLevel?.(), options.getRound?.());
      setStage(0, true);
      if (!active) start({ announce: false });
    }

    function destroy() {
      pause();
      global.clearTimeout(transitionTimer);
      transitionToken += 1;
      resizeObserver?.disconnect();
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("keydown", handleKeyDown);
      renderer.dispose();
      host.replaceChildren();
    }

    function getScreenPoint(key) {
      const root = targetRoots.get(key);
      if (!root || !isVisibleInScene(root)) return null;
      const worldPosition = new THREE.Vector3();
      root.getWorldPosition(worldPosition);
      worldPosition.project(camera);
      const rect = renderer.domElement.getBoundingClientRect();
      return {
        x: rect.left + (worldPosition.x + 1) * rect.width / 2,
        y: rect.top + (1 - worldPosition.y) * rect.height / 2,
        inFrame: Math.abs(worldPosition.x) <= 0.94 && Math.abs(worldPosition.y) <= 0.94
      };
    }

    function isVisibleInScene(object) {
      let current = object;
      while (current) {
        if (current.visible === false) return false;
        current = current.parent;
      }
      return true;
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
      const bunnyPoint = new THREE.Vector3();
      bunny.root.getWorldPosition(bunnyPoint);
      const visibleTargets = stage === 0
        ? fieldCarrots.filter((item) => !item.userData.collected).map((item) => item.userData.key)
        : stage === 1 || stage === 2
          ? ["left", "right"]
          : ["add"];
      return {
        supported: true,
        stage,
        complete,
        active,
        locked,
        task: TASK_IDS[stage],
        countProgress,
        round: { ...round },
        firstTry: { exact: exactFirstTry, more: moreFirstTry },
        canvas: {
          width: renderer.domElement.width,
          height: renderer.domElement.height,
          cssWidth: Math.round(renderer.domElement.getBoundingClientRect().width),
          cssHeight: Math.round(renderer.domElement.getBoundingClientRect().height)
        },
        targets: Object.fromEntries(visibleTargets.map((key) => [key, getScreenPoint(key)])),
        bunnyFrame: projectedBounds(bunny.root),
        bunnyY: Number(bunnyPoint.y.toFixed(4)),
        animationCount: animations.length,
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

  global.BunnyMathGarden3D = {
    create: createMathGarden,
    taskCount: TASK_IDS.length,
    revision: THREE?.REVISION || null,
    makeRound,
    taskCopy: (level, seed) => taskCopyForRound(makeRound(level, seed))
  };
})(window);
