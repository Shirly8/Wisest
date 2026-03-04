import React, { useEffect, useRef } from 'react';
// @ts-ignore - three types have compatibility issues
import * as THREE from 'three';

interface Sphere3DProps {
  id?: string;
  triangleContent?: React.ReactNode;
  className?: string;
}

const Sphere3D: React.FC<Sphere3DProps> = ({ triangleContent, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const orbRef = useRef<THREE.Mesh | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const ringsRef = useRef<THREE.Mesh[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // ─── SCENE SETUP ───
    const canvas = document.createElement('canvas');
    containerRef.current.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    // ─── LIGHTING ───
    const ambient = new THREE.AmbientLight(0x4a5590, 0.85);
    scene.add(ambient);

    const key = new THREE.SpotLight(0xF0F8FF, 6.5);
    key.position.set(1.5, 3.5, 2.5);
    key.angle = Math.PI / 7;
    key.penumbra = 0.45;
    key.decay = 1.8;
    key.distance = 14;
    key.castShadow = true;
    scene.add(key);
    scene.add(key.target);

    const rim = new THREE.PointLight(0x7060F0, 2.4, 14);
    rim.position.set(-2, -2, 1.5);
    scene.add(rim);

    const fill = new THREE.PointLight(0x5090FF, 2.0, 16);
    fill.position.set(2.5, 0, 1);
    scene.add(fill);

    // ─── SPHERE ───
    const orbGeo = new THREE.SphereGeometry(1, 128, 128);
    const orbMat = new THREE.MeshPhysicalMaterial({
      color: 0x4a6aca,
      metalness: 0.4,
      roughness: 0.0,
      reflectivity: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      envMapIntensity: 3.4,
    });

    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.castShadow = true;
    orb.receiveShadow = false;
    scene.add(orb);
    orbRef.current = orb;

    // ─── ENV MAP ───
    const pmremGen = new THREE.PMREMGenerator(renderer);
    pmremGen.compileEquirectangularShader();

    const envScene = new THREE.Scene();
    const envTop = new THREE.Mesh(
      new THREE.SphereGeometry(5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x060415, side: THREE.BackSide })
    );
    const envBot = new THREE.Mesh(
      new THREE.SphereGeometry(5, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x020108, side: THREE.BackSide })
    );
    const envLight = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xE8F4FF })
    );
    envLight.position.set(1.2, 3, 1.5);
    envScene.add(envTop, envBot, envLight);

    const envRT = pmremGen.fromScene(envScene);
    scene.environment = envRT.texture;
    orbMat.envMap = envRT.texture;
    orbMat.needsUpdate = true;

    // ─── WINDOW (inner circle) ───
    const winGeo = new THREE.CircleGeometry(0.42, 64);
    const winMat = new THREE.MeshPhysicalMaterial({
      color: 0x080E28,
      roughness: 0.05,
      metalness: 0.0,
      clearcoat: 0.8,
      clearcoatRoughness: 0.05,
    });
    const winMesh = new THREE.Mesh(winGeo, winMat);
    winMesh.position.set(0, 0, 0.985);
    scene.add(winMesh);

    // ─── RINGS ───
    const rings: THREE.Mesh[] = [];
    [1.18, 1.4, 1.68].forEach((r, i) => {
      const geo = new THREE.RingGeometry(r, r + 0.006, 96);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x5070CC,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.z = -0.01;
      mesh.userData = { phase: i * (Math.PI * 2 / 3), baseR: r };
      scene.add(mesh);
      rings.push(mesh);
    });
    ringsRef.current = rings;

    // ─── SHADOW (plane below) ───
    const shadowGeo = new THREE.PlaneGeometry(2.2, 0.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.set(0, -1.15, -0.3);
    shadow.receiveShadow = false;
    scene.add(shadow);

    // ─── RESIZE & RENDER ───
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
    let time = 0;
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      time += 0.016;

      // Gentle rotation
      orb.rotation.x += 0.0003;
      orb.rotation.y += 0.0005;

      // Pulsing rings
      rings.forEach((ring, i) => {
        const phase = ring.userData.phase;
        const pulse = Math.sin(time * 0.5 + phase) * 0.5 + 0.5;
        ring.material.opacity = pulse * 0.25;
      });

      renderer.render(scene, camera);
    };

    animate();

    // ─── CLEANUP ───
    const container = containerRef.current;
    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
      orbGeo.dispose();
      orbMat.dispose();
      winGeo.dispose();
      winMat.dispose();
      if (container && canvas.parentElement === container) {
        container.removeChild(canvas);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className={`sphere-3d-container ${className}`} style={{ width: '100%', height: '100%' }}>
      {triangleContent && (
        <div className="sphere-3d-overlay">
          <div className="tri-container">
            <svg className="tri-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
              <polygon points="60,15 110,100 10,100" fill="none" stroke="rgba(90,140,255,.3)" strokeWidth="1.5" />
            </svg>
            <div className="tri-text">
              {triangleContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sphere3D;
