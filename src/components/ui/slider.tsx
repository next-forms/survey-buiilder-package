import React, { useEffect, useRef, useState } from "react";
import { cn } from '../../lib/utils';;

interface SliderProps {
  id?: number | string,
  min?: number;
  max?: number;
  step?: number;
  value?: number[];
  disabled?: boolean;
  onValueChange?: (value: number[]) => void;
  className?: string;
}

const Slider: React.FC<SliderProps> = ({
  id = 0,
  min = 0,
  max = 100,
  step = 1,
  value = [0],
  disabled = false,
  onValueChange,
  className,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);
  const [internalValues, setInternalValues] = useState<number[]>(value);

  // Update internal value when prop value changes
  useEffect(() => {
    setInternalValues(value);
  }, [value]);

  // Normalize value to stay within min/max and follow step
  const normalizeValue = (val: number): number => {
    const clampedValue = Math.min(max, Math.max(min, val));
    const stepCount = Math.round((clampedValue - min) / step);
    return min + stepCount * step;
  };

  // Calculate percentage for positioning
  const getPercentage = (val: number): number => {
    return ((val - min) / (max - min)) * 100;
  };

  // Handle user interactions
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;

    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;

    const percentage = (e.clientX - rect.left) / rect.width;
    const newValue = min + percentage * (max - min);
    const normalizedValue = normalizeValue(newValue);

    // Update the first thumb value
    const newValues = [...internalValues];
    newValues[0] = normalizedValue;
    setInternalValues(newValues);
    onValueChange?.(newValues);
  };

  const handleThumbMouseDown = (index: number) => (e: React.MouseEvent) => {
    if (disabled) return;

    e.preventDefault();
    setDragging(index);

    // Add document-level event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (dragging === null || !trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const percentage = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const newValue = min + percentage * (max - min);
    const normalizedValue = normalizeValue(newValue);

    // Update the dragging thumb's value
    const newValues = [...internalValues];
    newValues[dragging] = normalizedValue;
    setInternalValues(newValues);
    onValueChange?.(newValues);
  };

  const handleMouseUp = () => {
    setDragging(null);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div
        ref={trackRef}
        className="relative h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800"
        onClick={handleTrackClick}
      >
        {/* Track fill between min and first thumb */}
        <div
          className="absolute h-full rounded-full bg-primary"
          style={{
            left: '0%',
            width: `${getPercentage(internalValues[0])}%`,
          }}
        />

        {/* Thumbs */}
        {internalValues.map((val, index) => (
          <div
            key={index}
            ref={(el) => (thumbRefs.current[index] = el as any)}
            className={cn(
              "absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none",
              dragging === index && "ring-2 ring-ring ring-offset-2"
            )}
            style={{
              left: `${getPercentage(val)}%`,
            }}
            onMouseDown={handleThumbMouseDown(index)}
            role="slider"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={val}
            tabIndex={disabled ? -1 : 0}
          />
        ))}
      </div>
    </div>
  );
};

export { Slider };
