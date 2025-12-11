'use client';

import { motion } from 'framer-motion';

// Pre-generated fixed values to avoid hydration mismatch
const shapes = [
  { width: 120, height: 80, left: 10, top: 15, xOffset: 8, duration: 7, delay: 0.2 },
  { width: 90, height: 110, left: 75, top: 60, xOffset: -5, duration: 8, delay: 0.8 },
  { width: 70, height: 70, left: 45, top: 25, xOffset: 10, duration: 6, delay: 0.4 },
  { width: 100, height: 90, left: 25, top: 70, xOffset: -8, duration: 9, delay: 1.2 },
  { width: 60, height: 100, left: 85, top: 10, xOffset: 6, duration: 7.5, delay: 0.6 },
  { width: 80, height: 60, left: 55, top: 80, xOffset: -10, duration: 8.5, delay: 1.0 }
];

export function FloatingShapes() {
  return (
    <>
      {shapes.map((shape, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white/10 backdrop-blur-md"
          style={{
            width: shape.width,
            height: shape.height,
            left: `${shape.left}%`,
            top: `${shape.top}%`
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, shape.xOffset, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: shape.duration,
            repeat: Infinity,
            delay: shape.delay
          }}
        />
      ))}
    </>
  );
}
