import { useEffect, useRef } from "react";

interface GlowingParticles3DProps {
  count?: number;
  interactive?: boolean;
  className?: string;
}

export const GlowingParticles3D = ({ count, interactive = true, className }: GlowingParticles3DProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle class simulating a 3D coordinate space
    class Particle {
      x: number;
      y: number;
      z: number;
      radius: number;
      vx: number;
      vy: number;
      vz: number;

      constructor() {
        this.x = Math.random() * width - width / 2;
        this.y = Math.random() * height - height / 2;
        this.z = Math.random() * 1000 - 500;
        this.radius = 1 + Math.random() * 1.5;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.vz = (Math.random() - 0.5) * 0.4;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;

        // Bounce limits in 3D bounds
        const d = 500;
        if (this.x < -width / 2 || this.x > width / 2) this.vx *= -1;
        if (this.y < -height / 2 || this.y > height / 2) this.vy *= -1;
        if (this.z < -d || this.z > d) this.vz *= -1;
      }

      draw(ctx: CanvasRenderingContext2D, mouseX: number, mouseY: number, primaryHsl: string) {
        // Perspective projection
        const fov = 350;
        if (fov + this.z <= 0) return;
        const scale = fov / (fov + this.z);
        if (scale <= 0) return;
        const projX = this.x * scale + width / 2;
        const projY = this.y * scale + height / 2;

        if (projX < 0 || projX > width || projY < 0 || projY > height) return;

        // Distance check for mouse reactivity
        const dx = projX - mouseX;
        const dy = projY - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let size = Math.max(0.1, this.radius * scale);
        let alpha = scale * 0.4;

        if (interactive && dist < 180) {
          const force = (180 - dist) / 180;
          alpha += force * 0.4;
          size += force * 1.2;
          
          // Draw connecting line to mouse cursor
          ctx.beginPath();
          ctx.strokeStyle = `hsl(${primaryHsl} / ${force * 0.15 * scale})`;
          ctx.lineWidth = 0.5 * scale;
          ctx.moveTo(projX, projY);
          ctx.lineTo(mouseX, mouseY);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(projX, projY, Math.max(0.1, size), 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${primaryHsl} / ${alpha})`;
        ctx.fill();
      }
    }

    const defaultCount = Math.min(80, Math.floor((width * height) / 20000));
    const particleCount = count || defaultCount;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    if (interactive) {
      window.addEventListener("mousemove", handleMouseMove);
    }
    window.addEventListener("resize", handleResize);

    // Animation runner loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      const primaryHsl = getComputedStyle(document.querySelector(".itoby-site") ?? document.documentElement).getPropertyValue("--primary-hsl").trim() || "75 100% 50%";
      const fov = 350;

      // Slow, fluid 3D rotation based on cursor offset
      const rotY = (mouseX / width - 0.5) * 0.005;
      const rotX = (mouseY / height - 0.5) * 0.005;

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Rotate Y axis
        let nx = p.x * cosY - p.z * sinY;
        let nz = p.z * cosY + p.x * sinY;
        
        // Rotate X axis
        let ny = p.y * cosX - nz * sinX;
        p.z = nz * cosX + p.y * sinX;
        p.x = nx;
        p.y = ny;

        p.update();
        p.draw(ctx, mouseX, mouseY, primaryHsl);
      }

      // Draw constellation lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        if (fov + p1.z <= 0) continue;
        const scale1 = fov / (fov + p1.z);
        const x1 = p1.x * scale1 + width / 2;
        const y1 = p1.y * scale1 + height / 2;

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dz = Math.abs(p1.z - p2.z);
          if (dz > 120) continue;
          if (fov + p2.z <= 0) continue;

          const scale2 = fov / (fov + p2.z);
          const x2 = p2.x * scale2 + width / 2;
          const y2 = p2.y * scale2 + height / 2;

          const dx = x1 - x2;
          const dy = y1 - y2;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const alpha = ((130 - dist) / 130) * 0.12 * Math.min(scale1, scale2);
            ctx.beginPath();
            ctx.strokeStyle = `hsl(${primaryHsl} / ${alpha})`;
            ctx.lineWidth = 0.5 * Math.min(scale1, scale2);
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (interactive) {
        window.removeEventListener("mousemove", handleMouseMove);
      }
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [count, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={className || "fixed inset-0 pointer-events-none z-0"}
    />
  );
};
