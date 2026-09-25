'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';

/**
 * Fade-In Animation Primitive
 */
export function FadeIn({
  children,
  duration = 0.25,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Slide-Up Animation Primitive
 */
export function SlideUp({
  children,
  offset = 8,
  duration = 0.25,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  offset?: number;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: offset }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -offset }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger Container & Child
 */
export function StaggerContainer({
  children,
  staggerDelay = 0.05,
  className = '',
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.3 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Financial Number Counter with Indian Currency Formatter
 * Smoothly interpolates from 0 -> value on mount without lag
 */
export function NumberCounter({
  value,
  prefix = '₹',
  decimals = 0,
  className = '',
}: {
  value: number;
  prefix?: string;
  decimals?: number;
  className?: string;
}) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(latest);
    });
    return () => unsubscribe();
  }, [spring]);

  const formatted = displayValue.toLocaleString('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });

  return (
    <span className={`tabular-nums font-mono font-black ${className}`}>
      {prefix}{formatted}
    </span>
  );
}
