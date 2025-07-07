import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

function AIAssistant({ content, onSuggestion }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeTab, setActiveTab] = useState('improve');


  const aiActions = [
    { id: 'improve', icon: '✨', label: 'Improve', color: 'from-blue-500 to-purple-500' },
    { id: 'continue', icon: '📝', label: 'Continue', color: 'from-green-500 to-teal-500' },
    { id: 'rephrase', icon: '🔄', label: 'Rephrase', color: 'from-orange-500 to-red-500' },
    { id: 'expand', icon: '📈', label: 'Expand', color: 'from-pink-500 to-rose-500' },
    { id: 'summarize', icon: '📋', label: 'Summarize', color: 'from-indigo-500 to-blue-500' },
  ];

  const handleAIAction = async (action) => {
    if (!content) return;
    
    setLoading(true);
    try {
      const response = await axios.post('/api/gemini/writing-assistant', {
        action,
        text: content,
        context: action === 'tone' ? 'professional' : undefined
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setSuggestions(prev => [...prev, {
        id: Date.now(),
        action,
        original: content.substring(0, 100) + '...',
        suggestion: response.data.result,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error) {
      console.error('AI Assistant error:', error);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (suggestion) => {
    if (onSuggestion) {
      onSuggestion(suggestion.suggestion);
    }
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  return (
    <div className="fixed bottom-6 right-20 z-40">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 flex items-center justify-center text-xl shadow-2xl transition-all duration-300"
        title="AI Writing Assistant"
      >
        🤖
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="absolute bottom-16 right-0 p-6 rounded-2xl w-96 max-h-[500px] overflow-y-auto backdrop-blur-xl border shadow-2xl bg-gray-900/90 border-white/10"
          >
            <div className="text-center mb-4">
              <h3 className="text-lg font-sf font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-400">AI Writing Assistant</h3>
              <p className="text-xs text-gray-400">Select an action to enhance your content</p>
            </div>

            {/* AI Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {aiActions.map(action => (
                <motion.button
                  key={action.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAIAction(action.id)}
                  disabled={loading || !content}
                  className={`p-3 rounded-xl bg-gradient-to-r ${action.color} text-white font-sf font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
                >
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </motion.button>
              ))}
            </div>

            {loading && (
              <div className="text-center py-4">
                <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm font-sf text-gray-400">AI is thinking...</p>
              </div>
            )}

            {/* Suggestions */}
            <div className="space-y-3">
              {suggestions.map(suggestion => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-xl backdrop-blur-sm border bg-gray-800/50 border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-sf font-medium text-blue-400">
                      {suggestion.action.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono text-gray-500">
                      {suggestion.timestamp}
                    </span>
                  </div>
                  
                  <div className="text-sm mb-3 font-poppins leading-relaxed text-gray-300">
                    {suggestion.suggestion}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => applySuggestion(suggestion)}
                      className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-sf font-medium transition-colors"
                    >
                      ✅ Apply
                    </button>
                    <button
                      onClick={() => setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))}
                      className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-sf font-medium transition-colors"
                    >
                      ❌ Dismiss
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {suggestions.length === 0 && !loading && (
              <div className="text-center py-4 text-sm font-poppins text-gray-400">
                Start writing and use AI actions to enhance your content!
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AIAssistant;