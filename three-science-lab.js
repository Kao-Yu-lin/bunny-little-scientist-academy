(function (global) {
  "use strict";

  const THREE = global.THREE;
  const COURSE_IDS = ["motion", "water", "light"];
  const COURSE_BY_SUBJECT = {
    physics: "motion",
    science: "water",
    quantum: "light"
  };
  const COURSES = {
    motion: {
      id: "motion",
      icon: "🟡",
      label: "重力與運動",
      parent: "觀察重力、斜坡與推力如何改變物體的動作。動畫是可控制的概念模型，不用背公式。",
      tasks: [
        {
          id: "drop",
          target: "drop-ball",
          prompt: "小球會往哪裡走？",
          hint: "現在只要：輕碰正在發光的黃色球",
          speech: ["小球停在高高的地方。", "你猜放開後，它會往哪裡走？"],
          result: "小球掉下來了",
          resultSpeech: ["小球往下掉了。", "地球的重力把它往地面拉。"]
        },
        {
          id: "ramp",
          target: "ramp-ball",
          prompt: "看看小球走哪一條路",
          hint: "現在只要：輕碰斜坡上發光的藍色球",
          speech: ["小球站在斜坡上。", "輕輕碰它，看看它走的路。"],
          result: "小球沿著斜坡往下滾",
          resultSpeech: ["小球沿著斜坡往下滾。", "斜坡改變了它走的方向。"]
        },
        {
          id: "push",
          target: "push-car",
          prompt: "怎麼讓小車動起來？",
          hint: "現在只要：輕碰正在發光的紅色小車",
          speech: ["小車還沒有動。", "輕輕碰一下，看看會發生什麼。"],
          result: "推力讓小車往前走",
          resultSpeech: ["小車往前走了。", "剛才的推力改變了它的動作。"]
        }
      ]
    },
    water: {
      id: "water",
      icon: "💧",
      label: "浮沉與材料",
      parent: "浮沉不是只看大小或重量，也和材料、形狀、排開的水及浮力有關；冰融化則是固態水變成液態水。",
      tasks: [
        {
          id: "float",
          target: "boat",
          prompt: "小船會浮著還是沉下去？",
          hint: "現在只要：輕碰正在發光的小船",
          speech: ["小船要下水了。", "你猜它會浮著，還是沉下去？"],
          result: "小船浮在水面",
          resultSpeech: ["小船留在水面上。", "水向上的托力撐住了它。"]
        },
        {
          id: "sink",
          target: "stone",
          prompt: "石頭也會留在水面嗎？",
          hint: "現在只要：輕碰正在發光的石頭",
          speech: ["換石頭試試看。", "它也會留在水面嗎？"],
          result: "石頭沉到水底",
          resultSpeech: ["石頭沉到水底了。", "它受到的重力比水的托力更大。"]
        },
        {
          id: "melt",
          target: "ice",
          prompt: "冰塊在暖處會怎麼變？",
          hint: "現在只要：輕碰正在發光的冰塊",
          speech: ["冰塊來到暖暖的地方。", "輕輕碰它，看看它會不會改變。"],
          result: "冰慢慢融化成水",
          resultSpeech: ["冰慢慢變成水了。", "周圍的熱讓它融化。"]
        }
      ]
    },
    light: {
      id: "light",
      icon: "✨",
      label: "光影與小光點",
      parent: "前兩幕是幾何光學的光影與反射模型；最後一幕用亮點示意探測事件，不代表肉眼可以看見單一光子在空中飛行。",
      tasks: [
        {
          id: "shadow",
          target: "flashlight",
          prompt: "玩具後面會出現什麼？",
          hint: "現在只要：輕碰正在發光的手電筒",
          speech: ["手電筒還沒打開。", "亮起來後，玩具後面會有什麼？"],
          result: "玩具擋住光，影子出現了",
          resultSpeech: ["玩具後面出現影子。", "因為玩具擋住了一部分光。"]
        },
        {
          id: "reflect",
          target: "mirror",
          prompt: "光碰到鏡子會往哪裡走？",
          hint: "現在只要：輕碰正在發光的銀色鏡子",
          speech: ["這面鏡子正在等光。", "光碰到鏡子後會往哪裡走？"],
          result: "光從鏡面反射到另一邊",
          resultSpeech: ["光轉向另一邊了。", "這叫做反射。"]
        },
        {
          id: "photons",
          target: "star-light",
          prompt: "探測器會怎麼亮？",
          hint: "現在只要：輕碰正在發光的星星燈",
          speech: ["星星燈和探測器準備好了。", "打開燈，看看探測器怎麼亮。"],
          result: "探測器一點一點亮起來",
          resultSpeech: ["探測器一點一點亮起來。", "這是光子抵達的概念模型。"]
        }
      ]
    }
  };

  function normalizeCourse(value) {
    return COURSE_IDS.includes(value) ? value : COURSE_IDS[0];
  }

  function courseForSubject(subject) {
    return COURSE_BY_SUBJECT[subject] || null;
  }

  function courseForRound(roundValue) {
    const round = Math.max(0, Math.floor(Number(roundValue) || 0));
    return COURSE_IDS[round % COURSE_IDS.length];
  }

  function publicCourseContract() {
    return Object.fromEntries(COURSE_IDS.map((courseId) => {
      const course = COURSES[courseId];
      return [courseId, {
        id: course.id,
        label: course.label,
        parent: course.parent,
        tasks: course.tasks.map((task) => ({ ...task, speech: [...task.speech], resultSpeech: [...task.resultSpeech] }))
      }];
    }));
  }

  function unsupportedController(options) {
    const showFallback = () => {
      if (options.fallback) options.fallback.hidden = false;
      if (options.host) options.host.hidden = true;
      options.onStatus?.("這台裝置暫時不能顯示 3D，兔兔先用圖卡陪你做小實驗。", "fallback");
    };
    showFallback();
    return {
      supported: false,
      start: showFallback,
      pause() {},
      reset: showFallback,
      destroy() {},
      getSnapshot() { return { supported: false, course: normalizeCourse(options.getCourse?.()), stage: 0, complete: false }; },
      getScreenPoint() { return null; },
      selectTarget() { return false; },
      samplePixels() { return Promise.resolve({ colors: 0, opaqueRatio: 0 }); }
    };
  }

  function createScienceLab(options) {
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
      sky: 0xd5f2f5,
      grass: 0x90d596,
      grassDark: 0x4e9a6b,
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
      stone: 0x7f8793
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
    renderer.domElement.className = "playroom-canvas science-lab-canvas";
    renderer.domElement.setAttribute("aria-label", "可觸控的兔兔 3D 科學實驗室");
    renderer.domElement.setAttribute("role", "application");
    renderer.domElement.tabIndex = 0;
    host.replaceChildren(renderer.domElement);
    host.hidden = false;
    if (fallback) fallback.hidden = true;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x588d70, 2.5));
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
    const island = new THREE.Mesh(
      new THREE.CylinderGeometry(7.25, 7.8, 0.46, 56),
      material(colors.grass)
    );
    island.position.y = -0.26;
    island.receiveShadow = true;
    world.add(island);

    addCloud(-4.65, 5.25, -4.1, 1.0);
    addCloud(4.8, 5.55, -4.8, 0.82);
    addTree(-5.15, -2.05, 0.82);
    addTree(5.25, -2.55, 0.72);
    addFence();
    addFlowers();
    addLabDecor();

    const bunny = createBunny();
    bunny.root.position.set(-3.25, 0.05, 0.25);
    bunny.root.rotation.y = -0.05;
    world.add(bunny.root);

    const cue = createCue();
    cue.visible = false;
    world.add(cue);

    createDropScene();
    createRampScene();
    createPushScene();
    createFloatScene();
    createSinkScene();
    createMeltScene();
    createShadowScene();
    createReflectScene();
    createPhotonScene();

    let course = normalizeCourse(options.getCourse?.() || courseForRound(options.getRound?.()));
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

    function createDropScene() {
      const root = makeStageRoot("drop");
      const pad = cylinder(1.3, 1.45, 0.32, material(colors.cream));
      pad.position.set(1.05, 0.16, 0.75);
      root.add(pad);
      const target = new THREE.Group();
      target.position.set(1.05, 2.75, 0.78);
      const ball = sphere(0.55, material(colors.yellow, { emissive: 0x6c4d00, emissiveIntensity: 0.08 }));
      target.add(ball);
      const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.045, 8, 30), material(colors.orange));
      stripe.rotation.x = Math.PI / 2;
      target.add(stripe);
      root.add(target);
      registerTarget("drop-ball", target, 0.9);
      addStage("drop", root, () => {
        target.position.set(1.05, 2.75, 0.78);
        target.rotation.set(0, 0, 0);
      }, () => {
        if (reduceMotion) {
          target.position.y = 0.76;
          return;
        }
        const start = performance.now();
        const startY = 2.75;
        const endY = 0.76;
        animations.push((now) => {
          const progress = Math.min(1, (now - start) / 1150);
          if (progress < 0.72) {
            const fall = progress / 0.72;
            target.position.y = startY + (endY - startY) * fall * fall;
          } else {
            const bounceProgress = (progress - 0.72) / 0.28;
            target.position.y = endY + Math.sin(bounceProgress * Math.PI) * 0.3 * (1 - bounceProgress);
          }
          target.rotation.x += 0.08;
          return progress < 1;
        });
      });
    }

    function createRampScene() {
      const root = makeStageRoot("ramp");
      const ramp = box(4.4, 0.25, 1.3, material(colors.coral));
      ramp.position.set(0.75, 1.25, 0.62);
      ramp.rotation.z = -0.29;
      root.add(ramp);
      const highLeg = box(0.24, 1.45, 0.95, material(colors.wood));
      highLeg.position.set(-1.1, 0.7, 0.62);
      root.add(highLeg);
      const lowLeg = box(0.24, 0.55, 0.95, material(colors.wood));
      lowLeg.position.set(2.45, 0.28, 0.62);
      root.add(lowLeg);
      const target = new THREE.Group();
      target.position.set(-1.08, 2.22, 0.68);
      const ball = sphere(0.48, material(colors.blue, { emissive: 0x183c59, emissiveIntensity: 0.08 }));
      target.add(ball);
      const spot = sphere(0.14, material(colors.white), 12, 8);
      spot.position.set(-0.16, 0.15, 0.42);
      target.add(spot);
      root.add(target);
      registerTarget("ramp-ball", target, 0.85);
      addStage("ramp", root, () => {
        target.position.set(-1.08, 2.22, 0.68);
        target.rotation.set(0, 0, 0);
      }, () => {
        if (reduceMotion) {
          target.position.set(2.55, 0.94, 0.68);
          return;
        }
        const start = performance.now();
        const from = new THREE.Vector3(-1.08, 2.22, 0.68);
        const to = new THREE.Vector3(2.55, 0.94, 0.68);
        animations.push((now) => {
          const raw = Math.min(1, (now - start) / 1500);
          const progress = raw * raw;
          target.position.lerpVectors(from, to, progress);
          target.rotation.z -= 0.12;
          return raw < 1;
        });
      });
    }

    function createPushScene() {
      const root = makeStageRoot("push");
      const track = box(4.7, 0.18, 1.25, material(colors.cream));
      track.position.set(0.8, 0.3, 0.72);
      root.add(track);
      [-1.2, -0.2, 0.8, 1.8, 2.8].forEach((x) => {
        const dash = box(0.42, 0.035, 0.08, material(colors.yellow));
        dash.position.set(x, 0.41, 1.36);
        root.add(dash);
      });
      const target = createCar();
      target.position.set(-0.85, 0.78, 0.72);
      root.add(target);
      registerTarget("push-car", target, 1.0, new THREE.Vector3(0, 0.18, 0));
      addStage("push", root, () => {
        target.position.set(-0.85, 0.78, 0.72);
        target.rotation.set(0, 0, 0);
        target.userData.wheels.forEach((wheel) => { wheel.rotation.z = 0; });
      }, () => {
        if (reduceMotion) {
          target.position.x = 2.4;
          return;
        }
        const start = performance.now();
        const fromX = -0.85;
        animations.push((now) => {
          const raw = Math.min(1, (now - start) / 1350);
          const progress = 1 - Math.pow(1 - raw, 2.5);
          target.position.x = fromX + 3.25 * progress;
          target.userData.wheels.forEach((wheel) => { wheel.rotation.z -= 0.16; });
          return raw < 1;
        });
      });
    }

    function createCar() {
      const root = new THREE.Group();
      const body = box(1.35, 0.48, 0.82, material(colors.coral));
      body.position.y = 0.18;
      root.add(body);
      const cab = box(0.62, 0.44, 0.7, material(colors.blueLight));
      cab.position.set(0.18, 0.58, 0);
      root.add(cab);
      const wheels = [];
      [-0.45, 0.45].forEach((x) => {
        [-0.45, 0.45].forEach((z) => {
          const wheel = cylinder(0.22, 0.22, 0.13, material(colors.dark), 18);
          wheel.rotation.x = Math.PI / 2;
          wheel.position.set(x, -0.12, z);
          root.add(wheel);
          wheels.push(wheel);
        });
      });
      root.userData.wheels = wheels;
      return root;
    }

    function createTub() {
      const group = new THREE.Group();
      const base = cylinder(1.75, 1.95, 0.82, material(colors.blueLight, { transparent: true, opacity: 0.72 }));
      base.position.y = 0.47;
      group.add(base);
      const water = cylinder(1.66, 1.66, 0.34, material(colors.blue, { transparent: true, opacity: 0.45, depthWrite: false }));
      water.position.y = 0.91;
      group.add(water);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.78, 0.12, 10, 40), material(colors.white));
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.92;
      group.add(rim);
      group.position.set(1.0, 0, 0.65);
      return group;
    }

    function createBoat() {
      const root = new THREE.Group();
      const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.7, 0.55, 4), material(colors.orange));
      hull.rotation.z = Math.PI / 2;
      hull.rotation.y = Math.PI / 4;
      hull.scale.set(0.8, 1.4, 1);
      root.add(hull);
      const mast = cylinder(0.035, 0.045, 1.0, material(colors.wood), 10);
      mast.position.y = 0.53;
      root.add(mast);
      const sail = new THREE.Mesh(new THREE.ConeGeometry(0.52, 0.85, 3), material(colors.white));
      sail.position.set(0.32, 0.7, 0);
      sail.rotation.z = -0.1;
      root.add(sail);
      return root;
    }

    function createFloatScene() {
      const root = makeStageRoot("float");
      root.add(createTub());
      const target = createBoat();
      target.position.set(1.0, 2.42, 0.7);
      root.add(target);
      registerTarget("boat", target, 0.95, new THREE.Vector3(0, 0.35, 0));
      addStage("float", root, () => {
        target.position.set(1.0, 2.42, 0.7);
        target.rotation.set(0, 0, 0);
      }, () => {
        if (reduceMotion) {
          target.position.y = 1.23;
          return;
        }
        const start = performance.now();
        animations.push((now) => {
          const raw = Math.min(1, (now - start) / 1500);
          const progress = 1 - Math.pow(1 - raw, 2);
          target.position.y = 2.42 + (1.23 - 2.42) * progress + (raw > 0.7 ? Math.sin((raw - 0.7) * Math.PI * 5) * 0.08 * (1 - raw) : 0);
          target.rotation.z = Math.sin(raw * Math.PI * 4) * 0.05 * (1 - raw);
          return raw < 1;
        });
      });
    }

    function createSinkScene() {
      const root = makeStageRoot("sink");
      root.add(createTub());
      const target = new THREE.Group();
      const stone = sphere(0.58, material(colors.stone));
      stone.scale.set(1.05, 0.78, 0.92);
      stone.rotation.set(0.18, 0.25, -0.15);
      target.add(stone);
      const spot = sphere(0.17, material(0xaeb5bd), 12, 8);
      spot.scale.set(1.2, 0.55, 0.35);
      spot.position.set(-0.18, 0.15, 0.47);
      target.add(spot);
      target.position.set(1.0, 2.32, 0.7);
      root.add(target);
      registerTarget("stone", target, 0.9);
      addStage("sink", root, () => {
        target.position.set(1.0, 2.32, 0.7);
        target.rotation.set(0, 0, 0);
      }, () => {
        if (reduceMotion) {
          target.position.y = 0.42;
          return;
        }
        const start = performance.now();
        animations.push((now) => {
          const raw = Math.min(1, (now - start) / 1500);
          const progress = raw * raw * (3 - 2 * raw);
          target.position.y = 2.32 + (0.42 - 2.32) * progress;
          target.rotation.z += 0.025;
          return raw < 1;
        });
      });
    }

    function createMeltScene() {
      const root = makeStageRoot("melt");
      const plate = cylinder(1.55, 1.72, 0.22, material(colors.cream));
      plate.position.set(1.0, 0.3, 0.75);
      root.add(plate);
      const puddle = cylinder(0.9, 1.05, 0.08, material(colors.blueLight, { transparent: true, opacity: 0.75 }));
      puddle.position.set(1.0, 0.46, 0.75);
      puddle.scale.setScalar(0.16);
      root.add(puddle);
      const target = new THREE.Group();
      const iceMaterial = material(0xc8f4ff, { transparent: true, opacity: 0.88, roughness: 0.28 });
      const ice = box(1.12, 1.05, 1.08, iceMaterial);
      ice.rotation.y = 0.16;
      target.add(ice);
      target.position.set(1.0, 1.02, 0.76);
      root.add(target);
      registerTarget("ice", target, 0.95);
      const warmSun = sphere(0.48, material(colors.yellow, { emissive: colors.orange, emissiveIntensity: 0.2 }));
      warmSun.position.set(3.0, 3.1, 0.1);
      root.add(warmSun);
      addStage("melt", root, () => {
        target.position.set(1.0, 1.02, 0.76);
        target.scale.setScalar(1);
        iceMaterial.opacity = 0.88;
        puddle.scale.setScalar(0.16);
      }, () => {
        if (reduceMotion) {
          target.scale.setScalar(0.14);
          iceMaterial.opacity = 0.2;
          puddle.scale.setScalar(1);
          return;
        }
        const start = performance.now();
        animations.push((now) => {
          const raw = Math.min(1, (now - start) / 1800);
          const smooth = raw * raw * (3 - 2 * raw);
          target.scale.set(1 - smooth * 0.82, 1 - smooth * 0.92, 1 - smooth * 0.82);
          target.position.y = 1.02 - smooth * 0.46;
          iceMaterial.opacity = 0.88 - smooth * 0.68;
          puddle.scale.setScalar(0.16 + smooth * 0.84);
          return raw < 1;
        });
      });
    }

    function createFlashlight(color = colors.coral) {
      const root = new THREE.Group();
      const body = cylinder(0.25, 0.34, 1.15, material(color), 20);
      body.rotation.z = Math.PI / 2;
      root.add(body);
      const head = cylinder(0.48, 0.28, 0.42, material(colors.yellow), 24);
      head.rotation.z = Math.PI / 2;
      head.position.x = 0.7;
      root.add(head);
      const lens = cylinder(0.41, 0.41, 0.05, material(0xfff5b5, { emissive: colors.yellow, emissiveIntensity: 0.35 }), 24);
      lens.rotation.z = Math.PI / 2;
      lens.position.x = 0.93;
      root.add(lens);
      return root;
    }

    function createShadowScene() {
      const root = makeStageRoot("shadow");
      const target = createFlashlight();
      target.position.set(-0.1, 1.0, 0.7);
      target.rotation.z = 0.05;
      root.add(target);
      registerTarget("flashlight", target, 1.0, new THREE.Vector3(0.2, 0, 0));
      const toy = box(0.68, 1.2, 0.68, material(colors.purple));
      toy.position.set(1.35, 0.87, 0.7);
      root.add(toy);
      const screen = box(0.16, 2.8, 2.7, material(colors.white));
      screen.position.set(3.25, 1.55, 0.5);
      root.add(screen);
      const beam = new THREE.Mesh(
        new THREE.ConeGeometry(1.22, 3.2, 28, 1, true),
        material(0xfff2a8, { transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide })
      );
      beam.rotation.z = -Math.PI / 2;
      beam.position.set(1.45, 1.03, 0.7);
      beam.visible = false;
      root.add(beam);
      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.72, 28),
        new THREE.MeshBasicMaterial({ color: 0x4f5364, transparent: true, opacity: 0.55 })
      );
      shadow.scale.set(0.7, 1.35, 1);
      shadow.position.set(3.15, 1.1, 0.73);
      shadow.rotation.y = -Math.PI / 2;
      shadow.visible = false;
      root.add(shadow);
      addStage("shadow", root, () => {
        beam.visible = false;
        shadow.visible = false;
        shadow.scale.set(0.7, 1.35, 1);
      }, () => {
        beam.visible = true;
        shadow.visible = true;
        if (reduceMotion) return;
        const start = performance.now();
        animations.push((now) => {
          const raw = Math.min(1, (now - start) / 900);
          const pulse = 0.88 + Math.sin(raw * Math.PI) * 0.12;
          shadow.scale.set(0.7 * pulse, 1.35 * pulse, 1);
          return raw < 1;
        });
      });
    }

    function beamBetween(from, to, radius, color, opacity = 0.8) {
      const start = new THREE.Vector3(...from);
      const end = new THREE.Vector3(...to);
      const direction = end.clone().sub(start);
      const mesh = cylinder(radius, radius, direction.length(), material(color, {
        emissive: color,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity,
        depthWrite: false
      }), 12);
      mesh.position.copy(start).add(end).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      return mesh;
    }

    function createReflectScene() {
      const root = makeStageRoot("reflect");
      const lamp = sphere(0.38, material(colors.yellow, { emissive: colors.orange, emissiveIntensity: 0.45 }));
      lamp.position.set(-0.4, 2.05, 0.7);
      root.add(lamp);
      const target = new THREE.Group();
      const frame = box(1.25, 1.7, 0.15, material(colors.purple));
      target.add(frame);
      const mirror = box(1.03, 1.48, 0.07, material(colors.silver, { metalness: 0.78, roughness: 0.18 }));
      mirror.position.z = 0.1;
      target.add(mirror);
      target.position.set(1.15, 1.3, 0.65);
      target.rotation.y = -0.18;
      root.add(target);
      registerTarget("mirror", target, 1.15);
      const receiver = sphere(0.52, material(colors.mint));
      receiver.position.set(3.15, 2.65, 0.5);
      root.add(receiver);
      const beamIn = beamBetween([-0.05, 1.98, 0.7], [1.05, 1.35, 0.68], 0.055, colors.yellow, 0.82);
      const beamOut = beamBetween([1.18, 1.42, 0.68], [2.92, 2.55, 0.53], 0.055, colors.yellow, 0.82);
      beamIn.visible = false;
      beamOut.visible = false;
      root.add(beamIn, beamOut);
      addStage("reflect", root, () => {
        target.rotation.set(0, -0.18, 0);
        beamIn.visible = false;
        beamOut.visible = false;
        receiver.scale.setScalar(1);
      }, () => {
        beamIn.visible = true;
        beamOut.visible = true;
        if (reduceMotion) {
          target.rotation.y = 0.08;
          receiver.scale.setScalar(1.15);
          return;
        }
        const start = performance.now();
        animations.push((now) => {
          const raw = Math.min(1, (now - start) / 1100);
          target.rotation.y = -0.18 + Math.sin(raw * Math.PI) * 0.26;
          receiver.scale.setScalar(1 + Math.sin(raw * Math.PI * 3) * 0.08);
          if (raw >= 1) receiver.scale.setScalar(1);
          return raw < 1;
        });
      });
    }

    function createPhotonScene() {
      const root = makeStageRoot("photons");
      const target = new THREE.Group();
      const source = sphere(0.5, material(colors.yellow, { emissive: colors.orange, emissiveIntensity: 0.38 }));
      target.add(source);
      for (let index = 0; index < 5; index += 1) {
        const ray = box(0.08, 0.38, 0.08, material(colors.orange));
        const angle = index / 5 * Math.PI * 2;
        ray.position.set(Math.cos(angle) * 0.72, Math.sin(angle) * 0.72, 0);
        ray.rotation.z = angle;
        target.add(ray);
      }
      target.position.set(-0.2, 1.5, 0.7);
      root.add(target);
      registerTarget("star-light", target, 1.0);
      const detectorMaterial = material(colors.silver, { metalness: 0.45, roughness: 0.32, emissive: 0x1d3f55, emissiveIntensity: 0 });
      const detector = box(0.72, 2.1, 1.25, detectorMaterial);
      detector.position.set(3.15, 1.35, 0.65);
      root.add(detector);
      const screen = box(0.12, 1.4, 0.92, material(colors.dark));
      screen.position.set(2.75, 1.35, 0.65);
      root.add(screen);
      const dots = Array.from({ length: 7 }, (_, index) => {
        const dot = sphere(0.12 + (index % 2) * 0.025, material(index % 2 ? colors.white : colors.yellow, {
          emissive: colors.yellow,
          emissiveIntensity: 0.75
        }), 12, 8);
        dot.visible = false;
        dot.position.set(0.35, 1.45 + ((index % 3) - 1) * 0.23, 0.73);
        root.add(dot);
        return dot;
      });
      addStage("photons", root, () => {
        detectorMaterial.emissiveIntensity = 0;
        dots.forEach((dot, index) => {
          dot.visible = false;
          dot.position.set(0.35, 1.45 + ((index % 3) - 1) * 0.23, 0.73);
        });
      }, () => {
        if (reduceMotion) {
          dots.forEach((dot, index) => {
            dot.visible = true;
            dot.position.x = 2.55 - index * 0.12;
          });
          detectorMaterial.emissiveIntensity = 0.55;
          return;
        }
        const start = performance.now();
        animations.push((now) => {
          let finished = true;
          let hits = 0;
          dots.forEach((dot, index) => {
            const raw = Math.max(0, Math.min(1, (now - start - index * 150) / 720));
            if (raw > 0) dot.visible = true;
            const progress = raw * raw * (3 - 2 * raw);
            dot.position.x = 0.35 + 2.25 * progress;
            dot.scale.setScalar(0.85 + Math.sin(raw * Math.PI) * 0.3);
            if (raw < 1) finished = false;
            else hits += 1;
          });
          detectorMaterial.emissiveIntensity = Math.min(0.7, hits * 0.12);
          return !finished;
        });
      });
    }

    function addCloud(x, y, z, scale) {
      const cloud = new THREE.Group();
      [[0, 0, 0.65], [-0.58, -0.08, 0.45], [0.62, -0.08, 0.5]].forEach(([dx, dy, size]) => {
        const puff = sphere(size, material(colors.white), 20, 12);
        puff.position.set(dx, dy, 0);
        cloud.add(puff);
      });
      cloud.position.set(x, y, z);
      cloud.scale.setScalar(scale);
      world.add(cloud);
    }

    function addTree(x, z, scale) {
      const trunk = cylinder(0.18, 0.28, 1.85, material(colors.wood), 12);
      trunk.position.set(x, 0.76, z);
      world.add(trunk);
      const crownMaterial = material(colors.grassDark);
      [[0, 1.8, 0, 0.86], [-0.55, 1.55, 0.05, 0.64], [0.55, 1.57, 0.02, 0.66]].forEach(([dx, y, dz, size]) => {
        const crown = sphere(size, crownMaterial);
        crown.position.set(x + dx * scale, y * scale, z + dz);
        world.add(crown);
      });
    }

    function addFence() {
      const fence = new THREE.Group();
      const fenceMaterial = material(colors.white);
      for (let index = 0; index < 9; index += 1) {
        const post = box(0.12, 0.72, 0.12, fenceMaterial);
        post.position.set(-4 + index, 0.36, -2.9);
        fence.add(post);
      }
      [0.23, 0.55].forEach((y) => {
        const rail = box(8.25, 0.11, 0.1, fenceMaterial);
        rail.position.set(0, y, -2.9);
        fence.add(rail);
      });
      world.add(fence);
    }

    function addFlowers() {
      const positions = [[-4.7, 1.6], [-3.9, 2.25], [-2.45, -1.65], [3.8, -1.6], [4.65, 1.65], [3.1, 2.45]];
      positions.forEach(([x, z], flowerIndex) => {
        const flower = new THREE.Group();
        const stem = cylinder(0.025, 0.035, 0.42, material(colors.grassDark), 8);
        stem.position.y = 0.2;
        flower.add(stem);
        const center = sphere(0.08, material(colors.yellow), 12, 8);
        center.position.y = 0.46;
        flower.add(center);
        for (let index = 0; index < 5; index += 1) {
          const angle = index / 5 * Math.PI * 2;
          const petal = sphere(0.08, material(flowerIndex % 2 ? colors.pink : colors.white), 12, 8);
          petal.scale.set(0.72, 1.22, 0.45);
          petal.position.set(Math.cos(angle) * 0.13, 0.46 + Math.sin(angle) * 0.13, 0);
          petal.rotation.z = angle - Math.PI / 2;
          flower.add(petal);
        }
        flower.position.set(x, 0, z);
        world.add(flower);
      });
    }

    function addLabDecor() {
      const bench = box(3.0, 0.22, 0.72, material(colors.wood));
      bench.position.set(1.0, 0.75, -2.45);
      world.add(bench);
      [-0.2, 0.8, 1.8, 2.4].forEach((x, index) => {
        const bottle = cylinder(0.14, 0.2, 0.55 + (index % 2) * 0.18, material([colors.coral, colors.blue, colors.yellow, colors.purple][index], {
          transparent: true,
          opacity: 0.78
        }), 16);
        bottle.position.set(x, 1.12 + (index % 2) * 0.08, -2.4);
        world.add(bottle);
      });
    }

    function currentCourse() {
      return COURSES[course];
    }

    function currentTask() {
      return currentCourse().tasks[stage];
    }

    function setStage(nextStage, announce = true) {
      global.clearTimeout(transitionTimer);
      transitionToken += 1;
      animations.length = 0;
      stage = Math.max(0, Math.min(currentCourse().tasks.length - 1, nextStage));
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
        course,
        courseLabel: currentCourse().label,
        courseIcon: currentCourse().icon,
        parent: currentCourse().parent,
        stage,
        total: currentCourse().tasks.length,
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
      scheduleNext(reduceMotion ? 750 : task.id === "photons" || task.id === "melt" ? 2400 : 1900, narration);
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
        if (stage < currentCourse().tasks.length - 1) setStage(stage + 1, true);
        else finish();
      });
    }

    function finish() {
      complete = true;
      locked = false;
      cue.visible = false;
      const summary = {
        course,
        courseLabel: currentCourse().label,
        concepts: currentCourse().tasks.map((task) => task.id),
        parent: currentCourse().parent
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
      const requestedCourse = startOptions.course ? normalizeCourse(startOptions.course) : null;
      if (requestedCourse && requestedCourse !== course) {
        course = requestedCourse;
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
        course,
        courseLabel: currentCourse().label,
        courseIcon: currentCourse().icon,
        parent: currentCourse().parent,
        stage,
        total: currentCourse().tasks.length,
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
      course = normalizeCourse(resetOptions.course || options.getCourse?.() || courseForRound(options.getRound?.()));
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
        course,
        courseLabel: currentCourse().label,
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

  global.BunnyScienceLab3D = {
    create: createScienceLab,
    revision: THREE?.REVISION || null,
    courseIds: [...COURSE_IDS],
    courses: publicCourseContract(),
    normalizeCourse,
    courseForSubject,
    courseForRound
  };
})(window);
