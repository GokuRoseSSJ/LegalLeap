import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';

interface ComplianceScoreProps {
  score: number;
}

export default function ComplianceScore({ score }: ComplianceScoreProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Spring animation for the number
  const springScore = useSpring(0, { stiffness: 40, damping: 15 });
  const displayScore = useTransform(springScore, (latest) => Math.round(latest));

  useEffect(() => {
    springScore.set(score);
  }, [score, springScore]);

  // SVG Circle properties
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = useTransform(springScore, (latest) => 
    circumference - (latest / 100) * circumference
  );

  return (
    <motion.div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex items-center justify-center w-32 h-32 cursor-pointer"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Background Circle */}
      <svg className="w-full h-full -rotate-90 transform">
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-gray-100"
        />
        {/* Progress Circle */}
        <motion.circle
          cx="64"
          cy="64"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          className="text-primary transition-colors duration-500"
          animate={{
            stroke: score > 90 ? '#10b981' : score > 70 ? '#f59e0b' : '#ef4444'
          }}
        />
      </svg>
      
      {/* Score Text */}
      <div className="absolute flex flex-col items-center justify-center">
        <motion.span className="text-3xl font-bold text-secondary">
          {displayScore}
        </motion.span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Score</span>
      </div>

      {/* Hover Pulse Effect */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0.1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="absolute inset-0 bg-primary rounded-full"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

import { AnimatePresence } from 'motion/react';
