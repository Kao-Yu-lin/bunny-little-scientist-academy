(function (global) {
  "use strict";

  const THREE = global.THREE;
  const ROUTINE_IDS = ["wash", "tidy", "outing"];
  const ROUTINES = {
    wash: {
      id: "wash",
      icon: "🫧",
      label: "洗手泡泡",
      parent: "網站示範用水、肥皂搓洗、沖洗與擦乾的順序；請成人陪同使用安全水溫與清潔用品，不讓幼兒單獨操作。",
      retell: ["先用水。", "接著用肥皂搓一搓。", "最後沖乾淨、擦乾。"],
      practice: "和大人一起用安全水溫洗手；成人協助控制水量與肥皂。",
      tasks: [
        {
          id: "wet",
          target: "wash-faucet",
          prompt: "先打開水",
          hint: "現在只要：輕碰正在發光的水龍頭",
          speech: ["水龍頭在這裡。", "洗手的第一步，是先把手弄濕。"],
          result: "水流下來，小手濕了",
          resultSpeech: ["水流下來了。", "小手先變濕。"]
        },
        {
          id: "soap",
          target: "wash-soap",
          prompt: "接著按一下肥皂",
          hint: "現在只要：輕碰正在發光的肥皂瓶",
          speech: ["小手已經濕了。", "接著按肥皂，泡泡就會來。"],
          result: "泡泡出來了，小手搓一搓",
          resultSpeech: ["泡泡出來了。", "手心和手背都要輕輕搓。"]
        },
        {
          id: "rinse",
          target: "rinse-faucet",
          prompt: "把泡泡沖乾淨",
          hint: "現在只要：輕碰正在發光的水龍頭",
          speech: ["手心手背都搓過了。", "接著用水把泡泡沖走。"],
          result: "水把泡泡沖走了",
          resultSpeech: ["水把泡泡沖走了。", "小手乾乾淨淨。"]
        },
        {
          id: "dry",
          target: "wash-towel",
          prompt: "最後用毛巾擦乾",
          hint: "現在只要：輕碰正在發光的小毛巾",
          speech: ["泡泡都不見了。", "最後用毛巾把手擦乾。"],
          result: "小手擦乾了",
          resultSpeech: ["小手擦乾了。", "洗手的四個步驟都完成了。"]
        }
      ]
    },
    tidy: {
      id: "tidy",
      icon: "🧺",
      label: "玩具回家",
      parent: "練習把積木、書本與玩偶依位置歸位。請使用不易吞食的大型玩具，成人先排除尖銳、破損或沉重物品。",
      retell: ["先收積木。", "接著把書放上架。", "最後讓玩偶回籃子。"],
      practice: "挑三件安全的大玩具，成人說一個位置，孩子一次只收一件。",
      tasks: [
        {
          id: "blocks",
          target: "tidy-blocks",
          prompt: "先讓積木回盒子",
          hint: "現在只要：輕碰正在發光的大積木",
          speech: ["地上有幾顆積木。", "先送它們回盒子。"],
          result: "積木一個一個進盒子",
          resultSpeech: ["積木收進盒子了。", "地板空出來了。"]
        },
        {
          id: "book",
          target: "tidy-book",
          prompt: "接著把書放上架",
          hint: "現在只要：輕碰正在發光的故事書",
          speech: ["地板空了一點。", "接著讓故事書站回書架。"],
          result: "書本立在書架上",
          resultSpeech: ["故事書站回書架了。", "下次就容易找到。"]
        },
        {
          id: "bear",
          target: "tidy-bear",
          prompt: "最後讓玩偶回籃子",
          hint: "現在只要：輕碰正在發光的小熊玩偶",
          speech: ["只剩小熊還在外面。", "最後送它回籃子休息。"],
          result: "小熊坐進籃子裡",
          resultSpeech: ["小熊坐進籃子裡了。", "三樣玩具都回到位置了。"]
        }
      ]
    },
    outing: {
      id: "outing",
      icon: "🎒",
      label: "安心出門",
      parent: "示範穿鞋、準備背包與門口停下等大人的順序。幼兒不可自行開門或外出，成人仍需全程看顧並依實際環境調整。",
      retell: ["先穿鞋。", "接著背好小包包。", "最後在門口等大人。"],
      practice: "出門前一次說一個步驟；到門口停下，由成人牽手或依家庭安全規則同行。",
      tasks: [
        {
          id: "shoes",
          target: "outing-shoes",
          prompt: "先穿好鞋子",
          hint: "現在只要：輕碰正在發光的小鞋子",
          speech: ["我們要準備出門了。", "第一步先把兩隻鞋穿好。"],
          result: "鞋子穿到腳上了",
          resultSpeech: ["鞋子穿好了。", "兩隻腳都準備好。"]
        },
        {
          id: "bag",
          target: "outing-bag",
          prompt: "接著背好小包包",
          hint: "現在只要：輕碰正在發光的小背包",
          speech: ["鞋子穿好了。", "接著背上自己的小包包。"],
          result: "背包背好了",
          resultSpeech: ["小包包背好了。", "自己的東西準備好了。"]
        },
        {
          id: "wait",
          target: "outing-stop",
          prompt: "最後在門口停一下",
          hint: "現在只要：輕碰正在發光的停一停圖案",
          speech: ["東西都準備好了。", "到門口先停下來等大人。"],
          result: "兔兔停下來等大人",
          resultSpeech: ["兔兔停下來了。", "等大人一起出門。"]
        }
      ]
    }
  };

  function normalizeRoutine(value) {
    return ROUTINE_IDS.includes(value) ? value : ROUTINE_IDS[0];
  }

  function routineForRound(roundValue) {
    const round = Math.max(0, Math.floor(Number(roundValue) || 0));
    return ROUTINE_IDS[round % ROUTINE_IDS.length];
  }

  function routineForDay(dayValue) {
    const digits = String(dayValue || "").replace(/\D/g, "");
    const day = Math.max(0, Number(digits) || 0);
    return ROUTINE_IDS[day % ROUTINE_IDS.length];
  }

  function publicRoutineContract() {
    return Object.fromEntries(ROUTINE_IDS.map((routineId) => {
      const routine = ROUTINES[routineId];
      return [routineId, {
        id: routine.id,
        icon: routine.icon,
        label: routine.label,
        parent: routine.parent,
        retell: [...routine.retell],
        practice: routine.practice,
        tasks: routine.tasks.map((task) => ({ ...task, speech: [...task.speech], resultSpeech: [...task.resultSpeech] }))
      }];
    }));
  }

  function unsupportedController(options) {
    const showFallback = () => {
      if (options.fallback) options.fallback.hidden = false;
      if (options.host) options.host.hidden = true;
      options.onStatus?.("這台裝置暫時不能顯示 3D，請大人陪兔兔用生活圖卡慢慢做。", "fallback");
    };
    showFallback();
    return {
      supported: false,
      start: showFallback,
      pause() {},
      reset: showFallback,
      destroy() {},
      getSnapshot() { return { supported: false, routine: normalizeRoutine(options.getRoutine?.()), stage: 0, complete: false }; },
      getScreenPoint() { return null; },
      selectTarget() { return false; },
      samplePixels() { return Promise.resolve({ colors: 0, opaqueRatio: 0 }); }
    };
  }

  function createLifeHouse(options) {
    if (!THREE || !options?.host) return unsupportedController(options || {});

    const host = options.host;
    const fallback = options.fallback;
    const reduceMotion = global.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const interactiveMeshes = [];
    const targetRoots = new Map();
    const stageSpecs = new Map();
    const animations = [];
    const colors = {
      sky: 0xf4e8ef,
      grass: 0xb9dfc4,
      grassDark: 0x66a87a,
      white: 0xfffcfa,
      cream: 0xffefd6,
      pink: 0xf39bb8,
      coral: 0xf2786d,
      dark: 0x44384d,
      mint: 0x68b8a9,
      blue: 0x59a9dc,
      blueLight: 0x9dddf1,
      yellow: 0xf5cf58,
      orange: 0xf3a04c,
      purple: 0x8c7bc3,
      wood: 0xb77a50,
      silver: 0xdce9ed,
      stone: 0x7f8793,
      wall: 0xfff5ef,
      floor: 0xd8b28d,
      floorLight: 0xf2d5b4,
      aqua: 0x67c9ca,
      navy: 0x4d5f81,
      red: 0xe96d68
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
    renderer.domElement.className = "playroom-canvas life-house-canvas";
    renderer.domElement.setAttribute("aria-label", "可觸控的兔兔 3D 生活小屋");
    renderer.domElement.setAttribute("role", "application");
    renderer.domElement.tabIndex = 0;
    host.replaceChildren(renderer.domElement);
    host.hidden = false;
    if (fallback) fallback.hidden = true;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8c6b70, 2.7));
    const sun = new THREE.DirectionalLight(0xfff2d8, 4.35);
    sun.position.set(-5, 9, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -7;
    sun.shadow.camera.right = 7;
    sun.shadow.camera.top = 7;
    sun.shadow.camera.bottom = -3;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xd9ecff, 1.25);
    fill.position.set(6, 4, 6);
    scene.add(fill);

    const world = new THREE.Group();
    scene.add(world);
    const floor = box(13.5, 0.4, 7.2, material(colors.floorLight));
    floor.position.set(0, -0.25, -0.2);
    floor.receiveShadow = true;
    world.add(floor);
    const backWall = box(13.5, 6.6, 0.35, material(colors.wall));
    backWall.position.set(0, 3.0, -3.55);
    backWall.receiveShadow = true;
    world.add(backWall);
    const rug = cylinder(2.4, 2.65, 0.09, material(0xf3cfbf), 48);
    rug.scale.z = 0.62;
    rug.position.set(-0.2, 0.04, 0.9);
    rug.receiveShadow = true;
    world.add(rug);
    addHouseDecor();

    const bunny = createBunny();
    bunny.root.position.set(-3.45, 0.05, 0.35);
    bunny.root.rotation.y = -0.05;
    world.add(bunny.root);

    const cue = createCue();
    cue.visible = false;
    world.add(cue);

    createWetScene();
    createSoapScene();
    createRinseScene();
    createDryScene();
    createBlocksScene();
    createBookScene();
    createBearScene();
    createShoesScene();
    createBagScene();
    createWaitScene();

    let routine = normalizeRoutine(options.getRoutine?.() || routineForRound(options.getRound?.()));
    let stage = 0;
    let complete = false;
    let active = false;
    let locked = false;
    let completionReported = false;
    let reminderCount = 0;
    let frameId = 0;
    let resizeObserver;
    let transitionTimer = 0;
    let transitionToken = 0;
    let lastTime = performance.now();
    let bunnyJumping = false;

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
        roughness: settings.roughness ?? 0.7,
        metalness: settings.metalness ?? 0,
        emissive: settings.emissive ?? 0x000000,
        emissiveIntensity: settings.emissiveIntensity ?? 0,
        transparent: settings.transparent ?? false,
        opacity: settings.opacity ?? 1,
        depthWrite: settings.depthWrite ?? true,
        side: settings.side ?? THREE.FrontSide
      });
    }

    function sphere(radius, meshMaterial, width = 24, height = 16) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, width, height), meshMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    }

    function box(width, height, depth, meshMaterial) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), meshMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    }

    function cylinder(radiusTop, radiusBottom, height, meshMaterial, segments = 24) {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), meshMaterial);
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
      const outfitBody = sphere(0.68, outfit);
      outfitBody.scale.set(0.9, 0.92, 0.6);
      outfitBody.position.set(0, 0.94, 0.72);
      root.add(outfitBody);

      const head = new THREE.Group();
      head.position.y = 2.34;
      root.add(head);
      const face = sphere(0.86, fur);
      face.scale.set(1, 0.93, 0.9);
      head.add(face);

      [-0.36, 0.36].forEach((x) => {
        const ear = sphere(0.31, fur);
        ear.scale.set(0.76, 2.2, 0.56);
        ear.position.set(x, 0.92, -0.02);
        ear.rotation.z = x < 0 ? 0.08 : -0.08;
        head.add(ear);
        const inner = sphere(0.2, pink);
        inner.scale.set(0.56, 2.0, 0.32);
        inner.position.set(x, 0.94, 0.22);
        inner.rotation.z = ear.rotation.z;
        head.add(inner);
      });

      [-0.31, 0.31].forEach((x) => {
        const eye = sphere(0.105, dark, 16, 10);
        eye.scale.set(0.78, 1.12, 0.52);
        eye.position.set(x, 0.09, 0.77);
        head.add(eye);
        const shine = sphere(0.032, material(0xffffff), 10, 8);
        shine.position.set(x - 0.025, 0.135, 0.855);
        head.add(shine);
        const cheek = sphere(0.13, pink, 16, 10);
        cheek.scale.set(1.25, 0.58, 0.3);
        cheek.position.set(x * 1.35, -0.2, 0.77);
        head.add(cheek);
      });
      const nose = sphere(0.07, pink, 12, 8);
      nose.scale.set(1.05, 0.75, 0.6);
      nose.position.set(0, -0.06, 0.88);
      head.add(nose);
      const smile = new THREE.Mesh(
        new THREE.TorusGeometry(0.13, 0.022, 8, 20, Math.PI),
        material(colors.dark)
      );
      smile.position.set(0, -0.17, 0.88);
      smile.rotation.z = Math.PI;
      head.add(smile);

      [-0.82, 0.82].forEach((x) => {
        const arm = sphere(0.27, fur);
        arm.scale.set(0.72, 1.45, 0.72);
        arm.position.set(x, 1.15, 0.25);
        arm.rotation.z = x < 0 ? -0.24 : 0.24;
        root.add(arm);
        const foot = sphere(0.34, fur);
        foot.scale.set(1.35, 0.58, 1.0);
        foot.position.set(x * 0.55, 0.28, 0.33);
        root.add(foot);
      });

      const flowerCenter = sphere(0.1, material(colors.yellow), 12, 8);
      flowerCenter.position.set(-0.64, 2.83, 0.55);
      root.add(flowerCenter);
      for (let index = 0; index < 5; index += 1) {
        const angle = index / 5 * Math.PI * 2;
        const petal = sphere(0.09, material(colors.coral), 12, 8);
        petal.scale.set(0.7, 1.2, 0.45);
        petal.position.set(-0.64 + Math.cos(angle) * 0.15, 2.83 + Math.sin(angle) * 0.15, 0.52);
        petal.rotation.z = angle - Math.PI / 2;
        root.add(petal);
      }
      return { root, head };
    }

    function createCue() {
      const root = new THREE.Group();
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.72, 0.065, 10, 36),
        new THREE.MeshBasicMaterial({ color: 0xffe070, transparent: true, opacity: 0.95, depthTest: false })
      );
      root.add(ring);
      [-0.72, 0.72].forEach((x, index) => {
        const sparkle = new THREE.Mesh(
          new THREE.OctahedronGeometry(index ? 0.14 : 0.18, 0),
          new THREE.MeshBasicMaterial({ color: index ? 0xffffff : 0xffd24c, depthTest: false })
        );
        sparkle.position.set(x, index ? 0.45 : -0.42, 0.04);
        root.add(sparkle);
      });
      root.renderOrder = 30;
      return root;
    }

    function registerTarget(key, root, radius = 0.85, offset = new THREE.Vector3()) {
      const proxy = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 14, 10),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
      );
      proxy.position.copy(offset);
      proxy.userData.key = key;
      root.add(proxy);
      interactiveMeshes.push(proxy);
      root.userData.key = key;
      root.userData.cueOffset = offset.clone();
      targetRoots.set(key, root);
    }

    function makeStageRoot(taskId) {
      const root = new THREE.Group();
      root.visible = false;
      world.add(root);
      return root;
    }

    function addStage(taskId, root, reset, effect) {
      stageSpecs.set(taskId, { root, reset, effect });
    }

    function addHouseDecor() {
      const windowRoot = new THREE.Group();
      const view = box(2.25, 1.55, 0.08, material(0xbfe8ef, { emissive: 0x87c7d4, emissiveIntensity: 0.08 }));
      windowRoot.add(view);
      const frameMaterial = material(colors.white);
      const top = box(2.55, 0.14, 0.16, frameMaterial);
      const bottom = top.clone();
      top.position.y = 0.86;
      bottom.position.y = -0.86;
      const left = box(0.14, 1.85, 0.16, frameMaterial);
      const right = left.clone();
      left.position.x = -1.2;
      right.position.x = 1.2;
      const crossX = box(0.1, 1.55, 0.15, frameMaterial);
      const crossY = box(2.25, 0.1, 0.15, frameMaterial);
      windowRoot.add(top, bottom, left, right, crossX, crossY);
      windowRoot.position.set(-4.45, 3.25, -3.32);
      world.add(windowRoot);

      const picture = box(1.35, 1.12, 0.1, material(0xd8f0f3));
      picture.position.set(0.2, 3.45, -3.3);
      world.add(picture);
      const pictureFrameMaterial = material(colors.wood);
      const pictureTop = box(1.55, 0.12, 0.15, pictureFrameMaterial);
      const pictureBottom = pictureTop.clone();
      pictureTop.position.set(0.2, 4.06, -3.2);
      pictureBottom.position.set(0.2, 2.84, -3.2);
      const pictureLeft = box(0.12, 1.32, 0.15, pictureFrameMaterial);
      const pictureRight = pictureLeft.clone();
      pictureLeft.position.set(-0.55, 3.45, -3.2);
      pictureRight.position.set(0.95, 3.45, -3.2);
      world.add(pictureTop, pictureBottom, pictureLeft, pictureRight);
      const pictureSun = sphere(0.26, material(colors.yellow), 16, 10);
      pictureSun.position.set(0.05, 3.58, -3.2);
      world.add(pictureSun);
      const pictureHill = sphere(0.42, material(colors.grass), 18, 10);
      pictureHill.scale.set(1.1, 0.42, 0.2);
      pictureHill.position.set(0.32, 3.12, -3.18);
      world.add(pictureHill);

      const clockFace = cylinder(0.52, 0.52, 0.12, material(colors.cream), 30);
      clockFace.rotation.x = Math.PI / 2;
      clockFace.position.set(4.6, 4.0, -3.25);
      world.add(clockFace);
      const clockHand = box(0.05, 0.34, 0.05, material(colors.dark));
      clockHand.position.set(4.6, 4.1, -3.16);
      clockHand.rotation.z = 0.45;
      world.add(clockHand);

      const lamp = cylinder(0.7, 1.0, 0.8, material(colors.yellow), 24);
      lamp.position.set(0, 5.7, -0.8);
      lamp.rotation.x = Math.PI;
      world.add(lamp);
    }

    function createWaterDropGroup() {
      const root = new THREE.Group();
      const waterMaterial = material(colors.blueLight, { transparent: true, opacity: 0.82 });
      for (let index = 0; index < 6; index += 1) {
        const drop = sphere(0.08 + (index % 2) * 0.02, waterMaterial, 12, 8);
        drop.scale.y = 1.45;
        drop.position.set((index % 2 ? 0.08 : -0.08), -index * 0.15, 0);
        root.add(drop);
      }
      return root;
    }

    function createBubbleGroup() {
      const root = new THREE.Group();
      const bubbleMaterial = material(0xe7fbff, {
        transparent: true,
        opacity: 0.75,
        emissive: 0x9ddff0,
        emissiveIntensity: 0.16
      });
      const positions = [
        [-0.48, 0.02, 0.08, 0.15], [-0.2, 0.28, 0.14, 0.2], [0.08, 0.05, 0.18, 0.18],
        [0.37, 0.27, 0.12, 0.14], [0.5, -0.08, 0.04, 0.2], [-0.12, -0.22, 0.22, 0.13]
      ];
      positions.forEach(([x, y, z, radius]) => {
        const bubble = sphere(radius, bubbleMaterial, 14, 9);
        bubble.position.set(x, y, z);
        root.add(bubble);
      });
      return root;
    }

    function createWashBase(root, settings = {}) {
      const cabinet = box(3.25, 1.35, 1.45, material(colors.aqua));
      cabinet.position.set(1.15, 0.7, -0.05);
      root.add(cabinet);
      const handleLeft = box(0.42, 0.08, 0.09, material(colors.silver));
      const handleRight = handleLeft.clone();
      handleLeft.position.set(0.45, 0.9, 0.71);
      handleRight.position.set(1.85, 0.9, 0.71);
      root.add(handleLeft, handleRight);

      const basin = cylinder(1.18, 1.36, 0.34, material(colors.white), 36);
      basin.scale.z = 0.62;
      basin.position.set(1.15, 1.48, 0.02);
      root.add(basin);
      const basinWater = cylinder(0.92, 0.92, 0.05, material(colors.blueLight, { transparent: true, opacity: 0.76 }), 36);
      basinWater.scale.z = 0.58;
      basinWater.position.set(1.15, 1.67, 0.03);
      root.add(basinWater);

      const faucet = new THREE.Group();
      const faucetMaterial = material(colors.silver, { metalness: 0.45, roughness: 0.28 });
      const stem = cylinder(0.12, 0.16, 0.82, faucetMaterial, 18);
      stem.position.y = 0.38;
      const spout = cylinder(0.1, 0.1, 0.72, faucetMaterial, 18);
      spout.rotation.z = Math.PI / 2;
      spout.position.set(0.3, 0.75, 0);
      const handle = box(0.5, 0.12, 0.18, faucetMaterial);
      handle.position.set(-0.05, 0.88, 0);
      faucet.add(stem, spout, handle);
      faucet.position.set(1.15, 1.62, -0.52);
      root.add(faucet);

      const hands = new THREE.Group();
      [-0.34, 0.34].forEach((x) => {
        const hand = sphere(0.28, material(colors.cream), 18, 12);
        hand.scale.set(1.2, 0.55, 0.72);
        hand.position.set(x, 0, 0);
        hands.add(hand);
      });
      hands.position.set(1.15, 1.82, 0.72);
      root.add(hands);

      const stream = createWaterDropGroup();
      stream.position.set(1.45, 2.27, -0.5);
      stream.visible = settings.water === true;
      root.add(stream);

      const bubbles = createBubbleGroup();
      bubbles.position.set(1.15, 1.87, 0.83);
      bubbles.visible = settings.bubbles === true;
      root.add(bubbles);

      const soap = new THREE.Group();
      const bottle = box(0.48, 0.78, 0.42, material(colors.pink));
      bottle.position.y = 0.38;
      const pump = box(0.46, 0.1, 0.16, material(colors.white));
      pump.position.set(0.08, 0.83, 0);
      soap.add(bottle, pump);
      soap.position.set(2.75, 1.45, 0.35);
      root.add(soap);

      const towel = new THREE.Group();
      const cloth = box(0.82, 1.05, 0.12, material(colors.yellow));
      cloth.rotation.z = 0.06;
      towel.add(cloth);
      towel.position.set(3.15, 1.8, 0.3);
      root.add(towel);
      return { faucet, handle, stream, hands, bubbles, soap, pump, towel };
    }

    function createWetScene() {
      const root = makeStageRoot("wet");
      const wash = createWashBase(root);
      registerTarget("wash-faucet", wash.faucet, 0.82, new THREE.Vector3(0.2, 0.34, 0.1));
      addStage("wet", root, () => {
        wash.stream.visible = false;
        wash.handle.rotation.z = 0;
      }, () => {
        wash.stream.visible = true;
        wash.handle.rotation.z = -0.28;
        pulseObject(wash.hands, 0.08);
      });
    }

    function createSoapScene() {
      const root = makeStageRoot("soap");
      const wash = createWashBase(root);
      registerTarget("wash-soap", wash.soap, 0.8, new THREE.Vector3(0, 0.36, 0));
      addStage("soap", root, () => {
        wash.bubbles.visible = false;
        wash.soap.position.set(2.75, 1.45, 0.35);
      }, () => {
        wash.bubbles.visible = true;
        const from = wash.soap.position.clone();
        animateMove(wash.soap, from, from.clone().add(new THREE.Vector3(0, -0.16, 0)), 420, 0, 0, () => {
          wash.soap.position.copy(from);
        });
        swirlHands(wash.hands);
      });
    }

    function createRinseScene() {
      const root = makeStageRoot("rinse");
      const wash = createWashBase(root, { bubbles: true });
      registerTarget("rinse-faucet", wash.faucet, 0.82, new THREE.Vector3(0.2, 0.34, 0.1));
      addStage("rinse", root, () => {
        wash.stream.visible = false;
        wash.bubbles.visible = true;
        wash.bubbles.scale.setScalar(1);
        wash.handle.rotation.z = 0;
      }, () => {
        wash.stream.visible = true;
        wash.handle.rotation.z = -0.28;
        const start = performance.now();
        animations.push((now) => {
          const progress = Math.min(1, (now - start) / (reduceMotion ? 300 : 1050));
          wash.bubbles.scale.setScalar(Math.max(0.01, 1 - progress));
          if (progress >= 1) wash.bubbles.visible = false;
          return progress < 1;
        });
      });
    }

    function createDryScene() {
      const root = makeStageRoot("dry");
      const wash = createWashBase(root);
      const home = wash.towel.position.clone();
      registerTarget("wash-towel", wash.towel, 0.9);
      addStage("dry", root, () => {
        wash.towel.position.copy(home);
        wash.towel.rotation.set(0, 0, 0);
      }, () => {
        animateMove(wash.towel, home, new THREE.Vector3(1.18, 2.0, 1.05), reduceMotion ? 380 : 900, 0.35);
        pulseObject(wash.hands, 0.1);
      });
    }

    function createOpenBin(color = colors.coral) {
      const bin = new THREE.Group();
      const mat = material(color);
      const bottom = box(1.45, 0.18, 1.1, mat);
      bottom.position.y = 0.1;
      const front = box(1.45, 0.78, 0.16, mat);
      front.position.set(0, 0.48, 0.48);
      const back = front.clone();
      back.position.z = -0.48;
      const sideLeft = box(0.16, 0.78, 0.9, mat);
      const sideRight = sideLeft.clone();
      sideLeft.position.set(-0.65, 0.48, 0);
      sideRight.position.set(0.65, 0.48, 0);
      bin.add(bottom, front, back, sideLeft, sideRight);
      return bin;
    }

    function addTidyBackdrop(root) {
      const shelf = new THREE.Group();
      const shelfMaterial = material(colors.wood);
      [-1.0, 0, 1.0].forEach((y) => {
        const board = box(2.45, 0.16, 0.65, shelfMaterial);
        board.position.y = y;
        shelf.add(board);
      });
      [-1.12, 1.12].forEach((x) => {
        const side = box(0.16, 2.18, 0.65, shelfMaterial);
        side.position.set(x, 0, 0);
        shelf.add(side);
      });
      shelf.position.set(2.45, 1.25, -1.25);
      root.add(shelf);
      return shelf;
    }

    function createBlocksScene() {
      const root = makeStageRoot("blocks");
      addTidyBackdrop(root);
      const bin = createOpenBin(colors.mint);
      bin.position.set(2.5, 0.12, 0.9);
      root.add(bin);
      const blocks = new THREE.Group();
      const blockColors = [colors.coral, colors.blue, colors.yellow];
      const blockMeshes = [];
      const homes = [];
      blockColors.forEach((color, index) => {
        const block = box(0.58, 0.58, 0.58, material(color));
        block.position.set((index - 1) * 0.65, index === 1 ? 0.2 : 0, (index % 2) * 0.22);
        block.rotation.y = index * 0.18;
        blocks.add(block);
        blockMeshes.push(block);
        homes.push(block.position.clone());
      });
      blocks.position.set(0.55, 0.34, 0.8);
      root.add(blocks);
      registerTarget("tidy-blocks", blocks, 1.25, new THREE.Vector3(0, 0.25, 0));
      addStage("blocks", root, () => {
        blockMeshes.forEach((block, index) => {
          block.position.copy(homes[index]);
          block.rotation.set(0, index * 0.18, 0);
        });
      }, () => {
        blockMeshes.forEach((block, index) => {
          const from = homes[index].clone();
          const targetLocal = new THREE.Vector3(
            2.15 + index * 0.22 - blocks.position.x,
            0.72 + index * 0.1 - blocks.position.y,
            0.85 - blocks.position.z
          );
          animateMove(block, from, targetLocal, reduceMotion ? 360 : 820, 0.55, index * 150);
        });
      });
    }

    function createBookScene() {
      const root = makeStageRoot("book");
      addTidyBackdrop(root);
      const book = new THREE.Group();
      const cover = box(0.95, 1.18, 0.18, material(colors.purple));
      const pages = box(0.78, 1.02, 0.2, material(colors.cream));
      pages.position.z = 0.06;
      book.add(cover, pages);
      const home = new THREE.Vector3(0.65, 0.82, 0.85);
      book.position.copy(home);
      book.rotation.z = -0.16;
      root.add(book);
      registerTarget("tidy-book", book, 0.95);
      addStage("book", root, () => {
        book.position.copy(home);
        book.rotation.set(0, 0, -0.16);
      }, () => {
        animateMove(book, home, new THREE.Vector3(2.45, 1.76, -0.8), reduceMotion ? 380 : 920, 0.5);
        animateRotation(book, new THREE.Euler(0, 0, 0));
      });
    }

    function createTeddy() {
      const teddy = new THREE.Group();
      const bearMaterial = material(0xbc7d52);
      const body = sphere(0.52, bearMaterial);
      body.scale.set(0.85, 1.08, 0.75);
      body.position.y = 0.55;
      teddy.add(body);
      const head = sphere(0.48, bearMaterial);
      head.position.y = 1.3;
      teddy.add(head);
      [-0.32, 0.32].forEach((x) => {
        const ear = sphere(0.18, bearMaterial);
        ear.position.set(x, 1.64, 0);
        teddy.add(ear);
        const eye = sphere(0.045, material(colors.dark), 10, 7);
        eye.position.set(x * 0.55, 1.36, 0.44);
        teddy.add(eye);
      });
      const muzzle = sphere(0.2, material(colors.cream), 14, 9);
      muzzle.scale.z = 0.55;
      muzzle.position.set(0, 1.18, 0.43);
      teddy.add(muzzle);
      return teddy;
    }

    function createBearScene() {
      const root = makeStageRoot("bear");
      addTidyBackdrop(root);
      const basket = createOpenBin(colors.yellow);
      basket.position.set(2.5, 0.12, 0.9);
      root.add(basket);
      const bear = createTeddy();
      const home = new THREE.Vector3(0.55, 0.18, 0.82);
      bear.position.copy(home);
      root.add(bear);
      registerTarget("tidy-bear", bear, 1.0, new THREE.Vector3(0, 0.8, 0));
      addStage("bear", root, () => {
        bear.position.copy(home);
        bear.rotation.set(0, 0, 0);
      }, () => {
        animateMove(bear, home, new THREE.Vector3(2.5, 0.42, 0.86), reduceMotion ? 400 : 980, 0.6);
        animateRotation(bear, new THREE.Euler(0, 0.12, 0));
      });
    }

    function addEntryBackdrop(root) {
      const frameMaterial = material(colors.wood);
      const door = new THREE.Group();
      const panel = box(2.0, 3.7, 0.22, material(0x8fc3b2));
      panel.position.y = 1.85;
      const topFrame = box(2.35, 0.22, 0.34, frameMaterial);
      topFrame.position.y = 3.85;
      const leftFrame = box(0.22, 4.0, 0.34, frameMaterial);
      const rightFrame = leftFrame.clone();
      leftFrame.position.set(-1.1, 1.9, 0);
      rightFrame.position.set(1.1, 1.9, 0);
      const knob = sphere(0.13, material(colors.yellow), 14, 9);
      knob.position.set(0.72, 1.85, 0.2);
      door.add(panel, topFrame, leftFrame, rightFrame, knob);
      door.position.set(2.65, 0, -2.95);
      root.add(door);
      const mat = box(2.0, 0.1, 1.1, material(0xe5b48d));
      mat.position.set(2.65, 0.06, -1.4);
      root.add(mat);
      return door;
    }

    function createShoesScene() {
      const root = makeStageRoot("shoes");
      addEntryBackdrop(root);
      const shoes = new THREE.Group();
      [-0.42, 0.42].forEach((x) => {
        const shoe = sphere(0.42, material(colors.coral));
        shoe.scale.set(1.2, 0.48, 1.65);
        shoe.position.set(x, 0, 0);
        const sole = box(0.85, 0.12, 0.92, material(colors.white));
        sole.position.set(x, -0.12, 0.08);
        shoes.add(shoe, sole);
      });
      const home = new THREE.Vector3(0.72, 0.38, 0.92);
      shoes.position.copy(home);
      root.add(shoes);
      registerTarget("outing-shoes", shoes, 1.15, new THREE.Vector3(0, 0.12, 0));
      addStage("shoes", root, () => {
        shoes.position.copy(home);
        shoes.scale.setScalar(1);
      }, () => {
        animateMove(shoes, home, new THREE.Vector3(-2.72, 0.38, 0.6), reduceMotion ? 400 : 950, 0.38);
        pulseObject(shoes, 0.12);
      });
    }

    function createBagScene() {
      const root = makeStageRoot("bag");
      addEntryBackdrop(root);
      const bag = new THREE.Group();
      const body = box(0.95, 1.15, 0.5, material(colors.purple));
      body.position.y = 0.35;
      const pocket = box(0.7, 0.45, 0.12, material(colors.pink));
      pocket.position.set(0, 0.15, 0.3);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.06, 8, 20, Math.PI), material(colors.dark));
      handle.position.y = 1.0;
      bag.add(body, pocket, handle);
      const home = new THREE.Vector3(0.8, 0.72, 0.82);
      bag.position.copy(home);
      root.add(bag);
      registerTarget("outing-bag", bag, 1.0, new THREE.Vector3(0, 0.45, 0));
      addStage("bag", root, () => {
        bag.position.copy(home);
        bag.rotation.set(0, 0, 0);
      }, () => {
        animateMove(bag, home, new THREE.Vector3(-2.78, 1.15, 0.05), reduceMotion ? 400 : 950, 0.55);
        animateRotation(bag, new THREE.Euler(0, 0.35, -0.08));
      });
    }

    function createAdultPaw() {
      const paw = new THREE.Group();
      const fur = material(colors.white);
      const sleeve = cylinder(0.34, 0.4, 1.85, material(colors.mint), 18);
      sleeve.rotation.z = Math.PI / 2;
      sleeve.position.x = 0.9;
      paw.add(sleeve);

      const cuff = cylinder(0.42, 0.42, 0.34, material(colors.pink), 18);
      cuff.rotation.z = Math.PI / 2;
      cuff.position.x = 0.04;
      paw.add(cuff);

      const palm = sphere(0.46, fur);
      palm.scale.set(1.08, 0.92, 0.68);
      palm.position.x = -0.42;
      paw.add(palm);

      const padMaterial = material(0xf6a9bd);
      const mainPad = sphere(0.17, padMaterial, 14, 9);
      mainPad.scale.set(1.15, 0.85, 0.35);
      mainPad.position.set(-0.47, -0.06, 0.33);
      paw.add(mainPad);
      [-0.69, -0.45, -0.21].forEach((x, index) => {
        const toe = sphere(0.09, padMaterial, 12, 8);
        toe.scale.set(0.85, 1.05, 0.35);
        toe.position.set(x, 0.2 + (index === 1 ? 0.05 : 0), 0.33);
        paw.add(toe);
      });
      return paw;
    }

    function createWaitScene() {
      const root = makeStageRoot("wait");
      addEntryBackdrop(root);
      const stop = new THREE.Group();
      const sign = cylinder(0.72, 0.72, 0.16, material(colors.red), 8);
      sign.rotation.x = Math.PI / 2;
      const bar = box(0.88, 0.17, 0.12, material(colors.white));
      bar.position.z = 0.1;
      stop.add(sign, bar);
      stop.position.set(1.05, 1.22, 0.68);
      root.add(stop);
      const adultPaw = createAdultPaw();
      adultPaw.position.set(4.15, 1.72, 0.35);
      adultPaw.rotation.z = 0.08;
      adultPaw.visible = false;
      root.add(adultPaw);
      registerTarget("outing-stop", stop, 1.0);
      addStage("wait", root, () => {
        stop.scale.setScalar(1);
        adultPaw.visible = false;
        adultPaw.scale.setScalar(0.1);
      }, () => {
        pulseObject(stop, 0.18);
        adultPaw.visible = true;
        const start = performance.now();
        animations.push((now) => {
          const progress = Math.min(1, (now - start) / (reduceMotion ? 280 : 750));
          const eased = progress * progress * (3 - 2 * progress);
          adultPaw.scale.setScalar(0.1 + eased * 0.9);
          return progress < 1;
        });
      });
    }

    function animateMove(object, from, to, duration, arc = 0.45, delay = 0, onDone) {
      const start = performance.now() + delay;
      animations.push((now) => {
        if (now < start) return true;
        const raw = Math.min(1, (now - start) / duration);
        const progress = raw * raw * (3 - 2 * raw);
        object.position.lerpVectors(from, to, progress);
        object.position.y += Math.sin(progress * Math.PI) * arc;
        if (raw >= 1) onDone?.();
        return raw < 1;
      });
    }

    function animateRotation(object, target) {
      const start = performance.now();
      const from = object.rotation.clone();
      animations.push((now) => {
        const raw = Math.min(1, (now - start) / (reduceMotion ? 280 : 800));
        const progress = raw * raw * (3 - 2 * raw);
        object.rotation.set(
          from.x + (target.x - from.x) * progress,
          from.y + (target.y - from.y) * progress,
          from.z + (target.z - from.z) * progress
        );
        return raw < 1;
      });
    }

    function pulseObject(object, amount = 0.12) {
      const start = performance.now();
      const base = object.scale.clone();
      animations.push((now) => {
        const progress = Math.min(1, (now - start) / (reduceMotion ? 260 : 720));
        const scale = 1 + Math.sin(progress * Math.PI * 2) * amount * (1 - progress);
        object.scale.set(base.x * scale, base.y * scale, base.z * scale);
        if (progress >= 1) object.scale.copy(base);
        return progress < 1;
      });
    }

    function swirlHands(hands) {
      const start = performance.now();
      animations.push((now) => {
        const progress = Math.min(1, (now - start) / (reduceMotion ? 320 : 1050));
        hands.rotation.y = Math.sin(progress * Math.PI * 4) * (reduceMotion ? 0.08 : 0.22);
        hands.position.x = 1.15 + Math.sin(progress * Math.PI * 6) * (reduceMotion ? 0.03 : 0.12);
        if (progress >= 1) {
          hands.rotation.y = 0;
          hands.position.x = 1.15;
        }
        return progress < 1;
      });
    }


    function currentRoutine() {
      return ROUTINES[routine];
    }

    function currentTask() {
      return currentRoutine().tasks[stage];
    }

    function setStage(nextStage, announce = true) {
      global.clearTimeout(transitionTimer);
      transitionToken += 1;
      animations.length = 0;
      stage = Math.max(0, Math.min(currentRoutine().tasks.length - 1, nextStage));
      complete = false;
      locked = false;
      reminderCount = 0;
      stageSpecs.forEach((spec) => { spec.root.visible = false; });
      const task = currentTask();
      const spec = stageSpecs.get(task.id);
      spec.root.visible = true;
      spec.reset();
      attachCue(task.target);
      options.onTask?.({
        ...task,
        speech: [...task.speech],
        resultSpeech: [...task.resultSpeech],
        routine,
        routineLabel: currentRoutine().label,
        routineIcon: currentRoutine().icon,
        parent: currentRoutine().parent,
        stage,
        total: currentRoutine().tasks.length,
        announce
      });
    }

    function attachCue(key) {
      const target = targetRoots.get(key);
      if (!target) {
        cue.visible = false;
        return;
      }
      target.updateWorldMatrix(true, false);
      const position = new THREE.Vector3();
      target.getWorldPosition(position);
      const offset = target.userData.cueOffset || new THREE.Vector3();
      position.add(offset.clone().applyQuaternion(target.getWorldQuaternion(new THREE.Quaternion())));
      world.worldToLocal(position);
      cue.position.copy(position);
      cue.scale.setScalar(1);
      cue.visible = true;
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
      else remindTarget();
    }

    function handleKeyDown(event) {
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      selectTarget(currentTask().target);
    }

    function remindTarget() {
      const task = currentTask();
      options.onStatus?.(task.hint, "ready");
      reminderCount += 1;
      if (reminderCount === 1) {
        options.speak?.(["看看正在發光的那一個。", "兔兔陪你慢慢找。"], {
          kind: "retry",
          stage,
          taskId: task.id
        });
      }
      const start = performance.now();
      animations.push((now) => {
        const raw = Math.min(1, (now - start) / (reduceMotion ? 220 : 520));
        cue.scale.setScalar(1 + Math.sin(raw * Math.PI * 4) * 0.12 * (1 - raw));
        return raw < 1;
      });
      return false;
    }

    function selectTarget(key) {
      if (!active || locked || complete) return false;
      const task = currentTask();
      if (key !== task.target) return remindTarget();
      const spec = stageSpecs.get(task.id);
      locked = true;
      cue.visible = false;
      spec.effect();
      bunnyJump();
      options.onStatus?.(task.result, "observing");
      const narration = options.speak?.([...task.resultSpeech], {
        kind: "result",
        stage,
        taskId: task.id
      });
      scheduleNext(reduceMotion ? 750 : ["soap", "rinse", "blocks", "wait"].includes(task.id) ? 2200 : 1850, narration);
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
        if (stage < currentRoutine().tasks.length - 1) setStage(stage + 1, true);
        else finish();
      });
    }

    function finish() {
      complete = true;
      locked = false;
      cue.visible = false;
      const summary = {
        routine,
        routineLabel: currentRoutine().label,
        steps: currentRoutine().tasks.map((task) => task.id),
        retell: [...currentRoutine().retell],
        practice: currentRoutine().practice,
        parent: currentRoutine().parent
      };
      let progress;
      if (!completionReported) {
        completionReported = true;
        progress = options.onComplete?.(summary);
      }
      options.onCompleteUi?.({ ...summary, ...(progress || {}) });
    }

    function bunnyJump() {
      const start = performance.now();
      const baseY = 0.05;
      bunnyJumping = true;
      animations.push((now) => {
        const progress = Math.min(1, (now - start) / (reduceMotion ? 240 : 720));
        bunny.root.position.y = baseY + Math.sin(progress * Math.PI) * (reduceMotion ? 0.07 : 0.3);
        bunny.root.rotation.z = Math.sin(progress * Math.PI * 2) * (reduceMotion ? 0 : 0.035);
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
      camera.fov = phonePortrait ? 40 : tabletPortrait ? 38 : 36;
      camera.position.set(
        0,
        phonePortrait ? 5.25 : tabletPortrait ? 5.0 : 4.75,
        phonePortrait ? 15.9 : tabletPortrait ? 14.6 : 12.3
      );
      camera.lookAt(0, 1.5, 0);
      camera.updateProjectionMatrix();
      world.scale.setScalar(phonePortrait ? 0.79 : tabletPortrait ? 0.91 : 1);
      world.position.y = phonePortrait ? 0.27 : tabletPortrait ? 0.13 : 0;
      bunny.root.position.x = phonePortrait ? -2.42 : tabletPortrait ? -2.62 : -3.25;
      if (complete || locked) {
        cue.visible = false;
      } else {
        attachCue(currentTask().target);
      }
      renderer.render(scene, camera);
    }

    function tick(now) {
      if (!active) return;
      lastTime = now;
      for (let index = animations.length - 1; index >= 0; index -= 1) {
        if (!animations[index](now)) animations.splice(index, 1);
      }
      if (!reduceMotion) {
        if (!bunnyJumping) bunny.root.position.y = 0.05 + Math.sin(now * 0.0022) * 0.025;
        bunny.head.rotation.z = Math.sin(now * 0.0011) * 0.025;
        if (cue.visible && !locked) {
          cue.scale.setScalar(1 + Math.sin(now * 0.005) * 0.08);
          cue.rotation.z = Math.sin(now * 0.002) * 0.08;
        }
      }
      renderer.render(scene, camera);
      frameId = global.requestAnimationFrame(tick);
    }

    function start(startOptions = {}) {
      const requestedRoutine = startOptions.routine ? normalizeRoutine(startOptions.routine) : null;
      if (requestedRoutine && requestedRoutine !== routine) {
        routine = requestedRoutine;
        stage = 0;
        completionReported = false;
        setStage(0, false);
      }
      active = true;
      lastTime = performance.now();
      resize();
      global.cancelAnimationFrame(frameId);
      frameId = global.requestAnimationFrame(tick);
      const task = currentTask();
      options.onTask?.({
        ...task,
        speech: [...task.speech],
        resultSpeech: [...task.resultSpeech],
        routine,
        routineLabel: currentRoutine().label,
        routineIcon: currentRoutine().icon,
        parent: currentRoutine().parent,
        stage,
        total: currentRoutine().tasks.length,
        announce: startOptions.announce !== false
      });
    }

    function pause() {
      active = false;
      global.cancelAnimationFrame(frameId);
      renderer.render(scene, camera);
    }

    function reset(resetOptions = {}) {
      global.clearTimeout(transitionTimer);
      transitionToken += 1;
      animations.length = 0;
      completionReported = false;
      complete = false;
      routine = normalizeRoutine(resetOptions.routine || options.getRoutine?.() || routineForRound(options.getRound?.()));
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
      scene.updateMatrixWorld(true);
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
      const boxBounds = new THREE.Box3().setFromObject(object);
      const corners = [];
      for (const x of [boxBounds.min.x, boxBounds.max.x]) {
        for (const y of [boxBounds.min.y, boxBounds.max.y]) {
          for (const z of [boxBounds.min.z, boxBounds.max.z]) corners.push(new THREE.Vector3(x, y, z).project(camera));
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
      const task = currentTask();
      const spec = stageSpecs.get(task.id);
      const bunnyPoint = new THREE.Vector3();
      bunny.root.getWorldPosition(bunnyPoint);
      return {
        supported: true,
        reduceMotion,
        routine,
        routineLabel: currentRoutine().label,
        stage,
        complete,
        active,
        locked,
        task: task.id,
        targetKey: task.target,
        target: getScreenPoint(task.target),
        canvas: {
          width: renderer.domElement.width,
          height: renderer.domElement.height,
          cssWidth: Math.round(renderer.domElement.getBoundingClientRect().width),
          cssHeight: Math.round(renderer.domElement.getBoundingClientRect().height)
        },
        bunnyFrame: projectedBounds(bunny.root),
        experimentFrame: projectedBounds(spec.root),
        bunnyY: Number(bunnyPoint.y.toFixed(4)),
        cueVisible: cue.visible,
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

  global.BunnyLifeHouse3D = {
    create: createLifeHouse,
    revision: THREE?.REVISION || null,
    routineIds: [...ROUTINE_IDS],
    routines: publicRoutineContract(),
    normalizeRoutine,
    routineForRound,
    routineForDay
  };
})(window);
