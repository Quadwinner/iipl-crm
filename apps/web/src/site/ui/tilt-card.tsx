import React, { useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

export const TiltCard: React.FC<TiltCardProps> = ({ children, className = "" }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Rotation angles: max 12 degrees
  const rotateX = useTransform(y, [-0.5, 0.5], [12, -12]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-12, 12]);

  // Spring animation for natural fluid movement
  const springConfig = { damping: 25, stiffness: 220, mass: 0.8 };
  const springX = useSpring(rotateX, springConfig);
  const springY = useSpring(rotateY, springConfig);

  const rectRef = useRef<DOMRect | null>(null);

  const handleMouseEnter = () => {
    if (cardRef.current) {
      rectRef.current = cardRef.current.getBoundingClientRect();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    let rect = rectRef.current;
    if (!rect && cardRef.current) {
      rect = cardRef.current.getBoundingClientRect();
      rectRef.current = rect;
    }
    if (!rect) return;

    const width = rect.width;
    const height = rect.height;

    // Mouse coordinates mapped between -0.5 and 0.5
    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;

    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    rectRef.current = null;
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      style={{
        rotateX: springX,
        rotateY: springY,
        transformStyle: "preserve-3d",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative transition-shadow duration-300 ${className}`}
    >
      <div 
        style={{ transform: "translateZ(30px)" }} 
        className="w-full h-full transform-gpu"
      >
        {children}
      </div>
    </motion.div>
  );
};
