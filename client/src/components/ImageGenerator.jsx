import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

function ImageGenerator({ onImageSelect, postTitle, postContent }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { isDark } = useTheme();

  const generateImages = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/gemini/generate-image', {
        title: postTitle,
        content: postContent,
        keywords: searchQuery
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setImages(response.data.images);
      const searchTerm = response.data.searchQuery || searchQuery || 'your content';
      toast.success(`🎆 Found ${response.data.images.length} images for: ${searchTerm}`);
    } catch (error) {
      toast.error('Failed to generate images');
      console.error('Image generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (image) => {
    onImageSelect(image);
    setIsOpen(false);
    toast.success('✅ Image selected for your post!');
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
          isDark 
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white' 
            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
        }`}
      >
        🖼️ AI Images
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl p-6 ${
                isDark ? 'bg-gray-900/95 border border-white/10' : 'bg-white/95 border border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${
                  isDark 
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400' 
                    : 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600'
                }`}>
                  🖼️ AI Image Generator
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                  }`}
                >
                  ✕
                </button>
              </div>

              <div className="mb-6">
                <div className="flex gap-3 mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter specific keywords (e.g., technology, nature, business)..."
                    className={`flex-1 px-4 py-3 rounded-xl transition-all ${
                      isDark 
                        ? 'bg-gray-800/50 border border-white/10 text-white placeholder-gray-400' 
                        : 'bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={generateImages}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      '🔍 Find Images'
                    )}
                  </motion.button>
                </div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  AI will analyze your content and find relevant, high-quality images. Leave blank to auto-generate keywords from your post.
                </p>
                {postTitle && (
                  <div className={`mt-2 p-2 rounded-lg text-xs ${isDark ? 'bg-gray-800/30 text-gray-300' : 'bg-gray-100/50 text-gray-600'}`}>
                    <strong>Post Title:</strong> {postTitle}
                  </div>
                )}
              </div>

              {loading && (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    🤖 AI is analyzing your content...
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Finding the most relevant and beautiful images
                  </p>
                </div>
              )}

              {images.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`group cursor-pointer rounded-xl overflow-hidden border transition-all hover:scale-105 ${
                        isDark ? 'border-white/10 hover:border-purple-500/50' : 'border-gray-200 hover:border-purple-500/50'
                      }`}
                      onClick={() => handleImageSelect(image)}
                    >
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={image.thumb || image.url}
                          alt={image.description}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-2 left-2 right-2 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="font-medium truncate">{image.description || 'Beautiful image'}</p>
                          <p className="text-xs opacity-75">by {image.author}</p>
                          {image.searchQuery && (
                            <p className="text-xs opacity-60 mt-1">🏷️ {image.searchQuery}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {images.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎨</div>
                  <p className={`text-lg mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Ready to create stunning visuals
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Click "Generate" to create AI-powered images for your post
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ImageGenerator;