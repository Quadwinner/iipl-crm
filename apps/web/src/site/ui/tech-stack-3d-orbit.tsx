import { useEffect, useRef } from "react";

export const TechStack3DOrbit = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 500);

    let mouseX = width / 2;
    let mouseY = height / 2;
    let time = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    // Orbital ring parameters
    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);
      const primaryHsl = getComputedStyle(document.querySelector(".itoby-site") ?? document.documentElement).getPropertyValue("--primary-hsl").trim() || "75 100% 50%";

      const centerX = width / 2;
      const centerY = height / 2;
      ctx.save();
      ctx.translate(centerX, centerY);

      // Mouse tilt offset calculation
      const tiltX = (mouseX / width - 0.5) * 0.4;
      const tiltY = (mouseY / height - 0.5) * 0.4;

      const numRings = 4;
      const particlesPerRing = 12;

      // Draw 3D Concentric Orbit Rings
      for (let r = 1; r <= numRings; r++) {
        const rx = r * (width < 640 ? 38 : 58);
        const ry = rx * 0.45;
        const angleOffset = time * (0.2 + r * 0.08);

        ctx.save();
        ctx.rotate(angleOffset * 0.2 + tiltY);

        // Draw 3D Ring Ellipse
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, tiltX + (r * 0.2), 0, Math.PI * 2);
        ctx.strokeStyle = `hsl(${primaryHsl} / ${0.12 + r * 0.05})`;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsl(${primaryHsl} / 0.4)`;
        ctx.stroke();

        // Draw Orbiting Electrons / Energy Nodes
        for (let p = 0; p < particlesPerRing; p++) {
          const theta = (p / particlesPerRing) * Math.PI * 2 + time * (1 + r * 0.3);
          const px = Math.cos(theta) * rx;
          const py = Math.sin(theta) * ry;

          // Depth perspective scale
          const zScale = 0.7 + (Math.sin(theta) + 1) * 0.3;
          const nodeRadius = Math.max(0.1, 2.5 * zScale);
          const alpha = 0.3 + (Math.sin(theta) + 1) * 0.35;

          ctx.beginPath();
          ctx.arc(px, py, nodeRadius, 0, Math.PI * 2);
          ctx.fillStyle = `hsl(${primaryHsl} / ${alpha})`;
          ctx.fill();

          // Connect nearby orbital nodes with glowing energy threads
          if (p % 4 === 0) {
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(0, 0);
            ctx.strokeStyle = `hsl(${primaryHsl} / ${alpha * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        ctx.restore();
      }

      // Central 3D Glowing Energy Core
      const corePulse = 18 + Math.sin(time * 3) * 4;
      const coreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, corePulse * 2);
      coreGrad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      coreGrad.addColorStop(0.3, `hsl(${primaryHsl} / 0.6)`);
      coreGrad.addColorStop(1, `hsl(${primaryHsl} / 0)`);

      ctx.beginPath();
      ctx.arc(0, 0, corePulse * 2, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-70"
    />
  );
};
