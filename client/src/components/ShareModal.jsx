import React from 'react';
import { motion } from 'framer-motion';

function ShareModal({ isOpen, onClose, post, copied, setCopied, shareOptions, shareUrl, shareTitle }) {
  if (!isOpen) return null;
  
  // Create a portal container if it doesn't exist
  let portalContainer = document.getElementById('share-modal-portal');
  if (!portalContainer) {
    portalContainer = document.createElement('div');
    portalContainer.id = 'share-modal-portal';
    document.body.appendChild(portalContainer);
  }
  
  // Prevent body scrolling when modal is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 100000,
        backdropFilter: 'blur(5px)'
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        style={{
          backgroundColor: '#111827',
          borderRadius: '1rem',
          padding: '1rem',
          width: '320px',
          maxWidth: '90%',
          border: '2px solid #3b82f6',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-3">
          <h3 className="text-white font-bold text-lg mb-1">Share this post</h3>
          <p className="text-gray-400 text-xs truncate">{shareTitle}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {shareOptions.map((option, index) => (
            <motion.button
              key={option.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                option.action();
                if (option.name !== 'Copy Link') {
                  onClose();
                }
              }}
              className={`flex items-center space-x-1 p-2 ${
                option.name === 'Copy Link' ? 'bg-blue-600 hover:bg-blue-700' :
                option.name === 'Twitter' ? 'bg-blue-500 hover:bg-blue-600' :
                option.name === 'Facebook' ? 'bg-blue-700 hover:bg-blue-800' :
                option.name === 'LinkedIn' ? 'bg-indigo-600 hover:bg-indigo-700' :
                option.name === 'WhatsApp' ? 'bg-green-600 hover:bg-green-700' :
                'bg-red-600 hover:bg-red-700'
              } text-white rounded-xl font-medium text-sm transition-all duration-200 hover:shadow-lg`}
            >
              <div className="flex-shrink-0">{option.icon}</div>
              <span>{option.name === 'Copy Link' && copied ? 'Copied!' : option.name}</span>
            </motion.button>
          ))}
        </div>

        <div className="mt-3 p-2 bg-gray-800 rounded-lg">
          <p className="text-gray-400 text-xs mb-1">Direct Link:</p>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 bg-gray-700 text-white text-xs p-2 rounded-lg"
            />
            <button
              onClick={() => shareOptions[0].action()}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-colors"
            >
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ShareModal;