import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Ambient 3D candlestick field used behind hero/auth screens.
 *
 * intensity: "full" | "light"
 *   full  -> denser field, particles, mouse-follow camera (Login/Register/Dashboard hero)
 *   light -> sparse, slow, no mouse tracking (safe behind data-heavy pages)
 */
function Scene3DBackground({ intensity = "full" }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const isFull = intensity === "full";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    scene.fog = new THREE.FogExp2(0x06070a, 0.028);
    scene.add(new THREE.AmbientLight(0x404040, 1.2));

    const mintLight = new THREE.PointLight(0x00e5a0, isFull ? 3 : 1.6, 30);
    mintLight.position.set(-6, 4, 6);
    scene.add(mintLight);

    const redLight = new THREE.PointLight(0xff4d6a, isFull ? 2 : 1, 30);
    redLight.position.set(6, -3, 4);
    scene.add(redLight);

    const group = new THREE.Group();
    const candles = [];
    const count = isFull ? 34 : 14;

    for (let i = 0; i < count; i++) {
      const isUp = Math.random() > 0.45;
      const bodyH = 0.6 + Math.random() * 1.8;
      const color = isUp ? 0x00e5a0 : 0xff4d6a;

      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.35,
        metalness: 0.3,
        roughness: 0.4,
        transparent: true,
        opacity: isFull ? 0.85 : 0.5,
      });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.32, bodyH, 0.32), mat);

      const wickMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: isFull ? 1 : 0.6,
      });
      const wick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, bodyH + 0.8, 6),
        wickMat
      );

      const pivot = new THREE.Group();
      pivot.add(body);
      pivot.add(wick);

      const radius = 7 + Math.random() * 9;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 10;
      pivot.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius - 5
      );
      pivot.rotation.y = Math.random() * Math.PI;

      group.add(pivot);
      candles.push({
        pivot,
        speed: 0.15 + Math.random() * 0.3,
        baseY: height,
        phase: Math.random() * Math.PI * 2,
      });
    }
    scene.add(group);

    let particles;
    if (isFull) {
      const particleGeo = new THREE.BufferGeometry();
      const pCount = 300;
      const positions = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      }
      particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const particleMat = new THREE.PointsMaterial({
        color: 0x66f0c4,
        size: 0.045,
        transparent: true,
        opacity: 0.5,
      });
      particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);
    }

    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e) => {
      mouseX = e.clientX / window.innerWidth - 0.5;
      mouseY = e.clientY / window.innerHeight - 0.5;
    };
    if (isFull) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    const clock = new THREE.Clock();
    let frameId;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      group.rotation.y = t * (isFull ? 0.05 : 0.02);
      candles.forEach((c) => {
        c.pivot.position.y = c.baseY + Math.sin(t * c.speed + c.phase) * 0.5;
      });
      if (particles) particles.rotation.y = t * 0.02;

      if (isFull) {
        camera.position.x += (mouseX * 3 - camera.position.x) * 0.02;
        camera.position.y += (2 - mouseY * 2 - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      if (isFull) window.removeEventListener("mousemove", handleMouseMove);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [intensity]);

  return (
    <div
      ref={mountRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

export default Scene3DBackground;
