import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { cn } from '../lib/utils';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export default function TiltCard({ children, className, glow = true }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [enableTilt, setEnableTilt] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    const syncTilt = () => setEnableTilt(media.matches);

    syncTilt();
    media.addEventListener('change', syncTilt);

    return () => media.removeEventListener('change', syncTilt);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableTilt || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: enableTilt ? rotateX : '0deg',
        rotateY: enableTilt ? rotateY : '0deg',
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "relative w-full h-full rounded-2xl transition-all duration-200 ease-out",
        glow && "glow-border",
        className
      )}
    >
      <div 
        className="absolute inset-0 z-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ transform: enableTilt ? "translateZ(-10px)" : "none" }}
      />
      <div className="relative z-10 h-full w-full glass-card p-4 sm:p-6" style={{ transform: enableTilt ? "translateZ(20px)" : "none" }}>
        {children}
      </div>
    </motion.div>
  );
}
