import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';

function AdvancedEditor({ value, onChange, placeholder }) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const editorRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const words = value.split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);
    setReadingTime(Math.ceil(words / 200));
  }, [value]);

  const insertText = (before, after = '') => {
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange({ target: { value: newText } });
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const formatText = (type) => {
    switch (type) {
      case 'bold':
        insertText('**', '**');
        break;
      case 'italic':
        insertText('*', '*');
        break;
      case 'heading':
        insertText('## ');
        break;
      case 'quote':
        insertText('> ');
        break;
      case 'code':
        insertText('`', '`');
        break;
      case 'link':
        insertText('[', '](url)');
        break;
      case 'list':
        insertText('- ');
        break;
    }
    toast.success(`✨ ${type} formatting applied!`);
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      formatText('bold');
    } else if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      formatText('italic');
    } else if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      formatText('link');
    }
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {showToolbar && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute top-0 left-0 right-0 z-10 p-3 rounded-t-2xl border-b ${
              isDark ? 'bg-gray-800/95 border-white/10' : 'bg-white/95 border-gray-200'
            }`}
          >
            <div className="flex items-center space-x-2 flex-wrap">
              <button 
                onClick={() => formatText('bold')} 
                className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
                  isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
                title="Bold (Ctrl+B)"
              >
                <strong>B</strong>
              </button>
              <button 
                onClick={() => formatText('italic')} 
                className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
                  isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
                title="Italic (Ctrl+I)"
              >
                <em>I</em>
              </button>
              <button 
                onClick={() => formatText('heading')} 
                className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
                  isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
                title="Heading"
              >
                H
              </button>
              <button 
                onClick={() => formatText('quote')} 
                className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
                  isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
                title="Quote"
              >
                "
              </button>
              <button 
                onClick={() => formatText('code')} 
                className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
                  isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
                title="Code"
              >
                &lt;/&gt;
              </button>
              <button 
                onClick={() => formatText('link')} 
                className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
                  isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
                title="Link (Ctrl+K)"
              >
                🔗
              </button>
              <button 
                onClick={() => formatText('list')} 
                className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
                  isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
                title="List"
              >
                •
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <textarea
        ref={editorRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowToolbar(true)}
        onBlur={() => setTimeout(() => setShowToolbar(false), 200)}
        placeholder={placeholder}
        className={`w-full p-6 rounded-2xl font-medium transition-all duration-300 focus:outline-none focus:ring-4 resize-none ${
          showToolbar ? 'pt-16' : ''
        } ${
          isDark 
            ? 'bg-gray-800/50 border border-white/10 text-white placeholder-gray-400 focus:border-green-400 focus:ring-green-400/20' 
            : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-green-500/20'
        }`}
        rows={12}
      />

      <div className={`flex items-center justify-between mt-3 text-sm ${
        isDark ? 'text-gray-400' : 'text-gray-600'
      }`}>
        <div className="flex items-center space-x-4">
          <span>📝 {wordCount} words</span>
          <span>⏱️ {readingTime} min read</span>
        </div>
        <div className="text-xs opacity-75">
          Tip: Focus to show formatting toolbar
        </div>
      </div>
    </div>
  );
}

export default AdvancedEditor;