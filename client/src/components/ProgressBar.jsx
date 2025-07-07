import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function ProgressBar() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.scrollY / scrollHeight) * 100;
      setScrollProgress(scrolled);
    };

    window.addEventListener('scroll', updateScrollProgress);
    return () => window.removeEventListener('scroll', updateScrollProgress);
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-blue-500/20 z-50"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
    >
      <motion.div
        className="h-full bg-blue-500 origin-left"
        style={{ scaleX: scrollProgress / 100 }}
        transition={{ duration: 0.1 }}
      />
    </motion.div>
  );
}

export default ProgressBar;