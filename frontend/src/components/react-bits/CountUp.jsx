import React, { useEffect, useState } from 'react';

/**
 * CountUp component from React Bits
 * Smoothly animates numbers with custom prefix, decimals, and duration.
 */
export const CountUp = ({
  to,
  from = 0,
  duration = 1.2,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}) => {
  const [current, setCurrent] = useState(from);

  useEffect(() => {
    let startTime = null;
    const startVal = Number(from) || 0;
    const endVal = Number(to) || 0;
    const durationMs = duration * 1000;

    let frameId;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / durationMs, 1);

      // Ease-out cubic curve
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const val = startVal + (endVal - startVal) * easeProgress;

      setCurrent(val);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        setCurrent(endVal);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [to, from, duration]);

  const formatted = current.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={`font-mono tracking-tight ${className}`}>
      {prefix}{formatted}{suffix}
    </span>
  );
};

export default CountUp;
