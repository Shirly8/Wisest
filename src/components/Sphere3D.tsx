import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
// @ts-ignore - three types have compatibility issues
import * as THREE from 'three';
import '../styles/sphere-3d.css';

export interface Sphere3DHandle {
  /** Trigger a physical 3D shake (decays over ~1.2s) */
  shake: () => void;
}

interface Sphere3DProps {
  id?: string;
  triangleContent?: React.ReactNode;
  className?: string;
  /** Pulsing orbit rings around the ball */
  showRings?: boolean;
  /** Ball tilts toward the cursor */
  parallax?: boolean;
  /** Container size; canvas fills it (e.g. "80px", "min(46vmin, 260px)") */
  size?: string;
  /** How much of the frame the ball fills (camera distance). 1 = default */
  ballScale?: number;
}

const Sphere3D = forwardRef<Sphere3DHandle, Sphere3DProps>(({
  id,
  triangleContent,
  className = '',
  showRings = false,
  parallax = true,
  size,
  ballScale = 1,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const shakeEnergyRef = useRef(0);

  useImperativeHandle(ref, () => ({
    shake: () => {
      shakeEnergyRef.current = 1;
      const overlay = overlayRef.current;
      if (overlay) {
        overlay.classList.remove('sphere-jitter');
        void overlay.offsetWidth;
        overlay.classList.add('sphere-jitter');
      }
    },
  }), []);

  useEffect(() => {
    if (!containerRef.current) return;

    // ─── SCENE SETUP ───
    const canvas = document.createElement('canvas');
    containerRef.current.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 4.2 / ballScale);

    // Everything that shakes/tilts lives in this group
    const group = new THREE.Group();
    scene.add(group);

    // ─── LIGHTING ───
    scene.add(new THREE.AmbientLight(0x5a68b8, 1.4));

    const key = new THREE.SpotLight(0xF0F8FF, 9);
    key.position.set(1.5, 3.5, 2.5);
    key.angle = Math.PI / 6;
    key.penumbra = 0.6;
    key.decay = 1.6;
    key.distance = 14;
    scene.add(key, key.target);

    // strong rim/back lights so the silhouette reads against the dark bg
    const rim = new THREE.PointLight(0x8070FF, 6, 14);
    rim.position.set(-2.4, -1.6, 1.2);
    scene.add(rim);

    const rim2 = new THREE.PointLight(0x4a90FF, 5, 14);
    rim2.position.set(2.6, 1.2, -0.5);
    scene.add(rim2);

    const fill = new THREE.PointLight(0x5090FF, 3.5, 16);
    fill.position.set(2.5, -0.5, 2);
    scene.add(fill);

    // ─── HALO — soft blue glow behind the ball (defines the silhouette) ───
    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = haloCanvas.height = 256;
    const hctx = haloCanvas.getContext('2d')!;
    const hgrad = hctx.createRadialGradient(128, 128, 40, 128, 128, 118);
    hgrad.addColorStop(0, 'rgba(80,110,230,.55)');
    hgrad.addColorStop(0.5, 'rgba(60,80,200,.22)');
    hgrad.addColorStop(0.85, 'rgba(45,60,170,.05)');
    hgrad.addColorStop(1, 'rgba(40,55,160,0)');
    hctx.fillStyle = hgrad;
    hctx.fillRect(0, 0, 256, 256);
    const haloTex = new THREE.CanvasTexture(haloCanvas);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: haloTex, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: 0.9,
    }));
    halo.scale.set(3.4, 3.4, 1);
    halo.position.z = -0.6;
    scene.add(halo);

    // ─── SPHERE — glossy blue-black like a real 8-ball ───
    const orbGeo = new THREE.SphereGeometry(1, 96, 96);
    const orbMat = new THREE.MeshPhysicalMaterial({
      color: 0x2a3a78,
      metalness: 0.2,
      roughness: 0.06,
      reflectivity: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      envMapIntensity: 3.2,
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    group.add(orb);

    // ─── ENV MAP — dark studio with softbox strips for realistic sheen ───
    const pmremGen = new THREE.PMREMGenerator(renderer);
    pmremGen.compileEquirectangularShader();

    const envScene = new THREE.Scene();
    envScene.add(new THREE.Mesh(
      new THREE.SphereGeometry(6, 32, 16),
      new THREE.MeshBasicMaterial({ color: 0x0a0c26, side: THREE.BackSide })
    ));
    // overhead softbox
    const soft1 = new THREE.Mesh(
      new THREE.PlaneGeometry(4.5, 1.6),
      new THREE.MeshBasicMaterial({ color: 0xE8F4FF, side: THREE.DoubleSide })
    );
    soft1.position.set(0.8, 3.2, 1.2);
    soft1.lookAt(0, 0, 0);
    // cool side strip
    const soft2 = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 4),
      new THREE.MeshBasicMaterial({ color: 0x7a98f8, side: THREE.DoubleSide })
    );
    soft2.position.set(-3.2, -0.5, 1.5);
    soft2.lookAt(0, 0, 0);
    // warm-blue floor bounce
    const soft3 = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 1.4),
      new THREE.MeshBasicMaterial({ color: 0x3a50c0, side: THREE.DoubleSide })
    );
    soft3.position.set(0.5, -3, 1);
    soft3.lookAt(0, 0, 0);
    envScene.add(soft1, soft2, soft3);

    const envRT = pmremGen.fromScene(envScene);
    scene.environment = envRT.texture;
    orbMat.envMap = envRT.texture;
    orbMat.needsUpdate = true;

    // ─── WINDOW — recessed liquid disc with metallic bezel ───
    const winCanvas = document.createElement('canvas');
    winCanvas.width = winCanvas.height = 256;
    const wctx = winCanvas.getContext('2d')!;
    const grad = wctx.createRadialGradient(96, 80, 10, 128, 128, 150);
    grad.addColorStop(0, '#2440a8');
    grad.addColorStop(0.45, '#141f68');
    grad.addColorStop(1, '#080c38');
    wctx.fillStyle = grad;
    wctx.fillRect(0, 0, 256, 256);
    const winTex = new THREE.CanvasTexture(winCanvas);

    const winMat = new THREE.MeshPhysicalMaterial({
      map: winTex,
      roughness: 0.08,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.2,
    });
    const winMesh = new THREE.Mesh(new THREE.CircleGeometry(0.42, 64), winMat);
    winMesh.position.set(0, 0, 0.94);
    group.add(winMesh);

    const bezelMat = new THREE.MeshPhysicalMaterial({
      color: 0x3548a0,
      metalness: 0.9,
      roughness: 0.2,
      envMapIntensity: 2.2,
    });
    const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.435, 0.022, 24, 96), bezelMat);
    bezel.position.set(0, 0, 0.935);
    group.add(bezel);

    // ─── RINGS ───
    const rings: THREE.Mesh[] = [];
    if (showRings) {
      [1.18, 1.4, 1.68].forEach((r, i) => {
        const mat = new THREE.MeshBasicMaterial({
          color: 0x5070CC, transparent: true, opacity: 0,
          side: THREE.DoubleSide, depthWrite: false,
        });
        const mesh = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.006, 96), mat);
        mesh.position.z = -0.01;
        mesh.userData = { phase: i * (Math.PI * 2 / 3) };
        scene.add(mesh);
        rings.push(mesh);
      });
    }

    // ─── SHADOW ───
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 0.4),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false })
    );
    shadow.position.set(0, -1.15, -0.3);
    scene.add(shadow);

    // ─── PARALLAX (cursor tilt) ───
    let tRX = 0, tRY = 0;
    const onMouse = (e: MouseEvent) => {
      const dx = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      const dy = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      tRY = dx * 0.28;
      tRX = -dy * 0.22;
    };
    const onTouch = (e: TouchEvent) => {
      if (!e.touches.length) return;
      const t = e.touches[0];
      tRY = ((t.clientX - window.innerWidth / 2) / (window.innerWidth / 2)) * 0.28;
      tRX = -((t.clientY - window.innerHeight / 2) / (window.innerHeight / 2)) * 0.22;
    };
    if (parallax) {
      window.addEventListener('mousemove', onMouse, { passive: true });
      window.addEventListener('touchmove', onTouch, { passive: true });
    }

    // ─── RESIZE ───
    const resize = () => {
      const w = containerRef.current?.clientWidth || 400;
      const h = containerRef.current?.clientHeight || 400;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize);

    // ─── ANIMATION LOOP ───
    let raf: number;
    let time = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      time += 0.016;

      // idle float + slow drift
      const floatY = Math.sin(time * 0.8) * 0.035;
      orb.rotation.y += 0.0012;
      orb.rotation.x = Math.sin(time * 0.3) * 0.02;

      // cursor tilt (lerped)
      group.rotation.x += (tRX - group.rotation.x) * 0.06;
      group.rotation.y += (tRY - group.rotation.y) * 0.06;

      // physical shake — high-frequency decaying jitter, like a real hand-shake
      const e2 = shakeEnergyRef.current;
      if (e2 > 0.002) {
        const st = time * 42;
        group.position.x = (Math.sin(st * 1.13) + Math.sin(st * 0.71) * 0.5) * 0.085 * e2;
        group.position.y = floatY + (Math.cos(st * 1.31) + Math.sin(st * 0.53) * 0.5) * 0.07 * e2;
        group.rotation.z = Math.sin(st * 0.97) * 0.24 * e2;
        group.rotation.x += Math.cos(st * 0.83) * 0.14 * e2;
        orb.rotation.y += 0.06 * e2; // liquid spins inside
        shakeEnergyRef.current *= 0.955;
      } else {
        group.position.x *= 0.9;
        group.position.y = floatY;
        group.rotation.z *= 0.9;
        shakeEnergyRef.current = 0;
      }

      rings.forEach(ring => {
        const pulse = Math.sin(time * 0.5 + ring.userData.phase) * 0.5 + 0.5;
        (ring.material as THREE.MeshBasicMaterial).opacity = pulse * 0.25;
      });

      renderer.render(scene, camera);
    };
    animate();

    // ─── CLEANUP ───
    const container = containerRef.current;
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      if (parallax) {
        window.removeEventListener('mousemove', onMouse);
        window.removeEventListener('touchmove', onTouch);
      }
      renderer.dispose();
      pmremGen.dispose();
      envRT.dispose();
      winTex.dispose();
      scene.traverse((obj: THREE.Object3D) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (obj.material.dispose) obj.material.dispose();
        }
      });
      if (container && canvas.parentElement === container) {
        container.removeChild(canvas);
      }
    };
  }, [showRings, parallax, ballScale]);

  return (
    <div
      ref={containerRef}
      id={id}
      className={`sphere-3d-container ${className}`}
      style={{ width: size || '100%', height: size || '100%' }}
    >
      {triangleContent && (
        <div ref={overlayRef} className="sphere-3d-overlay">
          <div className="tri-container">
            <svg className="tri-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
              <polygon points="60,15 110,100 10,100" fill="rgba(20,32,90,.55)" stroke="rgba(120,165,255,.65)" strokeWidth="1.5" />
            </svg>
            <div className="tri-text">
              {triangleContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

Sphere3D.displayName = 'Sphere3D';

export default Sphere3D;
