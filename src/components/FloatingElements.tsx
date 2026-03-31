import React from 'react';
import { motion } from 'motion/react';

export default function FloatingElements() {
  const elements = [
    { size: 40, color: 'primary', delay: 0, x: '10%', y: '10%' },
    { size: 60, color: 'blue-500', delay: 2, x: '80%', y: '20%' },
    { size: 30, color: 'green-500', delay: 4, x: '20%', y: '70%' },
    { size: 50, color: 'orange-500', delay: 1, x: '70%', y: '80%' },
    { size: 20, color: 'primary', delay: 3, x: '50%', y: '40%' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-10">
      {elements.map((el, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.2, 1],
            x: [el.x, `calc(${el.x} + 20px)`, el.x],
            y: [el.y, `calc(${el.y} - 20px)`, el.y],
          }}
          transition={{
            duration: 10 + i * 2,
            repeat: Infinity,
            delay: el.delay,
            ease: "easeInOut"
          }}
          className={`absolute rounded-full bg-${el.color}`}
          style={{ 
            width: el.size, 
            height: el.size,
            left: el.x,
            top: el.y,
            filter: 'blur(40px)'
          }}
        />
      ))}
    </div>
  );
}
