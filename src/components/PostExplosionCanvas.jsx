import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

export default function PostExplosionCanvas({
  isEntered,
  mousePos = { x: 0, y: 0 },
  scrollProgress = 0,
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const animFrameIdRef = useRef(null);

  // 3D Objects Refs
  const energyRingsGroupRef = useRef(null);
  const ribbonsGroupRef = useRef(null);
  const particlesGroupRef = useRef(null);
  const shockwaveMeshRef = useRef(null);
  const globeGroupRef = useRef(null);

  // Dynamic animation trackers
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, speed: 0 });
  const lastMousePosRef = useRef({ x: 0, y: 0, time: 0 });
  const scrollAmpRef = useRef(1.0);
  const ribbonGeometriesRef = useRef([]);

  // Sync mouse input from parent
  useEffect(() => {
    mouseRef.current.targetX = mousePos.x;
    mouseRef.current.targetY = mousePos.y;

    // Calculate mouse speed for ring rotation impulse
    const now = performance.now();
    const dt = Math.max(now - lastMousePosRef.current.time, 16);
    const dx = mousePos.x - lastMousePosRef.current.x;
    const dy = mousePos.y - lastMousePosRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    mouseRef.current.speed = Math.min(dist / (dt * 0.05), 3.5);

    lastMousePosRef.current = { x: mousePos.x, y: mousePos.y, time: now };
  }, [mousePos]);

  // Sync scroll amplitude
  useEffect(() => {
    gsap.to(scrollAmpRef, {
      current: 1.0 + scrollProgress * 0.6,
      duration: 0.4,
      ease: 'power2.out',
    });
  }, [scrollProgress]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 10.5);
    cameraRef.current = camera;

    // 3. Renderer with high color fidelity and alpha transparency
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting System (Warm Ivory, Metallic Champagne & Gold)
    const ambientLight = new THREE.AmbientLight(0xfff5e6, 1.3);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff0d0, 2.4);
    keyLight.position.set(5, 7, 6);
    scene.add(keyLight);

    const goldRimLight = new THREE.DirectionalLight(0xd99a35, 2.0);
    goldRimLight.position.set(-6, -3, -3);
    scene.add(goldRimLight);

    const pointLight = new THREE.PointLight(0xffc65c, 2.2, 16);
    pointLight.position.set(0, 1.5, 4);
    scene.add(pointLight);

    // =========================================================================
    // A. EXPANDING SHOCKWAVE ENERGY RING (Cinematic Post-Explosion Entry)
    // =========================================================================
    const shockwaveGeo = new THREE.RingGeometry(0.1, 0.4, 64);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xffc65c),
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const shockwaveMesh = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    shockwaveMesh.position.set(0, 0, 0.5);
    shockwaveMesh.scale.set(0.01, 0.01, 1);
    scene.add(shockwaveMesh);
    shockwaveMeshRef.current = shockwaveMesh;

    // =========================================================================
    // B. CENTRAL GOLDEN ENERGY RINGS (Multiple Concentric 3D Rings)
    // =========================================================================
    const energyRingsGroup = new THREE.Group();
    scene.add(energyRingsGroup);
    energyRingsGroupRef.current = energyRingsGroup;

    // Materials
    const goldRingMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xd99a35),
      emissive: new THREE.Color(0x52360b),
      emissiveIntensity: 0.35,
      metalness: 0.95,
      roughness: 0.16,
      transparent: true,
      opacity: 0.88,
    });

    const champagneRingMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xfff4e3),
      emissive: new THREE.Color(0xffc65c),
      emissiveIntensity: 0.25,
      metalness: 0.35,
      roughness: 0.1,
      transmission: 0.85,
      thickness: 0.6,
      transparent: true,
      opacity: 0.75,
    });

    const thinWireRingMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xffd57a),
      transparent: true,
      opacity: 0.55,
      wireframe: true,
    });

    // Ring specifications: [radius, tubeRadius, mat, rotSpeedX, rotSpeedY, rotSpeedZ, tiltX, tiltY]
    const ringConfigs = [
      { radius: 2.3, tube: 0.024, mat: goldRingMat, rx: 0.003, ry: 0.007, rz: 0.002, tiltX: 0.25, tiltY: 0.15 },
      { radius: 3.1, tube: 0.018, mat: champagneRingMat, rx: -0.004, ry: 0.005, rz: -0.003, tiltX: -0.35, tiltY: 0.4 },
      { radius: 3.8, tube: 0.014, mat: thinWireRingMat, rx: 0.002, ry: -0.006, rz: 0.004, tiltX: 0.45, tiltY: -0.25 },
      { radius: 4.6, tube: 0.022, mat: goldRingMat, rx: -0.003, ry: 0.004, rz: 0.002, tiltX: -0.2, tiltY: 0.55 },
      { radius: 5.4, tube: 0.012, mat: champagneRingMat, rx: 0.002, ry: -0.003, rz: -0.002, tiltX: 0.6, tiltY: -0.3 },
    ];

    const ringMeshes = [];
    ringConfigs.forEach((cfg) => {
      const geo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 24, 120);
      const mesh = new THREE.Mesh(geo, cfg.mat);
      mesh.rotation.x = cfg.tiltX;
      mesh.rotation.y = cfg.tiltY;
      mesh.scale.set(0.01, 0.01, 0.01); // Initial scale for reveal animation
      energyRingsGroup.add(mesh);
      ringMeshes.push({ mesh, cfg, baseTiltX: cfg.tiltX, baseTiltY: cfg.tiltY });
    });

    // =========================================================================
    // C. DYNAMIC GOLDEN WAVE SYSTEM (3D Flowing Liquid Ribbons)
    // =========================================================================
    const ribbonsGroup = new THREE.Group();
    ribbonsGroup.position.set(0, -1.9, 0); // Positioned in lower half across hero
    scene.add(ribbonsGroup);
    ribbonsGroupRef.current = ribbonsGroup;

    // Ribbon Material: Metallic liquid gold with specular luster
    const ribbonMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xd99a35),
      emissive: new THREE.Color(0x3d2806),
      emissiveIntensity: 0.3,
      metalness: 0.94,
      roughness: 0.18,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
    });

    const ribbonConfigs = [
      { yOffset: 0.25, zOffset: 0.4, width: 16.5, height: 0.85, segW: 100, segH: 14, speed: 1.1, freq: 0.45, amp: 0.42, phase: 0 },
      { yOffset: -0.2, zOffset: -0.3, width: 18.0, height: 0.72, segW: 100, segH: 14, speed: 0.85, freq: 0.35, amp: 0.48, phase: 1.8 },
      { yOffset: -0.65, zOffset: 0.65, width: 17.0, height: 0.65, segW: 100, segH: 12, speed: 1.35, freq: 0.52, amp: 0.36, phase: 3.4 },
      { yOffset: -1.05, zOffset: -0.15, width: 19.0, height: 0.55, segW: 100, segH: 10, speed: 0.7, freq: 0.28, amp: 0.52, phase: 4.9 },
    ];

    const ribbons = [];
    ribbonConfigs.forEach((cfg) => {
      const geo = new THREE.PlaneGeometry(cfg.width, cfg.height, cfg.segW, cfg.segH);
      const mesh = new THREE.Mesh(geo, ribbonMaterial.clone());
      mesh.position.set(0, cfg.yOffset, cfg.zOffset);
      mesh.rotation.x = Math.PI * 0.15; // Tilted slightly forward for 3D visibility
      mesh.scale.set(0.01, 0.01, 0.01); // Initial scale for reveal
      ribbonsGroup.add(mesh);

      // Store initial vertices positions
      const originalPositions = geo.attributes.position.clone();
      ribbons.push({ mesh, geo, originalPositions, cfg });
    });
    ribbonGeometriesRef.current = ribbons;

    // Floor Reflection Plane beneath the ribbons
    const floorGeo = new THREE.PlaneGeometry(18, 10);
    const floorMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xffd57a),
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, -3.2, 0);
    scene.add(floorMesh);

    // =========================================================================
    // D. DISSIPATING RESIDUAL EXPLOSION PARTICLES (Floating Golden Sparkles)
    // =========================================================================
    const particlesGroup = new THREE.Group();
    scene.add(particlesGroup);
    particlesGroupRef.current = particlesGroup;

    const particleCount = 70;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleSpeeds = [];

    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = (Math.random() - 0.5) * 16;
      particlePos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 8;

      particleSpeeds.push({
        vx: (Math.random() - 0.5) * 0.008,
        vy: 0.004 + Math.random() * 0.008,
        vz: (Math.random() - 0.5) * 0.006,
        phase: Math.random() * Math.PI * 2,
      });
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

    // Particle Canvas Texture (Soft glowing golden dot)
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 64;
    pCanvas.height = 64;
    const pCtx = pCanvas.getContext('2d');
    const radGrad = pCtx.createRadialGradient(32, 32, 0, 32, 32, 30);
    radGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    radGrad.addColorStop(0.3, 'rgba(255, 210, 92, 0.85)');
    radGrad.addColorStop(0.7, 'rgba(217, 154, 53, 0.35)');
    radGrad.addColorStop(1, 'rgba(217, 154, 53, 0)');
    pCtx.fillStyle = radGrad;
    pCtx.fillRect(0, 0, 64, 64);
    const pTexture = new THREE.CanvasTexture(pCanvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.32,
      map: pTexture,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particlesMesh = new THREE.Points(particleGeo, particleMat);
    particlesGroup.add(particlesMesh);

    // =========================================================================
    // E. RIGHT-SIDE 3D WIREFRAME GLOBE
    // =========================================================================
    const globeGroup = new THREE.Group();
    // Positioned on the right technical interface side
    globeGroup.position.set(6.2, -1.8, 0);
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // 1. Globe wireframe sphere
    const globeGeo = new THREE.SphereGeometry(0.75, 18, 14);
    const globeMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xd99a35),
      wireframe: true,
      transparent: true,
      opacity: 0.38,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // 2. Orbital equatorial ring
    const orbitRingGeo = new THREE.TorusGeometry(1.05, 0.012, 16, 64);
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xffc65c),
      transparent: true,
      opacity: 0.65,
    });
    const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    orbitRing.rotation.x = Math.PI * 0.35;
    globeGroup.add(orbitRing);

    // 3. Small glowing core
    const coreGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xfff4e3),
      transparent: true,
      opacity: 0.8,
    });
    globeGroup.add(new THREE.Mesh(coreGeo, coreMat));

    // =========================================================================
    // F. CINEMATIC ENTRY SEQUENCE (Triggered when isEntered = true)
    // =========================================================================
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Step 1: Expanding shockwave energy ring
    tl.fromTo(
      shockwaveMesh.scale,
      { x: 0.1, y: 0.1, z: 1 },
      {
        x: 28,
        y: 28,
        z: 1,
        duration: 1.8,
        ease: 'power2.out',
      },
      0
    ).to(
      shockwaveMat,
      {
        opacity: 0,
        duration: 1.6,
        ease: 'power2.in',
      },
      0.2
    );

    // Step 2: Concentric Energy Rings scale in gracefully
    ringMeshes.forEach((r, idx) => {
      tl.to(
        r.mesh.scale,
        {
          x: 1,
          y: 1,
          z: 1,
          duration: 1.4,
          ease: 'back.out(1.2)',
        },
        0.3 + idx * 0.12
      );
    });

    // Step 3: Flowing Metallic Ribbons expand from center outward
    ribbons.forEach((rb, idx) => {
      tl.to(
        rb.mesh.scale,
        {
          x: 1,
          y: 1,
          z: 1,
          duration: 1.5,
          ease: 'power3.out',
        },
        0.5 + idx * 0.1
      );
    });

    // Step 4: Globe entrance
    tl.fromTo(
      globeGroup.scale,
      { x: 0.01, y: 0.01, z: 0.01 },
      { x: 1, y: 1, z: 1, duration: 1.2, ease: 'back.out(1.4)' },
      0.7
    );

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      cameraRef.current.aspect = w / h;

      if (w < 640) {
        cameraRef.current.position.z = 13.5;
        if (globeGroupRef.current) globeGroupRef.current.position.set(0, -3.8, 0);
      } else if (w < 1024) {
        cameraRef.current.position.z = 11.8;
        if (globeGroupRef.current) globeGroupRef.current.position.set(4.8, -2.1, 0);
      } else {
        cameraRef.current.position.z = 10.5;
        if (globeGroupRef.current) globeGroupRef.current.position.set(6.2, -1.8, 0);
      }

      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // =========================================================================
    // G. REAL-TIME RENDER LOOP
    // =========================================================================
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.06;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.06;

      // Parallax on entire scene
      camera.position.x = mouseRef.current.x * 0.55;
      camera.position.y = mouseRef.current.y * 0.45;
      camera.lookAt(0, 0, 0);

      const speedMultiplier = 1.0 + mouseRef.current.speed * 0.9;

      // 1. Rotate Concentric Energy Rings
      if (energyRingsGroupRef.current) {
        ringMeshes.forEach(({ mesh, cfg, baseTiltX, baseTiltY }) => {
          mesh.rotation.x = baseTiltX + Math.sin(elapsedTime * 0.8 + cfg.radius) * 0.12 + mouseRef.current.y * 0.2;
          mesh.rotation.y = baseTiltY + (elapsedTime * cfg.ry * 50) * speedMultiplier;
          mesh.rotation.z += cfg.rz * speedMultiplier;
        });

        // Subtle group drift toward mouse
        energyRingsGroupRef.current.position.x = mouseRef.current.x * 0.35;
        energyRingsGroupRef.current.position.y = mouseRef.current.y * 0.25;
      }

      // 2. Animate Dynamic 3D Liquid Gold Ribbons (Deform Geometry in real-time)
      const currentScrollAmp = scrollAmpRef.current;
      ribbons.forEach(({ geo, originalPositions, cfg }) => {
        const posAttr = geo.attributes.position;
        const origArray = originalPositions.array;
        const currentArray = posAttr.array;
        const count = posAttr.count;

        const ribbonSpeed = cfg.speed * (1.0 + mouseRef.current.speed * 0.25);
        const t = elapsedTime * ribbonSpeed + cfg.phase;

        for (let i = 0; i < count; i++) {
          const idx = i * 3;
          const x = origArray[idx];
          const y = origArray[idx + 1];

          // Harmonic wave equation (flowing left to right)
          const wave1 = Math.sin(x * cfg.freq - t) * (cfg.amp * currentScrollAmp);
          const wave2 = Math.cos(x * cfg.freq * 1.8 + t * 0.7) * (cfg.amp * 0.35 * currentScrollAmp);
          const wave3 = Math.sin(y * 1.5 + t * 1.2) * 0.12;

          // Mouse proximity ripple
          const distToMouse = Math.abs(x - mouseRef.current.x * 6.0);
          const mouseRipple = Math.exp(-distToMouse * 0.8) * Math.sin(t * 3.5) * 0.25;

          // Displace along Y and Z to give rich 3D curvature
          currentArray[idx + 1] = y + wave1 + wave2 + mouseRipple;
          currentArray[idx + 2] = (wave1 * 0.7 - wave2 * 0.5 + wave3) * 1.2;
        }

        posAttr.needsUpdate = true;
        geo.computeVertexNormals();
      });

      // 3. Animate Ambient Residual Sparkles
      if (particlesMesh) {
        const positions = particleGeo.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
          const idx = i * 3;
          const spd = particleSpeeds[i];

          positions[idx] += spd.vx;
          positions[idx + 1] += spd.vy;
          positions[idx + 2] += spd.vz;

          // Recycle particle if out of view
          if (positions[idx + 1] > 6) {
            positions[idx + 1] = -5.5;
            positions[idx] = (Math.random() - 0.5) * 16;
          }

          // Subtle harmonic float
          positions[idx] += Math.sin(elapsedTime + spd.phase) * 0.002;
        }
        particleGeo.attributes.position.needsUpdate = true;
      }

      // 4. Animate Right-Side 3D Wireframe Globe
      if (globeGroupRef.current) {
        globeMesh.rotation.y += 0.008;
        globeMesh.rotation.x = Math.sin(elapsedTime * 0.5) * 0.1;
        orbitRing.rotation.z += 0.005;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      tl.kill();
    };
  }, [isEntered]);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 5,
        pointerEvents: 'none',
      }}
    />
  );
}
