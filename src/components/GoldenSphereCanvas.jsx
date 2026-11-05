import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

export default function GoldenSphereCanvas({
  isActive = true,
  isAssembling,
  onAssemblyComplete,
  isHovered,
  holdProgress = 0,
  isExploding = false,
  onExplosionComplete,
  isResetting = false,
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const sphereGroupRef = useRef(null);
  const fragmentsRef = useRef([]);
  const bandsRef = useRef([]);
  const coreRef = useRef(null);
  const coreGeoRef = useRef(null);
  const originalCorePosRef = useRef(null);
  const bubblesRef = useRef([]);
  const bubblesGroupRef = useRef(null);
  const causticMeshRef = useRef(null);
  const causticTextureRef = useRef(null);
  const coreLightRef = useRef(null);
  const shadowRef = useRef(null);
  const lightsRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const animFrameIdRef = useRef(null);
  const assemblyTimelineRef = useRef(null);
  const explosionTimelineRef = useRef(null);
  const holdProgressRef = useRef(0);
  const isExplodingRef = useRef(false);
  const isActiveRef = useRef(isActive);
  const baseCameraZRef = useRef(7.8);
  const animateFnRef = useRef(null);

  useEffect(() => {
    isActiveRef.current = isActive;
    if (isActive && !animFrameIdRef.current && animateFnRef.current) {
      animateFnRef.current();
    }
  }, [isActive]);

  useEffect(() => {
    holdProgressRef.current = holdProgress;
  }, [holdProgress]);

  useEffect(() => {
    isExplodingRef.current = isExploding;
  }, [isExploding]);

  // Three.js Scene Setup with Realistic Underwater Interior
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, baseCameraZRef.current);
    cameraRef.current = camera;

    // 3. Renderer with transparent background and physical transmission support
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting System for Glass & Liquid Water
    const ambientLight = new THREE.AmbientLight(0xfffbf5, 1.15);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffeedd, 1.6);
    keyLight.position.set(3.5, 4.5, 5);
    scene.add(keyLight);

    // Oceanic rim light: produces refractive aquatic edge sheen
    const rimLight = new THREE.DirectionalLight(0x76d7ea, 1.25);
    rimLight.position.set(-4.5, 2.5, -3);
    scene.add(rimLight);

    // Dynamic moving glint light
    const glintLight = new THREE.PointLight(0xffffff, 2.2, 12);
    glintLight.position.set(1.5, 2.5, 4);
    scene.add(glintLight);

    // Soft aquatic bottom bounce
    const bounceLight = new THREE.PointLight(0xb2ebf2, 0.9, 8);
    bounceLight.position.set(0, -3.2, 1);
    scene.add(bounceLight);

    // Core energy light (illuminates water from inside during hold & explosion)
    const coreLight = new THREE.PointLight(0x48cae4, 0, 10);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);
    coreLightRef.current = coreLight;

    lightsRef.current = [ambientLight, keyLight, rimLight, glintLight, bounceLight, coreLight];

    // 5. Materials
    // A. Transparent Inner Core - Realistic Water Medium with Physical IOR = 1.333
    const coreWaterMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xe8f8fc), // Crystal clean aquatic tint
      transparent: true,
      opacity: 0.12,
      transmission: 0.97,
      roughness: 0.008, // Ultra-smooth liquid surface tension
      metalness: 0.0,
      ior: 1.333, // Physical refractive index of pure water
      thickness: 3.2, // Volumetric liquid depth
      attenuationColor: new THREE.Color(0x80deea), // Aquatic liquid absorption
      attenuationDistance: 9.5,
      specularIntensity: 1.2,
      specularColor: new THREE.Color(0xffffff),
      clearcoat: 1.0,
      clearcoatRoughness: 0.01,
      depthWrite: false,
    });

    // B. Pre-baked High-Performance Underwater Caustic Texture (0ms per frame)
    const causticCanvas = document.createElement('canvas');
    causticCanvas.width = 128;
    causticCanvas.height = 128;
    const causticCtx = causticCanvas.getContext('2d');
    const imgData = causticCtx.createImageData(128, 128);
    const data = imgData.data;
    for (let cy = 0; cy < 128; cy++) {
      for (let cx = 0; cx < 128; cx++) {
        const s1 = Math.sin(cx * 0.14);
        const s2 = Math.sin(cy * 0.14);
        const s3 = Math.sin((cx + cy) * 0.11);
        const s4 = Math.sin(Math.sqrt((cx - 64) ** 2 + (cy - 64) ** 2) * 0.16);
        const cVal = Math.max(0, Math.min(255, Math.floor((s1 + s2 + s3 + s4 + 2) * 44)));
        const idx = (cy * 128 + cx) * 4;
        data[idx] = cVal * 0.65;
        data[idx + 1] = cVal * 0.95;
        data[idx + 2] = cVal;
        data[idx + 3] = cVal > 110 ? Math.min(255, (cVal - 110) * 1.4) : 0;
      }
    }
    causticCtx.putImageData(imgData, 0, 0);
    const causticTexture = new THREE.CanvasTexture(causticCanvas);
    causticTexture.wrapS = THREE.RepeatWrapping;
    causticTexture.wrapT = THREE.RepeatWrapping;
    causticTexture.repeat.set(1.5, 1.5);
    causticTextureRef.current = { canvas: causticCanvas, ctx: causticCtx, texture: causticTexture };

    // Caustic Inner Surface Mesh (creates shimmering sunbeams through water)
    const causticGeo = new THREE.SphereGeometry(1.65, 36, 36);
    const causticMat = new THREE.MeshBasicMaterial({
      map: causticTexture,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });
    const causticMesh = new THREE.Mesh(causticGeo, causticMat);
    causticMeshRef.current = causticMesh;

    // C. Outer Transparent Glass Shell Materials (IOR 1.5)
    const primaryGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xffffff),
      transparent: true,
      opacity: 0.07,
      transmission: 0.98,
      roughness: 0.03,
      metalness: 0.0,
      ior: 1.5,
      thickness: 1.1,
      attenuationColor: new THREE.Color(0xf5dfaa),
      attenuationDistance: 16.0,
      specularIntensity: 1.25,
      specularColor: new THREE.Color(0xfff7e6),
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      depthWrite: false,
    });

    const champagneGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xfffbf2),
      transparent: true,
      opacity: 0.10,
      transmission: 0.96,
      roughness: 0.04,
      metalness: 0.0,
      ior: 1.49,
      thickness: 0.9,
      attenuationColor: new THREE.Color(0xd6a64b),
      attenuationDistance: 14.0,
      specularIntensity: 1.35,
      specularColor: new THREE.Color(0xffeec2),
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      depthWrite: false,
    });

    const outlineGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xf6efe6),
      transparent: true,
      opacity: 0.06,
      transmission: 0.99,
      roughness: 0.02,
      metalness: 0.0,
      ior: 1.52,
      thickness: 1.3,
      attenuationColor: new THREE.Color(0xe8d5b5),
      attenuationDistance: 18.0,
      specularIntensity: 1.1,
      specularColor: new THREE.Color(0xffffff),
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      depthWrite: false,
    });

    const bandGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xd6a64b),
      transparent: true,
      opacity: 0.28,
      transmission: 0.88,
      roughness: 0.12,
      metalness: 0.45,
      ior: 1.52,
      thickness: 0.4,
      attenuationColor: new THREE.Color(0xf9e5b0),
      attenuationDistance: 12.0,
      specularIntensity: 1.4,
      specularColor: new THREE.Color(0xffe6a3),
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      depthWrite: false,
    });

    // 6. Master Sphere Group
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);
    sphereGroupRef.current = masterGroup;

    // A. Transparent Inner Core Water Sphere with 3D ripple deformation
    const coreGeo = new THREE.SphereGeometry(1.68, 48, 48);
    const coreMesh = new THREE.Mesh(coreGeo, coreWaterMaterial);
    masterGroup.add(coreMesh);
    masterGroup.add(causticMesh);
    coreRef.current = coreMesh;
    coreGeoRef.current = coreGeo;
    originalCorePosRef.current = coreGeo.attributes.position.clone();

    // B. Suspended Aquatic Micro-Bubbles Floating Inside the Water Volume
    const bubblesGroup = new THREE.Group();
    masterGroup.add(bubblesGroup);
    bubblesGroupRef.current = bubblesGroup;

    const bubbleGeo = new THREE.SphereGeometry(1, 14, 14);
    const bubbleMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xffffff),
      transparent: true,
      opacity: 0.42,
      transmission: 0.92,
      ior: 1.1, // Air bubble inside water
      roughness: 0.0,
      specularIntensity: 1.5,
      clearcoat: 1.0,
      depthWrite: false,
    });

    const bubbles = [];
    const numBubbles = 42;
    for (let i = 0; i < numBubbles; i++) {
      const bubbleRadius = 0.02 + Math.random() * 0.035;
      const mesh = new THREE.Mesh(bubbleGeo, bubbleMat.clone());
      mesh.scale.set(bubbleRadius, bubbleRadius, bubbleRadius);

      // Random position inside water sphere (r < 1.35)
      const r = Math.cbrt(Math.random()) * 1.32;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const initX = r * Math.sin(phi) * Math.cos(theta);
      const initY = r * Math.sin(phi) * Math.sin(theta);
      const initZ = r * Math.cos(phi);

      mesh.position.set(initX, initY, initZ);
      bubblesGroup.add(mesh);

      bubbles.push({
        mesh,
        material: mesh.material,
        radius: bubbleRadius,
        speed: 0.003 + Math.random() * 0.004,
        driftFreq: 1.2 + Math.random() * 1.5,
        driftPhase: Math.random() * Math.PI * 2,
        driftAmp: 0.0015 + Math.random() * 0.002,
      });
    }
    bubblesRef.current = bubbles;

    // C. Spherical Transparent Glass Shell Fragments
    const shellPieces = [];
    const shellConfigs = [
      { phiStart: 0, phiLength: Math.PI * 0.72, thetaStart: 0.15, thetaLength: Math.PI * 0.42, mat: primaryGlassMaterial, scale: 1.76 },
      { phiStart: Math.PI * 0.85, phiLength: Math.PI * 0.7, thetaStart: 0.25, thetaLength: Math.PI * 0.38, mat: champagneGlassMaterial, scale: 1.78 },
      { phiStart: Math.PI * 1.62, phiLength: Math.PI * 0.32, thetaStart: 0.1, thetaLength: Math.PI * 0.45, mat: outlineGlassMaterial, scale: 1.74 },
      { phiStart: 0.2, phiLength: Math.PI * 0.8, thetaStart: Math.PI * 0.55, thetaLength: Math.PI * 0.38, mat: champagneGlassMaterial, scale: 1.77 },
      { phiStart: Math.PI * 1.05, phiLength: Math.PI * 0.75, thetaStart: Math.PI * 0.52, thetaLength: Math.PI * 0.42, mat: primaryGlassMaterial, scale: 1.79 },
      { phiStart: Math.PI * 0.4, phiLength: Math.PI * 0.5, thetaStart: Math.PI * 0.38, thetaLength: Math.PI * 0.24, mat: outlineGlassMaterial, scale: 1.81 },
      { phiStart: Math.PI * 1.35, phiLength: Math.PI * 0.55, thetaStart: Math.PI * 0.4, thetaLength: Math.PI * 0.22, mat: primaryGlassMaterial, scale: 1.82 },
    ];

    shellConfigs.forEach((cfg, idx) => {
      const geo = new THREE.SphereGeometry(
        cfg.scale,
        40,
        28,
        cfg.phiStart,
        cfg.phiLength,
        cfg.thetaStart,
        cfg.thetaLength
      );
      const pieceMat = cfg.mat.clone();
      const mesh = new THREE.Mesh(geo, pieceMat);
      mesh.material.side = THREE.DoubleSide;

      const midPhi = cfg.phiStart + cfg.phiLength / 2;
      const midTheta = cfg.thetaStart + cfg.thetaLength / 2;
      const normalDir = new THREE.Vector3(
        Math.sin(midTheta) * Math.cos(midPhi),
        Math.cos(midTheta),
        Math.sin(midTheta) * Math.sin(midPhi)
      ).normalize();

      const targetPos = new THREE.Vector3(0, 0, 0);
      const targetRot = new THREE.Euler(0, 0, 0);

      const angle = (idx / shellConfigs.length) * Math.PI * 2;
      const dist = 3.2 + Math.random() * 2.2;
      const initialPos = new THREE.Vector3(
        Math.cos(angle) * dist,
        (Math.random() - 0.5) * 3.5,
        Math.sin(angle) * dist
      );
      const initialRot = new THREE.Euler(
        (Math.random() - 0.5) * Math.PI * 2,
        (Math.random() - 0.5) * Math.PI * 2,
        (Math.random() - 0.5) * Math.PI * 2
      );

      mesh.position.copy(initialPos);
      mesh.rotation.copy(initialRot);
      mesh.scale.set(0.1, 0.1, 0.1);

      masterGroup.add(mesh);
      shellPieces.push({
        mesh,
        material: pieceMat,
        baseOpacity: cfg.mat.opacity,
        normalDir,
        initialPos,
        initialRot,
        targetPos,
        targetRot,
      });
    });
    fragmentsRef.current = shellPieces;

    // D. Layered Subtle Glass & Metallic Bands
    const bandConfigs = [
      { radius: 1.88, tube: 0.035, rotX: 0.28, rotY: 0, rotZ: 0.15 },
      { radius: 1.96, tube: 0.030, rotX: -0.45, rotY: 0.6, rotZ: 0.35 },
      { radius: 2.04, tube: 0.026, rotX: 0.82, rotY: -0.4, rotZ: -0.2 },
      { radius: 2.12, tube: 0.022, rotX: 0.05, rotY: 0.1, rotZ: 0.95 },
    ];

    const bandMeshes = [];
    bandConfigs.forEach((bCfg, idx) => {
      const torusGeo = new THREE.TorusGeometry(bCfg.radius, bCfg.tube, 24, 72);
      const bMat = bandGlassMaterial.clone();
      const torusMesh = new THREE.Mesh(torusGeo, bMat);

      const targetRot = new THREE.Euler(bCfg.rotX, bCfg.rotY, bCfg.rotZ);
      const initialRot = new THREE.Euler(
        bCfg.rotX + (Math.random() - 0.5) * 4,
        bCfg.rotY + (Math.random() - 0.5) * 4,
        bCfg.rotZ + (Math.random() - 0.5) * 4
      );

      torusMesh.rotation.copy(initialRot);
      torusMesh.scale.set(0.01, 0.01, 0.01);
      masterGroup.add(torusMesh);

      bandMeshes.push({
        mesh: torusMesh,
        material: bMat,
        baseOpacity: bandGlassMaterial.opacity,
        initialRot,
        targetRot,
        speed: (idx % 2 === 0 ? 1 : -1) * (0.002 + idx * 0.001),
      });
    });
    bandsRef.current = bandMeshes;

    // E. Soft Floor Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(4.2, 4.2);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    const grad = sCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(100, 180, 200, 0.14)');
    grad.addColorStop(0.4, 'rgba(140, 195, 215, 0.05)');
    grad.addColorStop(0.75, 'rgba(214, 166, 75, 0.015)');
    grad.addColorStop(1, 'rgba(242, 237, 227, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, -2.45, 0);
    scene.add(shadowMesh);
    shadowRef.current = shadowMesh;

    // 7. Mouse Listener
    const handlePointerMove = (e) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current.targetX = normX * 0.45;
      mouseRef.current.targetY = normY * 0.35;
    };
    window.addEventListener('mousemove', handlePointerMove, { passive: true });

    // 8. Resize Listener
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      cameraRef.current.aspect = w / h;
      if (w < 640) {
        baseCameraZRef.current = 9.8;
      } else if (w < 1024) {
        baseCameraZRef.current = 8.6;
      } else {
        baseCameraZRef.current = 7.8;
      }
      cameraRef.current.position.z = baseCameraZRef.current;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // 9. High-Performance 120 FPS Render Loop
    let clock = new THREE.Clock();

    const animate = () => {
      if (!isActiveRef.current || document.hidden) {
        animFrameIdRef.current = null;
        return;
      }
      animFrameIdRef.current = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const p = holdProgressRef.current;
      const exploding = isExplodingRef.current;

      if (masterGroup && !exploding) {
        // Continuous subtle rotation
        const rotSpeed = 0.0035 + p * 0.006;
        masterGroup.rotation.y += rotSpeed;
        masterGroup.rotation.x = Math.sin(elapsedTime * 0.45) * 0.06 + mouseRef.current.y * 0.25;
        masterGroup.rotation.z = Math.cos(elapsedTime * 0.35) * 0.04 + mouseRef.current.x * 0.2;

        // Gentle floating oscillation
        const floatOffset = Math.sin(elapsedTime * 1.1) * 0.09;

        // Physical vibration in Phase 3
        if (p > 0.66) {
          const jitterIntensity = (p - 0.66) * 0.09;
          masterGroup.position.x = (Math.random() - 0.5) * jitterIntensity;
          masterGroup.position.y = floatOffset + (Math.random() - 0.5) * jitterIntensity;
          masterGroup.position.z = (Math.random() - 0.5) * jitterIntensity;
        } else {
          masterGroup.position.x = 0;
          masterGroup.position.y = floatOffset;
          masterGroup.position.z = 0;
        }

        // Animate individual orbital bands
        bandMeshes.forEach((b) => {
          b.mesh.rotation.z += b.speed * (1 + p * 2.5);
        });

        // ===================================================================
        // REAL 3D WATER SIMULATION INSIDE THE BALL (120 FPS HIGH-PERFORMANCE)
        // ===================================================================
        // A. Smooth harmonic 3D water core motion (0ms CPU cost, GPU matrix transforms)
        if (coreRef.current && p < 0.85) {
          coreRef.current.rotation.y += 0.003;
          coreRef.current.rotation.x = Math.sin(elapsedTime * 0.7) * 0.03;
          const breathe = 1.0 + Math.sin(elapsedTime * 1.8) * 0.012;
          coreRef.current.scale.set(breathe, breathe, breathe);
        }

        // B. Suspended micro-bubbles drifting upwards through the water
        const bubbleSpeedMultiplier = 1 + p * 3.5;
        bubbles.forEach((b) => {
          b.mesh.position.y += b.speed * bubbleSpeedMultiplier;
          b.mesh.position.x += Math.sin(elapsedTime * b.driftFreq + b.driftPhase) * b.driftAmp;
          b.mesh.position.z += Math.cos(elapsedTime * b.driftFreq + b.driftPhase) * b.driftAmp;

          // If bubble reaches top of water sphere, reset to bottom
          const currentDistSq = b.mesh.position.lengthSq();
          if (b.mesh.position.y > 1.35 || currentDistSq > 1.82) {
            b.mesh.position.y = -1.25 + Math.random() * 0.15;
            b.mesh.position.x = (Math.random() - 0.5) * 1.6;
            b.mesh.position.z = (Math.random() - 0.5) * 1.6;
          }
        });

        // C. High-Performance GPU-driven Caustic Texture Offset (0 CPU cost, 120 FPS)
        if (causticTextureRef.current?.texture) {
          causticTextureRef.current.texture.offset.x = (elapsedTime * 0.035) % 1;
          causticTextureRef.current.texture.offset.y = (elapsedTime * 0.02) % 1;
        }

        // Dynamic shadow reaction
        if (shadowRef.current) {
          const shadowScale = (1 - floatOffset * 0.8) * (1 - p * 0.3);
          shadowRef.current.scale.set(shadowScale, shadowScale, shadowScale);
        }

        // Camera smoothly glides closer during hold
        if (camera) {
          const targetZ = baseCameraZRef.current - p * 1.4;
          camera.position.z += (targetZ - camera.position.z) * 0.1;
        }
      }

      // Dynamic glint light tracking
      if (glintLight) {
        glintLight.position.x = 2 + Math.sin(elapsedTime * 0.8) * 1.5;
        glintLight.position.y = 2 + Math.cos(elapsedTime * 0.6) * 1.2;
      }

      renderer.render(scene, camera);
    };
    animateFnRef.current = animate;
    if (isActiveRef.current) {
      animate();
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && isActiveRef.current && !animFrameIdRef.current) {
        animate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, []);

  // Assembly Animation on Hero Mount
  useEffect(() => {
    if (!isAssembling || !sphereGroupRef.current) return;

    if (assemblyTimelineRef.current) {
      assemblyTimelineRef.current.kill();
    }

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => {
        onAssemblyComplete?.();
      },
    });
    assemblyTimelineRef.current = tl;

    // Core water scale
    if (coreRef.current) {
      gsap.fromTo(
        coreRef.current.scale,
        { x: 0.1, y: 0.1, z: 0.1 },
        { x: 1, y: 1, z: 1, duration: 1.4, ease: 'back.out(1.2)' }
      );
    }

    // Transparent glass fragments assembly
    fragmentsRef.current.forEach((item, idx) => {
      const delay = 0.08 + idx * 0.06;
      tl.to(
        item.mesh.position,
        {
          x: item.targetPos.x,
          y: item.targetPos.y,
          z: item.targetPos.z,
          duration: 1.6,
          ease: 'power3.inOut',
        },
        delay
      );
      tl.to(
        item.mesh.rotation,
        {
          x: item.targetRot.x,
          y: item.targetRot.y,
          z: item.targetRot.z,
          duration: 1.6,
          ease: 'power3.out',
        },
        delay
      );
      tl.to(
        item.mesh.scale,
        {
          x: 1,
          y: 1,
          z: 1,
          duration: 1.4,
          ease: 'back.out(1.3)',
        },
        delay
      );
    });

    // Metallic glass bands
    bandsRef.current.forEach((b, idx) => {
      const bDelay = 0.35 + idx * 0.1;
      tl.to(
        b.mesh.scale,
        {
          x: 1,
          y: 1,
          z: 1,
          duration: 1.5,
          ease: 'elastic.out(1, 0.65)',
        },
        bDelay
      );
      tl.to(
        b.mesh.rotation,
        {
          x: b.targetRot.x,
          y: b.targetRot.y,
          z: b.targetRot.z,
          duration: 1.6,
          ease: 'power3.out',
        },
        bDelay
      );
    });

    // Floor shadow
    if (shadowRef.current) {
      tl.to(
        shadowRef.current.material,
        {
          opacity: 0.35,
          duration: 1.2,
          ease: 'power2.out',
        },
        0.5
      );
    }
  }, [isAssembling, onAssemblyComplete]);

  // =========================================================================
  // DYNAMIC 3-SECOND HOLD SPHERE OPENING & CHARGING (0s -> 3s)
  // =========================================================================
  useEffect(() => {
    if (isExplodingRef.current) return;

    const p = holdProgress; // 0 to 1

    // 1. Shell fragments expansion
    const separationDistance = Math.pow(p, 1.3) * 2.2;
    const tiltAngle = p * 0.35;

    fragmentsRef.current.forEach((item) => {
      const n = item.normalDir;
      gsap.to(item.mesh.position, {
        x: n.x * separationDistance,
        y: n.y * separationDistance,
        z: n.z * separationDistance,
        duration: 0.25,
        ease: 'power1.out',
        overwrite: 'auto',
      });
      gsap.to(item.mesh.rotation, {
        x: item.targetRot.x + n.y * tiltAngle,
        y: item.targetRot.y + n.x * tiltAngle,
        z: item.targetRot.z + n.z * tiltAngle,
        duration: 0.25,
        ease: 'power1.out',
        overwrite: 'auto',
      });

      const chargeOpacity = item.baseOpacity + p * 0.2;
      gsap.to(item.material, {
        opacity: chargeOpacity,
        duration: 0.2,
        overwrite: 'auto',
      });
    });

    // 2. Orbital bands expansion & rotation
    const bandScale = 1 + p * 0.42;
    bandsRef.current.forEach((b) => {
      gsap.to(b.mesh.scale, {
        x: bandScale,
        y: bandScale,
        z: bandScale,
        duration: 0.25,
        ease: 'power1.out',
        overwrite: 'auto',
      });
      gsap.to(b.material, {
        opacity: b.baseOpacity + p * 0.25,
        duration: 0.2,
        overwrite: 'auto',
      });
    });

    // 3. Water Core & Caustics Light Emission during hold
    if (coreLightRef.current) {
      const targetIntensity = Math.pow(p, 1.5) * 14.0;
      gsap.to(coreLightRef.current, {
        intensity: targetIntensity,
        duration: 0.2,
        overwrite: 'auto',
      });
    }

    if (coreRef.current && coreRef.current.material) {
      const emissiveColor = new THREE.Color(0x48cae4);
      coreRef.current.material.emissive = emissiveColor;
      gsap.to(coreRef.current.material, {
        emissiveIntensity: Math.pow(p, 1.2) * 1.8,
        opacity: 0.12 + p * 0.18,
        duration: 0.2,
        overwrite: 'auto',
      });
    }

    // 4. Boost glint & aquatic rim reflections
    if (lightsRef.current.length >= 4) {
      const keyLight = lightsRef.current[1];
      const glintLight = lightsRef.current[3];
      gsap.to(keyLight, {
        intensity: 1.6 + p * 1.4,
        duration: 0.2,
        overwrite: 'auto',
      });
      gsap.to(glintLight, {
        intensity: 2.2 + p * 3.0,
        duration: 0.2,
        overwrite: 'auto',
      });
    }
  }, [holdProgress]);

  // =========================================================================
  // CINEMATIC 3D EXPLOSION (At exactly 3 seconds)
  // =========================================================================
  useEffect(() => {
    if (!isExploding || !sphereGroupRef.current) return;

    if (explosionTimelineRef.current) {
      explosionTimelineRef.current.kill();
    }

    const tl = gsap.timeline({
      defaults: { ease: 'power4.out' },
      onComplete: () => {
        onExplosionComplete?.();
      },
    });
    explosionTimelineRef.current = tl;

    // 1. Camera Shake Effect
    if (cameraRef.current) {
      const cam = cameraRef.current;
      const originalZ = cam.position.z;
      tl.to(cam.position, {
        x: '+=0.25',
        y: '-=0.18',
        duration: 0.05,
        repeat: 7,
        yoyo: true,
        ease: 'sine.inOut',
        onComplete: () => {
          gsap.to(cam.position, { x: 0, y: 0, z: originalZ, duration: 0.4 });
        },
      }, 0);
    }

    // 2. Central Light Burst
    if (coreLightRef.current) {
      tl.to(coreLightRef.current, {
        intensity: 28,
        distance: 25,
        duration: 0.25,
        ease: 'power2.in',
      }, 0)
      .to(coreLightRef.current, {
        intensity: 0,
        duration: 0.8,
        ease: 'power2.out',
      }, 0.25);
    }

    // 3. Water Core & Caustics burst
    if (coreRef.current) {
      tl.to(coreRef.current.scale, {
        x: 3.5,
        y: 3.5,
        z: 3.5,
        duration: 0.65,
        ease: 'power3.out',
      }, 0);
      tl.to(coreRef.current.material, {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
      }, 0.15);
    }

    if (causticMeshRef.current) {
      tl.to(causticMeshRef.current.material, {
        opacity: 0,
        duration: 0.4,
      }, 0);
    }

    // 4. Bubbles blast outward in a burst of micro-droplets
    bubblesRef.current.forEach((b) => {
      const burstX = b.mesh.position.x * 4.5 + (Math.random() - 0.5) * 4;
      const burstY = b.mesh.position.y * 4.5 + (Math.random() - 0.5) * 4;
      const burstZ = b.mesh.position.z * 4.5 + (Math.random() - 0.5) * 4;

      tl.to(b.mesh.position, {
        x: burstX,
        y: burstY,
        z: burstZ,
        duration: 0.9,
        ease: 'power3.out',
      }, 0);

      tl.to(b.material, {
        opacity: 0,
        duration: 0.65,
        ease: 'power2.out',
      }, 0.1);
    });

    // 5. Transparent Glass Shell Fragments Explosion & Tumbling
    fragmentsRef.current.forEach((item, idx) => {
      const n = item.normalDir;
      const blastDistance = 8.5 + (idx % 3) * 2.8 + Math.random() * 3.5;
      const blastX = n.x * blastDistance + (Math.random() - 0.5) * 3;
      const blastY = n.y * blastDistance + (Math.random() - 0.5) * 3;
      const blastZ = n.z * blastDistance + (Math.random() - 0.5) * 3;

      const tumbleX = (Math.random() - 0.5) * Math.PI * 4;
      const tumbleY = (Math.random() - 0.5) * Math.PI * 4;
      const tumbleZ = (Math.random() - 0.5) * Math.PI * 4;

      tl.to(item.mesh.position, {
        x: blastX,
        y: blastY,
        z: blastZ,
        duration: 1.3,
        ease: 'power4.out',
      }, 0);

      tl.to(item.mesh.rotation, {
        x: `+=${tumbleX}`,
        y: `+=${tumbleY}`,
        z: `+=${tumbleZ}`,
        duration: 1.4,
        ease: 'power3.out',
      }, 0);

      tl.to(item.material, {
        opacity: 0,
        duration: 0.85,
        ease: 'power2.inOut',
      }, 0.35);
    });

    // 6. Orbital Bands Shockwave
    bandsRef.current.forEach((b) => {
      tl.to(b.mesh.scale, {
        x: 5.5,
        y: 5.5,
        z: 5.5,
        duration: 1.1,
        ease: 'power3.out',
      }, 0);
      tl.to(b.material, {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
      }, 0.2);
    });

    // 7. Floor shadow dissipation
    if (shadowRef.current) {
      tl.to(shadowRef.current.material, {
        opacity: 0,
        duration: 0.4,
      }, 0);
    }
  }, [isExploding, onExplosionComplete]);

  // =========================================================================
  // RECOVERABILITY: Restore Water Sphere & Bubbles on Reset
  // =========================================================================
  useEffect(() => {
    if (!isResetting) return;

    if (explosionTimelineRef.current) {
      explosionTimelineRef.current.kill();
    }

    // Restore Core Water Sphere
    if (coreRef.current) {
      coreRef.current.scale.set(1, 1, 1);
      if (coreRef.current.material) {
        coreRef.current.material.opacity = 0.12;
        coreRef.current.material.emissiveIntensity = 0;
      }
    }

    if (causticMeshRef.current) {
      causticMeshRef.current.material.opacity = 0.28;
    }

    // Restore Floating Bubbles
    bubblesRef.current.forEach((b) => {
      const r = Math.cbrt(Math.random()) * 1.32;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      b.mesh.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      b.material.opacity = 0.42;
    });

    // Restore Glass Shell fragments
    fragmentsRef.current.forEach((item) => {
      item.mesh.position.set(0, 0, 0);
      item.mesh.rotation.copy(item.targetRot);
      item.mesh.scale.set(1, 1, 1);
      item.material.opacity = item.baseOpacity;
    });

    // Restore Bands
    bandsRef.current.forEach((b) => {
      b.mesh.scale.set(1, 1, 1);
      b.mesh.rotation.copy(b.targetRot);
      b.material.opacity = b.baseOpacity;
    });

    // Restore Lights
    if (coreLightRef.current) {
      coreLightRef.current.intensity = 0;
    }
    if (lightsRef.current.length >= 4) {
      lightsRef.current[1].intensity = 1.6;
      lightsRef.current[3].intensity = 2.2;
    }

    // Restore Camera
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, baseCameraZRef.current);
    }

    // Restore Shadow
    if (shadowRef.current) {
      shadowRef.current.material.opacity = 0.35;
      shadowRef.current.scale.set(1, 1, 1);
    }
  }, [isResetting]);

  // Hover Response
  useEffect(() => {
    if (!lightsRef.current.length || holdProgressRef.current > 0 || isExplodingRef.current) return;
    const keyLight = lightsRef.current[1];
    const glintLight = lightsRef.current[3];

    if (isHovered) {
      gsap.to([keyLight, glintLight], {
        intensity: '+=0.5',
        duration: 0.4,
        ease: 'power2.out',
      });
      if (sphereGroupRef.current) {
        gsap.to(sphereGroupRef.current.scale, {
          x: 1.05,
          y: 1.05,
          z: 1.05,
          duration: 0.45,
          ease: 'power2.out',
        });
      }
    } else {
      gsap.to(keyLight, { intensity: 1.6, duration: 0.5, ease: 'power2.out' });
      gsap.to(glintLight, { intensity: 2.2, duration: 0.5, ease: 'power2.out' });
      if (sphereGroupRef.current) {
        gsap.to(sphereGroupRef.current.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.55,
          ease: 'elastic.out(1, 0.6)',
        });
      }
    }
  }, [isHovered]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 15,
        pointerEvents: 'none',
      }}
    />
  );
}
