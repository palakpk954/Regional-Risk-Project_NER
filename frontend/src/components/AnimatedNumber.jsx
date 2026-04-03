import { useEffect, useRef, useState } from 'react';

export default function AnimatedNumber({
  value,
  duration = 450,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}) {
  const numericValue = Number(value || 0);
  const [displayValue, setDisplayValue] = useState(numericValue);
  const previousValueRef = useRef(numericValue);

  useEffect(() => {
    const startValue = previousValueRef.current;
    const endValue = numericValue;
    const delta = endValue - startValue;

    if (delta === 0) {
      previousValueRef.current = endValue;
      return;
    }

    let frameId = 0;
    const startTime = performance.now();

    const step = (timestamp) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const next = startValue + delta * eased;
      setDisplayValue(next);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        previousValueRef.current = endValue;
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [numericValue, duration]);

  return (
    <span className={className}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
}
