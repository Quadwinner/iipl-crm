
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ChevronRight, Sparkles } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeroBannerProps {
  title: string;
  description?: string;
  breadcrumbs: BreadcrumbItem[];
  badge?: string;
}

export const PageHeroBanner = ({
  title,
  description,
  breadcrumbs,
  badge,
}: PageHeroBannerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 280);

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

    // 3D Particles for Hero Banner
    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 400 + 50,
      radius: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
    }));

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      const tiltX = (mouseX / width - 0.5) * 40;
      const tiltY = (mouseY / height - 0.5) * 20;

      const primaryHsl = getComputedStyle(document.querySelector(".itoby-site") ?? document.documentElement).getPropertyValue("--primary-hsl").trim() || "75 100% 50%";

      // 3D Perspective Wave Grid
      ctx.save();
      ctx.strokeStyle = `hsl(${primaryHsl} / 0.08)`;
      ctx.lineWidth = 1;

      const gridCols = 20;
      for (let i = 0; i <= gridCols; i++) {
        const x = (i / gridCols) * width;
        ctx.beginPath();
        ctx.moveTo(x + tiltX * 0.2, 0);
        ctx.lineTo(x + tiltX * 0.8, height);
        ctx.stroke();
      }

      ctx.restore();

      // Render Floating 3D Nodes
      particles.forEach((p) => {
        p.x += p.vx + Math.sin(time + p.z) * 0.2;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const fov = 300;
        const scale = fov / (fov + p.z);
        const projX = p.x + tiltX * scale * 0.3;
        const projY = p.y + tiltY * scale * 0.3;

        ctx.beginPath();
        ctx.arc(projX, projY, Math.max(0.1, p.radius * scale * 1.4), 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${primaryHsl} / ${0.4 * scale})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsl(${primaryHsl} / 0.5)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Ambient Mouse Glow
      const spotGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 180);
      spotGrad.addColorStop(0, `hsl(${primaryHsl} / 0.12)`);
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

  // Generate Schema.org Breadcrumb JSON-LD for SEO
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.itobyinfotech.com",
      },
      ...breadcrumbs.map((item, idx) => ({
        "@type": "ListItem",
        position: idx + 2,
        name: item.label,
        item: item.path
          ? `https://www.itobyinfotech.com${item.path.startsWith("/") ? item.path : "/" + item.path}`
          : "https://www.itobyinfotech.com",
      })),
    ],
  };

  return (
    <section className="relative pt-28 pb-12 overflow-hidden bg-card/40 border-b border-border/50">
      {/* 3D Interactive Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-80"
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="container-wide relative z-10">
        {/* Glassmorphic 3D Breadcrumb Navigation */}
        <motion.nav
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          aria-label="Breadcrumb"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/60 backdrop-blur-xl border border-border/60 shadow-lg shadow-primary/5 mb-6"
        >
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group"
          >
            <Home size={14} className="group-hover:scale-110 transition-transform text-primary" />
            <span>Home</span>
          </Link>

          {breadcrumbs.map((item, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <ChevronRight size={12} className="text-muted-foreground/60" />
                {item.path && !isLast ? (
                  <Link
                    to={item.path}
                    className="text-muted-foreground hover:text-primary transition-colors font-medium"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-primary font-semibold tracking-wide">
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
        </motion.nav>

        {/* Title & Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-3xl"
        >
          {badge && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles size={12} className="animate-pulse" />
              {badge}
            </div>
          )}
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-3">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
};
