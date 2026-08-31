import { useEffect, useRef, useState } from "react";
import { motion, useInView, useSpring, useTransform, type UseInViewOptions } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
  margin?: UseInViewOptions["margin"];
}

export const AnimatedCounter = ({
  value,
  suffix = "",
  duration = 2,
  className = "",
  margin = "0px",
}: AnimatedCounterProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin });
  const [hasAnimated, setHasAnimated] = useState(false);

  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );

  useEffect(() => {
    if (isInView && !hasAnimated) {
      spring.set(value);
      setHasAnimated(true);
    }
  }, [isInView, value, spring, hasAnimated]);

  return (
    <motion.span ref={ref} className={className}>
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  );
};
