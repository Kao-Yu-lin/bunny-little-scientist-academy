(function (global) {
  "use strict";

  const THREE = global.THREE;
  const TASKS = [
    {
      id: "red",
      target: "red",
      prompt: "兔兔想找紅色球",
      hint: "小手碰一碰紅色球",
      speech: ["兔兔想找紅色球。", "小手碰一碰！"]
    },
    {
      id: "big",
      target: "yellow",
      prompt: "哪一顆球比較大？",
      hint: "碰一碰比較大的球",
      speech: ["哪一顆球比較大呢？", "碰一碰！"]
    },
    {
      id: "roll",
      target: "green",
      prompt: "幫小球滾下斜坡",
      hint: "碰斜坡上面的綠色球",
      speech: ["綠色小球在上面。", "碰一下，看它往下滾。"]
    }
  ];

  function unsupportedController(options) {
    const showFallback = () => {
      options.fallback.hidden = false;
      options.host.hidden = true;
      options.onStatus?.("這台裝置暫時不能顯示 3D，兔兔先用圖卡陪你玩。", "fallback");
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

  function createPlayroom(options) {
    if (!THREE || !options?.host) return unsupportedController(options || {});

    const host = options.host;
    const fallback = options.fallback;
    const reduceMotion = global.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
    const clock = new THREE.Clock();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const interactiveMeshes = [];
    const targetRoots = new Map();
    const animations = [];
    const colors = {
      sky: 0xbfe9f4,
      grass: 0x83c982,
      grassDark: 0x4e9b69,
      white: 0xfffcf8,
      cream: 0xfff1d5,
      pink: 0xf58dab,
      dark: 0x40364b,
      red: 0xef6d67,
      yellow: 0xf3c94f,
      blue: 0x5ea7dc,
      green: 0x68b77d,
      wood: 0xc98c5b,
      ramp: 0xffc98d
    };

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true
      });
    } catch (error) {
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
    renderer.domElement.setAttribute("aria-label", "可觸控的 3D 兔兔遊樂場");
    renderer.domElement.setAttribute("role", "application");
    renderer.domElement.tabIndex = 0;
    host.replaceChildren(renderer.domElement);
    host.hidden = false;
    if (fallback) fallback.hidden = true;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x5b8d63, 2.4);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff4db, 4.2);
    sun.position.set(-5, 9, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -7;
    sun.shadow.camera.right = 7;
    sun.shadow.camera.top = 7;
    sun.shadow.camera.bottom = -3;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xd7e9ff, 1.25);
    fill.position.set(6, 4, 5);
    scene.add(fill);

    const world = new THREE.Group();
    scene.add(world);

    const island = new THREE.Mesh(
      new THREE.CylinderGeometry(7.2, 7.7, 0.45, 56),
      toonMaterial(colors.grass)
    );
    island.position.y = -0.25;
    island.receiveShadow = true;
    world.add(island);

    const path = new THREE.Mesh(
      new THREE.CircleGeometry(3.1, 48, 0.18, Math.PI * 0.82),
      toonMaterial(0xf7e7bd)
    );
    path.rotation.x = -Math.PI / 2;
    path.position.set(0.4, 0.006, 0.2);
    path.receiveShadow = true;
    world.add(path);

    addCloud(-4.5, 5.2, -3.6, 1.05);
    addCloud(4.7, 5.7, -4.8, 0.86);
    addTree(-5.1, -1.6, 0.92);
    addTree(5.1, -2.5, 0.78);
    addFlowers();

    const bunny = createBunny();
    bunny.root.position.set(-3.15, 0.05, 0.3);
    bunny.root.rotation.y = -0.08;
    world.add(bunny.root);

    const ballData = [
      { key: "red", color: colors.red, position: [-1.35, 0.56, 1.08] },
      { key: "yellow", color: colors.yellow, position: [0.25, 0.56, 1.05] },
      { key: "blue", color: colors.blue, position: [1.85, 0.56, 0.98] }
    ];

    ballData.forEach((item) => {
      const ball = createBall(item.key, item.color);
      ball.position.set(...item.position);
      world.add(ball);
      targetRoots.set(item.key, ball);
    });

    const ramp = createRamp();
    ramp.root.visible = false;
    world.add(ramp.root);
    targetRoots.set("green", ramp.ball);

    let stage = 0;
    let complete = false;
    let active = false;
    let locked = false;
    let completionReported = false;
    let bunnyJumping = false;
    let frameId = 0;
    let resizeObserver;
    let lastTime = performance.now();

    setStage(0, false);
    resize();
    renderer.render(scene, camera);

    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("keydown", handleKeyDown);
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    function toonMaterial(color, options = {}) {
      return new THREE.MeshStandardMaterial({
        color,
        roughness: options.roughness ?? 0.72,
        metalness: options.metalness ?? 0,
        emissive: options.emissive ?? 0x000000,
        emissiveIntensity: options.emissiveIntensity ?? 0
      });
    }

    function createBall(key, color) {
      const root = new THREE.Group();
      root.userData.key = key;
      root.userData.baseScale = 1;
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.56, 28, 20),
        toonMaterial(color, { roughness: 0.52 })
      );
      ball.castShadow = true;
      ball.receiveShadow = true;
      ball.userData.key = key;
      root.add(ball);
      const shine = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 14, 10),
        toonMaterial(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.12 })
      );
      shine.scale.set(0.72, 1.25, 0.45);
      shine.position.set(-0.19, 0.2, 0.49);
      ball.add(shine);
      interactiveMeshes.push(ball);
      return root;
    }

    function createRamp() {
      const root = new THREE.Group();
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(3.9, 0.18, 1.65),
        toonMaterial(colors.ramp)
      );
      board.position.set(0.65, 1.05, 0.05);
      board.rotation.z = -0.31;
      board.castShadow = true;
      board.receiveShadow = true;
      root.add(board);

      const support = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 1.55, 1.3),
        toonMaterial(colors.wood)
      );
      support.position.set(-0.95, 0.75, -0.08);
      support.castShadow = true;
      root.add(support);

      const ball = createBall("green", colors.green);
      ball.position.set(-1.05, 1.82, 0.32);
      root.add(ball);
      return { root, ball };
    }

    function createBunny() {
      const root = new THREE.Group();
      const fur = toonMaterial(colors.white);
      const furShade = toonMaterial(colors.cream);
      const pink = toonMaterial(colors.pink);
      const dark = toonMaterial(colors.dark);
      const outfit = toonMaterial(0x6db6ad);

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
      tail.position.set(-0.72, 1.0, -0.48);
      root.add(tail);

      root.traverse((object) => {
        if (object.isMesh) object.castShadow = true;
      });
      return { root, head, body };
    }

    function sphere(radius, material, width = 24, height = 16) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, width, height), material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    }

    function addCloud(x, y, z, scale) {
      const cloud = new THREE.Group();
      const material = toonMaterial(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.08 });
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

    function addFlowers() {
      const positions = [
        [-4.7, 1.4], [-4.2, 2.1], [-2.5, -2.2], [3.8, -2.1], [4.7, 1.7], [2.9, 2.5]
      ];
      positions.forEach(([x, z], index) => {
        const flower = new THREE.Group();
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.42, 8), toonMaterial(colors.grassDark));
        stem.position.y = 0.2;
        flower.add(stem);
        const center = sphere(0.08, toonMaterial(colors.yellow), 12, 8);
        center.position.y = 0.46;
        flower.add(center);
        for (let petalIndex = 0; petalIndex < 5; petalIndex += 1) {
          const angle = petalIndex / 5 * Math.PI * 2;
          const petal = sphere(0.08, toonMaterial(index % 2 ? colors.pink : 0xffffff), 12, 8);
          petal.scale.set(0.72, 1.22, 0.45);
          petal.position.set(Math.cos(angle) * 0.13, 0.46 + Math.sin(angle) * 0.13, 0);
          petal.rotation.z = angle - Math.PI / 2;
          flower.add(petal);
        }
        flower.position.set(x, 0, z);
        world.add(flower);
      });
    }

    function setStage(nextStage, announce = true) {
      stage = Math.max(0, Math.min(TASKS.length - 1, nextStage));
      complete = false;
      locked = false;
      ramp.root.visible = stage === 2;

      const red = targetRoots.get("red");
      const yellow = targetRoots.get("yellow");
      const blue = targetRoots.get("blue");
      [red, yellow, blue].forEach((ball) => {
        ball.visible = stage !== 2;
        ball.rotation.set(0, 0, 0);
      });

      if (stage === 0) {
        setBallPose(red, [-1.35, 0.56, 1.08], 1);
        setBallPose(yellow, [0.25, 0.56, 1.05], 1);
        setBallPose(blue, [1.85, 0.56, 0.98], 1);
      } else if (stage === 1) {
        setBallPose(red, [-1.4, 0.43, 1.08], 0.72);
        setBallPose(yellow, [0.25, 0.78, 1.04], 1.38);
        setBallPose(blue, [1.9, 0.5, 0.98], 0.88);
      } else {
        ramp.ball.position.set(-1.05, 1.82, 0.32);
        ramp.ball.scale.setScalar(0.88);
        ramp.ball.userData.baseScale = 0.88;
        ramp.ball.rotation.set(0, 0, 0);
      }

      options.onTask?.({ ...TASKS[stage], stage, total: TASKS.length, announce });
    }

    function setBallPose(ball, position, scale) {
      ball.position.set(...position);
      ball.scale.setScalar(scale);
      ball.userData.baseScale = scale;
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
      selectTarget(TASKS[stage].target);
    }

    function selectTarget(key) {
      if (!active || locked || complete) return false;
      const root = targetRoots.get(key);
      if (!root || !root.visible) return false;
      const expected = TASKS[stage].target;
      if (key !== expected) {
        wiggle(root);
        options.onStatus?.("再找找。兔兔會陪你。", "try-again");
        options.speak?.(["再找找。", "兔兔會陪你。"]);
        return false;
      }

      locked = true;
      options.onStatus?.(stage === 2 ? "小球往下滾了！" : "找到了！", "correct");
      options.speak?.(stage === 0
        ? ["找到了！", "這是紅色球。"]
        : stage === 1
          ? ["找到了！", "黃色球比較大。"]
          : ["滾下來了！", "斜坡讓小球往下走。"]);
      bounce(root);
      bunnyJump();

      if (stage === 2) rollDownRamp(root);
      const wait = reduceMotion ? 480 : (stage === 2 ? 1550 : 980);
      global.setTimeout(() => {
        if (stage < TASKS.length - 1) {
          setStage(stage + 1, true);
        } else {
          finish();
        }
      }, wait);
      return true;
    }

    function finish() {
      complete = true;
      locked = false;
      options.onCompleteUi?.();
      if (!completionReported) {
        completionReported = true;
        options.onComplete?.();
      }
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

    function bounce(root) {
      const start = performance.now();
      const baseY = root.position.y;
      const baseScale = root.userData.baseScale || root.scale.x || 1;
      animations.push((now) => {
        const progress = Math.min(1, (now - start) / (reduceMotion ? 260 : 720));
        root.position.y = baseY + Math.sin(progress * Math.PI) * (reduceMotion ? 0.08 : 0.42);
        const pulse = 1 + Math.sin(progress * Math.PI) * 0.12;
        root.scale.setScalar(baseScale * pulse);
        if (progress >= 1) {
          root.position.y = baseY;
          root.scale.setScalar(baseScale);
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
        const progress = Math.min(1, (now - start) / (reduceMotion ? 260 : 780));
        bunny.root.position.y = baseY + Math.sin(progress * Math.PI) * (reduceMotion ? 0.08 : 0.34);
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

    function rollDownRamp(root) {
      const start = performance.now();
      const from = new THREE.Vector3(-1.05, 1.82, 0.32);
      const to = new THREE.Vector3(2.4, 0.52, 0.32);
      animations.push((now) => {
        const duration = reduceMotion ? 420 : 1250;
        const raw = Math.min(1, (now - start) / duration);
        const progress = raw * raw * (3 - 2 * raw);
        root.position.lerpVectors(from, to, progress);
        root.rotation.z -= reduceMotion ? 0.05 : 0.18;
        return raw < 1;
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
      camera.fov = phonePortrait ? 40 : tabletPortrait ? 38 : 34;
      camera.position.set(
        0,
        phonePortrait ? 5.2 : tabletPortrait ? 5 : 4.7,
        phonePortrait ? 15.8 : tabletPortrait ? 14.5 : 12.1
      );
      camera.lookAt(0, 1.55, 0);
      camera.updateProjectionMatrix();
      world.scale.setScalar(phonePortrait ? 0.8 : tabletPortrait ? 0.92 : 1);
      world.position.y = phonePortrait ? 0.25 : tabletPortrait ? 0.12 : 0;
      bunny.root.position.x = phonePortrait ? -2.45 : tabletPortrait ? -2.6 : -3.15;
      renderer.render(scene, camera);
    }

    function tick(now) {
      if (!active) return;
      const delta = Math.min(0.04, (now - lastTime) / 1000 || clock.getDelta());
      lastTime = now;
      for (let index = animations.length - 1; index >= 0; index -= 1) {
        if (!animations[index](now)) animations.splice(index, 1);
      }
      if (!reduceMotion) {
        if (!bunnyJumping) bunny.root.position.y = 0.05 + Math.sin(now * 0.0022) * 0.025;
        bunny.head.rotation.z = Math.sin(now * 0.0011) * 0.025;
        targetRoots.forEach((root, key) => {
          if (key !== "green" && root.visible && !locked) root.rotation.y += delta * 0.24;
        });
      }
      renderer.render(scene, camera);
      frameId = global.requestAnimationFrame(tick);
    }

    function start(optionsForStart = {}) {
      active = true;
      lastTime = performance.now();
      resize();
      global.cancelAnimationFrame(frameId);
      frameId = global.requestAnimationFrame(tick);
      options.onTask?.({ ...TASKS[stage], stage, total: TASKS.length, announce: optionsForStart.announce !== false });
    }

    function pause() {
      active = false;
      global.cancelAnimationFrame(frameId);
      renderer.render(scene, camera);
    }

    function reset() {
      animations.length = 0;
      completionReported = false;
      complete = false;
      setStage(0, true);
      if (!active) start({ announce: false });
    }

    function destroy() {
      pause();
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

    function getSnapshot() {
      const bunnyPoint = new THREE.Vector3();
      bunny.root.getWorldPosition(bunnyPoint);
      return {
        supported: true,
        stage,
        complete,
        active,
        task: TASKS[stage].id,
        canvas: {
          width: renderer.domElement.width,
          height: renderer.domElement.height,
          cssWidth: Math.round(renderer.domElement.getBoundingClientRect().width),
          cssHeight: Math.round(renderer.domElement.getBoundingClientRect().height)
        },
        targets: Object.fromEntries([...targetRoots.keys()].map((key) => [key, getScreenPoint(key)])),
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
      return {
        colors: unique.size,
        opaqueRatio: opaque / (pixels.length / 16)
      };
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

  global.BunnyPlayroom3D = {
    create: createPlayroom,
    taskCount: TASKS.length,
    revision: THREE?.REVISION || null
  };
})(window);
