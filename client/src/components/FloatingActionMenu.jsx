import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

function FloatingActionMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: '✍️', label: 'Write', link: '/create', color: 'from-blue-500 to-purple-500' },
    { icon: '🏠', label: 'Home', link: '/', color: 'from-green-500 to-teal-500' },
    { icon: '👤', label: 'Profile', link: '/profile', color: 'from-orange-500 to-red-500' },
    { icon: '📊', label: 'Admin', link: '/admin', color: 'from-pink-500 to-rose-500' }
  ];

  return (
    <div className="fixed bottom-6 left-6 z-30">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-2xl"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ➕
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="absolute bottom-16 left-0 space-y-3">
            {actions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, x: -20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.8 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={action.link}
                  className={`flex items-center space-x-3 px-4 py-3 bg-gradient-to-r ${action.color} text-white rounded-xl shadow-lg hover:shadow-xl transition-all`}
                  onClick={() => setIsOpen(false)}
                >
                  <span className="text-lg">{action.icon}</span>
                  <span className="font-sf font-medium">{action.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FloatingActionMenu;