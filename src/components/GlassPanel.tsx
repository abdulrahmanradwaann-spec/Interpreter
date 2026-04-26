import { ReactNode } from "react";
import { cn } from "../lib/utils";
import { motion } from "motion/react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
}

export function GlassPanel({ children, className, animate = true }: GlassPanelProps) {
  const Component = animate ? motion.div : 'div';
  
  return (
    <Component
      initial={animate ? { opacity: 0, y: 20 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      className={cn(
        "glass-panel rounded-3xl p-6 transition-all duration-300",
        className
      )}
    >
      {children}
    </Component>
  );
}
