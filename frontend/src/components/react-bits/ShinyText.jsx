import React from 'react';

/**
 * ShinyText component from React Bits
 * High-tech glistening metallic / shimmer text animation.
 */
export const ShinyText = ({
  text,
  disabled = false,
  speed = 4,
  className = ""
}) => {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`inline-block bg-clip-text text-transparent ${
        disabled
          ? "text-slate-400"
          : "bg-gradient-to-r from-emerald-300 via-white to-emerald-400 bg-[length:200%_100%] animate-[shine_4s_linear_infinite]"
      } ${className}`}
      style={{
        animationDuration: !disabled ? animationDuration : undefined,
      }}
    >
      {text}
    </span>
  );
};

export default ShinyText;
