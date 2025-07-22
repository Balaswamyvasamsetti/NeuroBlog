import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

function AIAgent() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const { isDark } = useTheme();
  
  // Function to render formatted content with images
  const renderFormattedContent = (content) => {
    if (!content) return null;
    
    try {
      // Clean up content format
      // Remove any title/summary/tags sections that might be in the content
      content = content
        .replace(/^title:\s*"[^"]*"\s*\n/m, '')
        .replace(/^summary:\s*"[^"]*"\s*\n/m, '')
        .replace(/^tags:\s*\[[^\]]*\]\s*\n/m, '')
        .replace(/^category:\s*"[^"]*"\s*\n/m, '')
        .replace(/^content:\s*\n/m, '');
      
      // Extract image URLs from content
      const imageRegex = /Image:\s*(https?:\/\/[^\s]+)/g;
      const imageMatches = [...content.matchAll(imageRegex)];
      const images = imageMatches.map(match => match[1]);
      
      // Remove image references from content
      let cleanContent = content.replace(/Image:\s*https?:\/\/[^\s]+\s*/g, '');
      cleanContent = cleanContent.replace(/Photo Credit:.*?\n/g, '');
      cleanContent = cleanContent.replace(/Additional Image:.*?\n/g, '');
      
      // Format content for display
      const formattedContent = cleanContent
        .replace(/#{1,6}\s+([^\n]+)/g, '<strong>$1</strong>') // Replace headers with bold
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // Replace bold
        .replace(/\*([^*]+)\*/g, '<em>$1</em>') // Replace italic
        .replace(/\n\n/g, '<br/><br/>') // Replace double newlines
        .replace(/\n/g, '<br/>') // Replace newlines
        .replace(/\{[\s\S]*?\}/g, '') // Remove any remaining JSON objects
        .replace(/title:\s*"[^"]*"\s*/g, '') // Remove any title markers
        .replace(/summary:\s*"[^"]*"\s*/g, '') // Remove any summary markers
        .replace(/tags:\s*\[[^\]]*\]\s*/g, '') // Remove any tags markers
        .replace(/category:\s*"[^"]*"\s*/g, ''); // Remove any category markers
      
      return (
        <div className="space-y-4">
          {/* Display first 500 characters of content */}
          <div 
            className="text-sm"
            dangerouslySetInnerHTML={{ 
              __html: formattedContent.substring(0, 1000) + '...' 
            }} 
          />
          
          {/* Display images if available */}
          {images.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Featured Images:</h4>
              <div className="grid grid-cols-2 gap-2">
                {images.slice(0, 2).map((imageUrl, index) => (
                  <div key={index} className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img 
                      src={imageUrl} 
                      alt={`Blog image ${index + 1}`} 
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/300x200?text=Image+Unavailable';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error('Error rendering content:', error);
      return <div className="whitespace-pre-wrap">{content.substring(0, 500)}...</div>;
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/ai-agent/suggestions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuggestions(response.data);
    } catch (error) {
      toast.error('Failed to fetch suggestions');
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = async () => {
    try {
      setGenerating(true);
      const response = await axios.post('/api/ai-agent/generate-suggestions', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success(`Generated ${response.data.suggestions.length} new suggestions!`);
      fetchSuggestions();
    } catch (error) {
      toast.error('Failed to generate suggestions');
    } finally {
      setGenerating(false);
    }
  };

  const approveSuggestion = async (id, shouldPublish = true) => {
    try {
      const response = await axios.post(`/api/ai-agent/suggestions/${id}/approve`, 
        { shouldPublish },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success(shouldPublish ? 'Suggestion approved and published!' : 'Suggestion approved!');
      fetchSuggestions();
      setSelectedSuggestion(null);
    } catch (error) {
      toast.error('Failed to approve suggestion');
    }
  };

  const publishSuggestion = async (id) => {
    try {
      const response = await axios.post(`/api/ai-agent/suggestions/${id}/publish`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Post published successfully!');
      fetchSuggestions();
      setSelectedSuggestion(null);
    } catch (error) {
      toast.error('Failed to publish post');
    }
  };

  const rejectSuggestion = async (id, adminNotes = '') => {
    try {
      await axios.post(`/api/ai-agent/suggestions/${id}/reject`, 
        { adminNotes },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success('Suggestion rejected');
      fetchSuggestions();
      setSelectedSuggestion(null);
    } catch (error) {
      toast.error('Failed to reject suggestion');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'approved': return 'text-green-400 bg-green-400/20';
      case 'published': return 'text-blue-400 bg-blue-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className={`p-6 rounded-2xl backdrop-blur-xl border ${
      isDark ? 'bg-gray-900/50 border-white/10' : 'bg-white/50 border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            🤖 AI Blog Agent
          </h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            AI-powered content suggestions for your blog
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={generateSuggestions}
          disabled={generating}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium disabled:opacity-50"
        >
          {generating ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating...</span>
            </div>
          ) : (
            '✨ Generate New'
          )}
        </motion.button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading suggestions...</p>
        </div>
      ) : suggestions.filter(s => s.status === 'pending').length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            No Suggestions Yet
          </h3>
          <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Generate AI-powered blog suggestions to keep your content fresh
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.filter(suggestion => suggestion.status === 'pending').map((suggestion) => (
            <motion.div
              key={suggestion._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border transition-all hover:scale-[1.02] cursor-pointer ${
                isDark 
                  ? 'bg-gray-800/50 border-white/10 hover:border-white/20' 
                  : 'bg-gray-100/50 border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedSuggestion(suggestion)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {suggestion.title}
                  </h3>
                  <p className={`text-sm mb-3 line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {suggestion.summary}
                  </p>
                  <div className="flex items-center space-x-4 text-xs">
                    <span className={`px-2 py-1 rounded-full ${getStatusColor(suggestion.status)}`}>
                      {suggestion.status}
                    </span>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                      {new Date(suggestion.generatedAt).toLocaleDateString()}
                    </span>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                      Source: {suggestion.source}
                    </span>
                  </div>
                </div>
                {suggestion.status === 'pending' && (
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        publishSuggestion(suggestion._id);
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                    >
                      🚀 Publish
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        rejectSuggestion(suggestion._id);
                      }}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors"
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Suggestion Detail Modal */}
      <AnimatePresence>
        {selectedSuggestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedSuggestion(null)}
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
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Blog Suggestion Preview
                </h2>
                <button
                  onClick={() => setSelectedSuggestion(null)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                  }`}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedSuggestion.title}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedSuggestion.summary}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedSuggestion.tags.map((tag, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 text-xs rounded-lg ${
                        isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                  <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Content Preview:
                  </h4>
                  <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {renderFormattedContent(selectedSuggestion.content)}
                  </div>
                </div>

                {selectedSuggestion.status === 'pending' && (
                  <div className="flex space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => publishSuggestion(selectedSuggestion._id)}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
                    >
                      🚀 Publish Now
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => rejectSuggestion(selectedSuggestion._id)}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium"
                    >
                      ✗ Reject
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AIAgent;