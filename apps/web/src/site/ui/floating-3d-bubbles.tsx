import { useEffect, useRef } from "react";

interface Floating3DBubblesProps {
  className?: string;
  count?: number;
  interactive?: boolean;
}

export const Floating3DBubbles = ({
  className = "",
  count = 25,
  interactive = true,
}: Floating3DBubblesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    let mouseX = -1000;
    let mouseY = -1000;

    class Bubble {
      x: number;
      y: number;
      z: number;
      radius: number;
      baseRadius: number;
      vx: number;
      vy: number;
      alpha: number;
      hue: number;
      floatPhase: number;
      floatSpeed: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.z = Math.random() * 500 + 50; // 3D Depth
        this.baseRadius = Math.random() * 22 + 8;
        this.radius = this.baseRadius;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = -(Math.random() * 0.6 + 0.2); // Upward float
        this.alpha = Math.random() * 0.45 + 0.15;
        this.hue = 75; // Primary Lime brand color accent
        this.floatPhase = Math.random() * Math.PI * 2;
        this.floatSpeed = Math.random() * 0.02 + 0.008;
      }

      update() {
        this.floatPhase += this.floatSpeed;
        this.x += this.vx + Math.sin(this.floatPhase) * 0.4;
        this.y += this.vy;

        // Reset if floated above canvas
        if (this.y + this.radius < -50) {
          this.y = height + 50;
          this.x = Math.random() * width;
        }

        // Screen edge bounds
        if (this.x < -50) this.x = width + 50;
        if (this.x > width + 50) this.x = -50;

        // Interactive mouse reaction (Bubbles push away from mouse)
        if (interactive) {
          const dx = this.x - mouseX;
          const dy = this.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 160;

          if (dist < maxDist) {
            const force = (maxDist - dist) / maxDist;
            const angle = Math.atan2(dy, dx);
            this.x += Math.cos(angle) * force * 5;
            this.y += Math.sin(angle) * force * 5;
            this.radius = this.baseRadius + force * 8;
          } else {
            this.radius += (this.baseRadius - this.radius) * 0.05;
          }
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        // Perspective scaling
        const fov = 400;
        if (fov + this.z <= 0) return;
        const scale = fov / (fov + this.z);
        if (scale <= 0) return;
        const drawRadius = Math.max(0.5, Math.abs(this.radius * scale));

        ctx.save();
        ctx.translate(this.x, this.y);

        // Glass sphere radial gradient
        const gradient = ctx.createRadialGradient(
          -drawRadius * 0.3,
          -drawRadius * 0.3,
          drawRadius * 0.1,
          0,
          0,
          drawRadius
        );

        gradient.addColorStop(0, `hsla(${this.hue}, 100%, 75%, ${this.alpha * 0.9})`);
        gradient.addColorStop(0.3, `hsla(${this.hue}, 90%, 55%, ${this.alpha * 0.4})`);
        gradient.addColorStop(0.75, `hsla(${this.hue}, 80%, 40%, ${this.alpha * 0.15})`);
        gradient.addColorStop(1, `hsla(${this.hue}, 100%, 50%, ${this.alpha * 0.6})`);

        // Render bubble body
        ctx.beginPath();
        ctx.arc(0, 0, drawRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Glass Rim Highlight
        ctx.lineWidth = 1.2 * scale;
        ctx.strokeStyle = `hsla(${this.hue}, 100%, 85%, ${this.alpha * 0.8})`;
        ctx.stroke();

        // 3D Specular Reflection Spot (Glass Highlight)
        ctx.beginPath();
        ctx.arc(-drawRadius * 0.35, -drawRadius * 0.35, drawRadius * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha * 0.85})`;
        ctx.fill();

        ctx.restore();
      }
    }

    const bubbleCount = Math.min(count, Math.floor((width * height) / 22000));
    const bubbles: Bubble[] = Array.from({ length: bubbleCount }, () => new Bubble());

    let isVisible = true;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible && !animationFrameId) {
            render();
          }
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas || !isVisible) return;
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    if (interactive) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      window.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    }
    window.addEventListener("resize", handleResize, { passive: true });

    const render = () => {
      if (!isVisible) {
        animationFrameId = 0;
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Render all 3D glass bubbles
      for (let i = 0; i < bubbles.length; i++) {
        bubbles[i].update();
        bubbles[i].draw(ctx);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (interactive) {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseleave", handleMouseLeave);
      }
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [count, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none z-0 ${className}`}
    />
  );
};
