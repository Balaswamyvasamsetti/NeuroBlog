import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function ShareButton({ post, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/post/${post._id}`;
  const shareTitle = post.title;
  const shareText = post.summary || post.body?.substring(0, 100) || 'Check out this amazing post!';

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: '🔗',
      action: () => copyToClipboard(),
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Twitter',
      icon: '🐦',
      action: () => shareToTwitter(),
      color: 'from-blue-400 to-blue-600'
    },
    {
      name: 'Facebook',
      icon: '📘',
      action: () => shareToFacebook(),
      color: 'from-blue-600 to-blue-800'
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      action: () => shareToLinkedIn(),
      color: 'from-blue-700 to-indigo-700'
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      action: () => shareToWhatsApp(),
      color: 'from-green-500 to-green-600'
    },
    {
      name: 'Email',
      icon: '📧',
      action: () => shareViaEmail(),
      color: 'from-red-500 to-pink-500'
    }
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}&hashtags=NeuroBlog,AI,Blogging`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareTitle)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}&summary=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareTitle} - ${shareUrl}`)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out: ${shareTitle}`);
    const body = encodeURIComponent(`I thought you might be interested in this post:\n\n${shareTitle}\n\n${shareText}\n\nRead more: ${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleNativeShare}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-sf font-medium transition-all duration-200 shadow-lg"
      >
        <span>📤</span>
        <span>Share</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute top-full mt-2 right-0 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-50 min-w-64"
          >
            <div className="text-center mb-4">
              <h3 className="text-white font-sf font-semibold mb-1">Share this post</h3>
              <p className="text-gray-400 text-sm font-poppins">{shareTitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                      setIsOpen(false);
                    }
                  }}
                  className={`flex items-center space-x-2 p-3 ${
                    option.name === 'Copy Link' ? 'bg-blue-600 hover:bg-blue-700' :
                    option.name === 'Twitter' ? 'bg-blue-500 hover:bg-blue-600' :
                    option.name === 'Facebook' ? 'bg-blue-700 hover:bg-blue-800' :
                    option.name === 'LinkedIn' ? 'bg-indigo-600 hover:bg-indigo-700' :
                    option.name === 'WhatsApp' ? 'bg-green-600 hover:bg-green-700' :
                    'bg-red-600 hover:bg-red-700'
                  } text-white rounded-xl font-sf font-medium text-sm transition-all duration-200 hover:shadow-lg`}
                >
                  <span className="text-lg">{option.icon}</span>
                  <span>{option.name === 'Copy Link' && copied ? 'Copied!' : option.name}</span>
                </motion.button>
              ))}
            </div>

            <div className="mt-4 p-3 bg-gray-800/50 rounded-xl">
              <p className="text-gray-400 text-xs font-mono mb-2">Direct Link:</p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-gray-700/50 text-white text-xs p-2 rounded-lg font-mono"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-sf transition-colors"
                >
                  {copied ? '✓' : '📋'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default ShareButton;