import React from 'react';
import { LucideIcon, PlusCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: string;
  nudge?: boolean;
  nudgeText?: string;
}

export default function StatCard({ title, value, icon: Icon, trend, color = 'primary', nudge, nudgeText }: StatCardProps) {
  return (
    <motion.div 
      whileHover={{ 
        y: -8,
        scale: 1.02,
        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`zomato-card p-6 flex flex-col gap-4 relative overflow-hidden group cursor-pointer border-2 ${
        nudge ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'
      }`}
    >
      {/* Background Accent */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-${color} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500`} />
      
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${color}/10 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 text-${color}`} />
        </div>
        {nudge ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <PlusCircle className="w-6 h-6 text-orange-500" />
          </motion.div>
        ) : trend && (
          <motion.span 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
              trend.includes('Required') || trend.startsWith('-') 
                ? 'bg-red-50 text-red-600' 
                : 'bg-green-50 text-green-600'
            }`}
          >
            {trend}
          </motion.span>
        )}
      </div>

      <div>
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</h4>
        <motion.div 
          className="text-3xl font-bold text-secondary"
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {value}
        </motion.div>
        {nudge && nudgeText && (
          <p className="text-[10px] font-bold text-orange-600 mt-2 leading-tight">
            {nudgeText}
          </p>
        )}
      </div>

      {/* Interactive Bottom Bar */}
      <motion.div 
        className={`absolute bottom-0 left-0 h-1 bg-${color}`}
        initial={{ width: 0 }}
        whileHover={{ width: "100%" }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}
