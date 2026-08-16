import { useEffect, useRef } from "react";

/**
 * Drifting data-constellation network — ambient background for
 * data-dense pages (Market Intelligence). Deliberately different
 * rhythm from the candlestick Scene3DBackground used on Login/Dashboard.
 *
 * density: "light" (default, safe behind dense tables/cards) | "full"
 */
function ConstellationBackground({ density = "light" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let w, h, nodes;
    let mouseX = 0;
    let mouseY = 0;
    let frameId;

    const isFull = density === "full";

    const resize = () => {
      const parent = canvas.parentElement;
      w = canvas.width = parent.clientWidth;
      h = canvas.height = parent.clientHeight;

      const count = Math.min(isFull ? 90 : 55, Math.floor((w * h) / (isFull ? 16000 : 24000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.4 + 0.6,
      }));
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);

    const linkDist = isFull ? 130 : 105;

    const tick = () => {
      ctx.clearRect(0, 0, w, h);

      const parallaxX = ((mouseX - w / 2) / w) * (isFull ? 18 : 8);
      const parallaxY = ((mouseY - h / 2) / h) * (isFull ? 18 : 8);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkDist) {
            ctx.strokeStyle = `rgba(0,229,160,${0.12 * (1 - dist / linkDist)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x + parallaxX, a.y + parallaxY);
            ctx.lineTo(b.x + parallaxX, b.y + parallaxY);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x + parallaxX, n.y + parallaxY, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(200,230,255,0.45)";
        ctx.fill();
      }

      frameId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

export default ConstellationBackground;
