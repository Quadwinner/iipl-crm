import { useEffect, useRef } from "react";

export const Footer3DBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    let mouseX = width / 2;
    let mouseY = height / 2;
    let time = 0;

    // 3D Grid parameters
    const rows = 24;
    const cols = 36;

    // Floating 3D Orbs/Particles
    class Orb {
      x: number;
      y: number;
      z: number;
      radius: number;
      baseAlpha: number;
      pulseSpeed: number;

      constructor() {
        this.x = (Math.random() - 0.5) * width * 1.5;
        this.y = (Math.random() - 0.5) * height * 1.2;
        this.z = Math.random() * 600 + 100;
        this.radius = Math.random() * 2.5 + 1;
        this.baseAlpha = Math.random() * 0.4 + 0.2;
        this.pulseSpeed = Math.random() * 0.03 + 0.01;
      }

      update() {
        this.y -= 0.4;
        if (this.y < -height / 2 - 100) {
          this.y = height / 2 + 100;
          this.x = (Math.random() - 0.5) * width * 1.5;
        }
      }

      draw(ctx: CanvasRenderingContext2D, time: number, primaryHsl: string) {
        const fov = 350;
        if (fov + this.z <= 0) return;
        const scale = fov / (fov + this.z);
        if (scale <= 0) return;

        const projX = this.x * scale + width / 2;
        const projY = this.y * scale + height / 2;

        if (projX < 0 || projX > width || projY < 0 || projY > height) return;

        const pulse = Math.sin(time * this.pulseSpeed) * 0.15;
        const currentAlpha = Math.max(0, Math.min(1, this.baseAlpha + pulse)) * scale;
        const drawRadius = Math.max(0.1, this.radius * scale * 1.5);

        ctx.beginPath();
        ctx.arc(projX, projY, drawRadius, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${primaryHsl} / ${currentAlpha})`;
        ctx.shadowBlur = 12 * scale;
        ctx.shadowColor = `hsl(${primaryHsl} / 0.6)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const orbs: Orb[] = Array.from({ length: 35 }, () => new Orb());

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

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);
      const primaryHsl = getComputedStyle(document.querySelector(".itoby-site") ?? document.documentElement).getPropertyValue("--primary-hsl").trim() || "75 100% 50%";

      // Perspective Grid Drawing
      const horizonY = height * 0.2;
      const mouseOffsetX = (mouseX / width - 0.5) * 60;
      const mouseOffsetY = (mouseY / height - 0.5) * 30;

      // Draw 3D Floating Terrain Grid
      ctx.save();
      ctx.lineWidth = 1;

      // Draw Perspective Lines
      for (let i = 0; i <= cols; i++) {
        const xPercent = i / cols;
        const startX = width * 0.5 + (xPercent - 0.5) * width * 0.2 + mouseOffsetX * 0.3;
        const endX = width * 0.5 + (xPercent - 0.5) * width * 1.8 + mouseOffsetX;

        const gradient = ctx.createLinearGradient(startX, horizonY, endX, height);
        gradient.addColorStop(0, `hsl(${primaryHsl} / 0.01)`);
        gradient.addColorStop(0.5, `hsl(${primaryHsl} / 0.12)`);
        gradient.addColorStop(1, `hsl(${primaryHsl} / 0.03)`);

        ctx.strokeStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(startX, horizonY);
        ctx.lineTo(endX, height);
        ctx.stroke();
      }

      // Draw Horizontal Grid Waves
      for (let j = 0; j <= rows; j++) {
        const progress = j / rows;
        const pSq = progress * progress;
        const currentY = horizonY + pSq * (height - horizonY) + mouseOffsetY * progress;
        const leftX = width * 0.5 - (0.5 * width * 1.8) * progress + mouseOffsetX * progress;
        const rightX = width * 0.5 + (0.5 * width * 1.8) * progress + mouseOffsetX * progress;

        ctx.beginPath();
        ctx.strokeStyle = `hsl(${primaryHsl} / ${pSq * 0.15})`;
        ctx.moveTo(leftX, currentY);
        ctx.lineTo(rightX, currentY);
        ctx.stroke();
      }
      ctx.restore();

      // Render Floating 3D Orbs
      orbs.forEach((orb) => {
        orb.update();
        orb.draw(ctx, time, primaryHsl);
      });

      // Mouse Spotlight Glow
      const spotGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 250);
      spotGrad.addColorStop(0, `hsl(${primaryHsl} / 0.1)`);
      spotGrad.addColorStop(0.5, `hsl(${primaryHsl} / 0.03)`);
      spotGrad.addColorStop(1, "transparent");

      ctx.fillStyle = spotGrad;
      ctx.fillRect(0, 0, width, height);

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
      className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-80"
    />
  );
};
