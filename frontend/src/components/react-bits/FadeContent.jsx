import React from 'react';
import { motion } from 'framer-motion';

/**
 * FadeContent component from React Bits
 * Smoothly animates entrance of child content with spring physics.
 */
export const FadeContent = ({
  children,
  blur = true,
  duration = 0.5,
  easing = "easeOut",
  delay = 0,
  initialOpacity = 0,
  className = ""
}) => {
  return (
    <motion.div
      initial={{
        opacity: initialOpacity,
        y: 12,
        filter: blur ? "blur(4px)" : "none"
      }}
      animate={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)"
      }}
      transition={{
        duration,
        ease: easing,
        delay
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default FadeContent;
