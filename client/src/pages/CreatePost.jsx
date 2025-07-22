import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AIAssistant from '../components/AIAssistant';
import ImageGenerator from '../components/ImageGenerator';


import { toast } from 'react-hot-toast';

function CreatePost() {
  const { user } = useContext(AuthContext);
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    summary: '',
    tags: [],
    category: '',
    status: 'draft'
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState({ titles: [], tags: [] });
  const [selectedImage, setSelectedImage] = useState(null);
  const [seoData, setSeoData] = useState(null);
  const [contentAnalysis, setContentAnalysis] = useState(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      console.log('Categories fetched:', response.data);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags }));
  };

  const generateTitleSuggestions = async () => {
    if (!formData.body) {
      toast.error('Please write some content first');
      return;
    }
    setAiLoading(true);
    try {
      const response = await axios.post('/api/gemini/suggest-title', 
        { content: formData.body },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      setSuggestions(prev => ({ ...prev, titles: response.data.titles }));
      toast.success('Title suggestions generated!');
    } catch (error) {
      toast.error('Failed to generate titles');
    } finally {
      setAiLoading(false);
    }
  };

  const generateSummary = async () => {
    if (!formData.body) {
      toast.error('Please write some content first');
      return;
    }
    setAiLoading(true);
    try {
      const response = await axios.post('/api/gemini/generate-summary',
        { content: formData.body },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      setFormData(prev => ({ ...prev, summary: response.data.summary }));
      toast.success('Summary generated successfully!');
    } catch (error) {
      toast.error('Failed to generate summary');
    } finally {
      setAiLoading(false);
    }
  };

  const generateTags = async () => {
    if (!formData.body && !formData.title) {
      toast.error('Please add title or content first');
      return;
    }
    setAiLoading(true);
    try {
      const response = await axios.post('/api/gemini/suggest-tags',
        { content: formData.body, title: formData.title },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      
      // Make sure we have an array of tags
      const tags = Array.isArray(response.data.tags) ? response.data.tags : 
                  typeof response.data.tags === 'string' ? response.data.tags.split(',').map(tag => tag.trim()) : [];
      
      setSuggestions(prev => ({ ...prev, tags }));
      toast.success('Tag suggestions generated!');
    } catch (error) {
      console.error('Error generating tags:', error);
      toast.error('Failed to generate tags');
    } finally {
      setAiLoading(false);
    }
  };

  const analyzeSEO = async () => {
    if (!formData.title || !formData.body) {
      toast.error('Please add title and content first');
      return;
    }
    setAiLoading(true);
    try {
      const response = await axios.post('/api/gemini/seo-optimize',
        { title: formData.title, content: formData.body },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      setSeoData(response.data.suggestions);
      toast.success('SEO analysis completed!');
    } catch (error) {
      toast.error('SEO analysis failed');
    } finally {
      setAiLoading(false);
    }
  };

  const analyzeContent = async () => {
    if (!formData.body) {
      toast.error('Please write some content first');
      return;
    }
    setAiLoading(true);
    try {
      const response = await axios.post('/api/gemini/analyze-content',
        { content: formData.body },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      setContentAnalysis(response.data.analysis);
      toast.success('Content analysis completed!');
    } catch (error) {
      toast.error('Content analysis failed');
    } finally {
      setAiLoading(false);
    }
  };

  const generateCategory = async () => {
    if (!formData.title && !formData.body) {
      toast.error('Please add title or content first');
      return;
    }
    setAiLoading(true);
    try {
      // Make sure we have categories loaded
      if (categories.length === 0) {
        await fetchCategories();
      }
      
      const response = await axios.post('/api/gemini/suggest-category',
        { title: formData.title, content: formData.body },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      
      // Find matching category or create suggestion
      const suggestedCategory = response.data.category;
      console.log('AI suggested category:', suggestedCategory);
      console.log('Available categories:', categories);
      
      // Case-insensitive matching
      const matchingCategory = categories.find(cat => 
        cat.name.toLowerCase().includes(suggestedCategory.toLowerCase()) ||
        suggestedCategory.toLowerCase().includes(cat.name.toLowerCase())
      );
      
      if (matchingCategory) {
        console.log('Found matching category:', matchingCategory);
        setFormData(prev => ({ ...prev, category: matchingCategory._id }));
        setShowCategoryDropdown(false); // Close dropdown after selection
        toast.success(`Category set to: ${matchingCategory.name}`);
      } else {
        toast.success(`AI suggests: ${suggestedCategory}`);
      }
    } catch (error) {
      console.error('Error generating category:', error);
      toast.error('Failed to generate category');
    } finally {
      setAiLoading(false);
    }
  };

  const handleImageSelect = (image) => {
    setSelectedImage(image);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.body) {
      toast.error('Title and content are required');
      return;
    }

    setLoading(true);
    try {
      const postData = {
        ...formData,
        featuredImage: selectedImage ? {
          url: selectedImage.url,
          description: selectedImage.description,
          author: selectedImage.author,
          authorUrl: selectedImage.authorUrl
        } : null
      };
      
      const response = await axios.post('/api/posts', postData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      toast.success(formData.status === 'published' ? 'Post published!' : 'Draft saved!');
      navigate(`/post/${response.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error creating post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className={`text-fluid-3xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Create Post
            </h1>
            <p className={`text-fluid-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>Write and publish your content</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Title Section */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-lg p-6 border ${
                isDark 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <label className={`text-sm font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Title</label>
                <button
                  type="button"
                  onClick={generateTitleSuggestions}
                  disabled={aiLoading || !formData.body}
                  className={`px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 ${
                    isDark 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {aiLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI Suggest
                    </span>
                  )}
                </button>
              </div>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter your captivating title..."
                className={`w-full p-3 rounded-md transition-colors focus:outline-none focus:ring-2 ${
                  isDark 
                    ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/50' 
                    : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/50'
                }`}
                required
              />
              {suggestions.titles.length > 0 && (
                <div className="mt-6 space-y-3">
                  <p className={`text-sm font-medium flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Suggestions:
                  </p>
                  {suggestions.titles.map((title, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, title }))}
                      className={`block w-full text-left p-3 rounded-md transition-colors ${
                        isDark 
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-gray-300'
                      }`}
                    >
                      {title}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Content Section */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-lg p-6 border ${
                isDark 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <label className={`text-sm font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Content</label>
                <div className="flex space-x-3">
                  <ImageGenerator 
                    postTitle={formData.title}
                    postContent={formData.body}
                    onImageSelect={handleImageSelect}
                  />
                  <button
                    type="button"
                    onClick={analyzeContent}
                    disabled={aiLoading || !formData.body}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                  >
                    {aiLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Analyze
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={analyzeSEO}
                    disabled={aiLoading || !formData.title || !formData.body}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                  >
                    {aiLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        SEO
                      </span>
                    )}
                  </button>
                </div>
              </div>
              <textarea
                name="body"
                value={formData.body}
                onChange={handleChange}
                placeholder="Write your amazing story here... Use AI features to enhance your content!"
                rows={12}
                className={`w-full p-3 rounded-md transition-colors focus:outline-none focus:ring-2 resize-none ${
                  isDark 
                    ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/50' 
                    : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/50'
                }`}
                required
              />
              
              {/* Content Analysis */}
              {contentAnalysis && (
                <div className={`mt-6 p-6 rounded-2xl border ${
                  isDark ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'
                }`}>
                  <h4 className={`font-bold mb-3 flex items-center gap-1 ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Content Analysis
                  </h4>
                  <div className={`text-sm whitespace-pre-line ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {contentAnalysis}
                  </div>
                </div>
              )}
              
              {/* SEO Analysis */}
              {seoData && (
                <div className={`mt-6 p-6 rounded-2xl border ${
                  isDark ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <h4 className={`font-bold mb-3 flex items-center gap-1 ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    SEO Optimization
                  </h4>
                  <div className={`text-sm whitespace-pre-line ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {seoData}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Featured Image Preview */}
            <AnimatePresence>
              {selectedImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`backdrop-blur-xl rounded-3xl p-6 border ${
                    isDark 
                      ? 'bg-gray-900/50 border-white/10' 
                      : 'bg-white/70 border-gray-200/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold flex items-center gap-1 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Featured Image
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className={`px-4 py-2 rounded-xl transition-colors ${
                        isDark ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' : 'bg-red-100 hover:bg-red-200 text-red-600'
                      }`}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="aspect-video rounded-2xl overflow-hidden">
                    <img
                      src={selectedImage.url}
                      alt={selectedImage.description}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className={`mt-3 text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {selectedImage.description} • by {selectedImage.author}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Summary Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`backdrop-blur-xl rounded-3xl p-8 border transition-all duration-300 hover:shadow-2xl ${
                isDark 
                  ? 'bg-gray-900/50 border-white/10 hover:border-cyan-500/30' 
                  : 'bg-white/70 border-gray-200/50 hover:border-cyan-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <label className={`text-xl font-bold flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Summary
                </label>
                <button
                  type="button"
                  onClick={generateSummary}
                  disabled={aiLoading || !formData.body}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  {aiLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Generate
                    </span>
                  )}
                </button>
              </div>
              <textarea
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                placeholder="Brief summary of your post..."
                rows={3}
                className={`w-full p-6 rounded-2xl font-medium transition-all duration-300 focus:outline-none focus:ring-4 resize-none ${
                  isDark 
                    ? 'bg-gray-800/50 border border-white/10 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20' 
                    : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20'
                }`}
              />
            </motion.div>

            {/* Tags and Category */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid md:grid-cols-2 gap-8"
            >
              <div className={`backdrop-blur-xl rounded-3xl p-8 border transition-all duration-300 hover:shadow-2xl ${
                isDark 
                  ? 'bg-gray-900/50 border-white/10 hover:border-green-500/30' 
                  : 'bg-white/70 border-gray-200/50 hover:border-green-500/30'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <label className={`text-xl font-bold flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Tags
                  </label>
                  <button
                    type="button"
                    onClick={generateTags}
                    disabled={aiLoading || (!formData.body && !formData.title)}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                  >
                    {aiLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Suggest
                      </span>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={handleTagsChange}
                  placeholder="Enter tags separated by commas..."
                  className={`w-full p-6 rounded-2xl font-medium transition-all duration-300 focus:outline-none focus:ring-4 ${
                    isDark 
                      ? 'bg-gray-800/50 border border-white/10 text-white placeholder-gray-400 focus:border-green-400 focus:ring-green-400/20' 
                      : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-green-500/20'
                  }`}
                />
                {suggestions.tags && suggestions.tags.length > 0 && (
                  <div className="mt-4">
                    <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Click to add suggested tags:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.tags.map((tag, index) => {
                        const isAlreadyAdded = formData.tags.includes(tag);
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              if (!isAlreadyAdded) {
                                const newTags = [...formData.tags, tag];
                                setFormData(prev => ({ ...prev, tags: newTags }));
                                toast.success(`Added tag: ${tag}`);
                              }
                            }}
                            disabled={isAlreadyAdded}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 ${
                              isAlreadyAdded
                                ? isDark 
                                  ? 'bg-gray-700/50 text-gray-500 border border-gray-600 cursor-not-allowed' 
                                  : 'bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed'
                                : isDark 
                                  ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30' 
                                  : 'bg-green-100 hover:bg-green-200 text-green-700 border border-green-300'
                            }`}
                          >
                            {isAlreadyAdded ? (
                              <span className="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {tag}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                {tag}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className={`backdrop-blur-xl rounded-3xl p-8 border transition-all duration-300 hover:shadow-2xl ${
                isDark 
                  ? 'bg-gray-900/50 border-white/10 hover:border-purple-500/30' 
                  : 'bg-white/70 border-gray-200/50 hover:border-purple-500/30'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <label className={`text-xl font-bold flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    Category
                  </label>
                  <button
                    type="button"
                    onClick={generateCategory}
                    disabled={aiLoading || (!formData.body && !formData.title)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                  >
                    {aiLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Suggest
                      </span>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className={`w-full p-6 rounded-2xl font-medium transition-all duration-300 focus:outline-none focus:ring-4 text-left flex items-center justify-between ${
                      isDark 
                        ? 'bg-gray-800/50 border border-white/10 text-white hover:border-purple-400 focus:border-purple-400 focus:ring-purple-400/20' 
                        : 'bg-gray-50 border border-gray-300 text-gray-900 hover:border-purple-500 focus:border-purple-500 focus:ring-purple-500/20'
                    }`}
                  >
                    <span>
                      {formData.category && categories.length > 0
                        ? categories.find(cat => cat._id === formData.category)?.name || 'Select a category'
                        : 'Select a category'
                      }
                    </span>
                    <span className={`transform transition-transform duration-200 ${
                      showCategoryDropdown ? 'rotate-180' : ''
                    }`}>
                      ▼
                    </span>
                  </button>
                  
                  {showCategoryDropdown && (
                    <div className={`absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-2xl backdrop-blur-xl z-50 max-h-60 overflow-y-auto ${
                      isDark 
                        ? 'bg-gray-800/95 border-white/10' 
                        : 'bg-white/95 border-gray-200'
                    }`}>
                      {categories.length === 0 ? (
                        <div className="p-4 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto mb-2"></div>
                          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Loading categories...</p>
                        </div>
                      ) : (
                        <>
                          <div 
                            className={`p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                              isDark 
                                ? 'hover:bg-purple-500/20 text-gray-300 hover:text-white' 
                                : 'hover:bg-purple-100 text-gray-600 hover:text-gray-900'
                            } ${!formData.category ? (isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600') : ''}`}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, category: '' }));
                              setShowCategoryDropdown(false);
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                              </svg>
                              <span className="font-medium">No Category</span>
                            </div>
                          </div>
                          {categories.map(category => (
                            <div
                              key={category._id}
                              className={`p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                                isDark 
                                  ? 'hover:bg-purple-500/20 text-gray-300 hover:text-white border-t border-white/5' 
                                  : 'hover:bg-purple-100 text-gray-600 hover:text-gray-900 border-t border-gray-100'
                              } ${formData.category === category._id ? (isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600') : ''}`}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, category: category._id }));
                                setShowCategoryDropdown(false);
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <span className="font-medium">{category.name}</span>
                                {formData.category === category._id && (
                                  <span className="ml-auto text-purple-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Publish Options */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`backdrop-blur-xl rounded-3xl p-8 border transition-all duration-300 hover:shadow-2xl ${
                isDark 
                  ? 'bg-gray-900/50 border-white/10' 
                  : 'bg-white/70 border-gray-200/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <label className={`text-xl font-bold flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Status:
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={`p-4 rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-4 ${
                      isDark 
                        ? 'bg-gray-800/50 border border-white/10 text-white focus:border-blue-400 focus:ring-blue-400/20' 
                        : 'bg-gray-50 border border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                
                <div className="flex space-x-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => navigate('/')}
                    className={`px-6 py-2 rounded-md font-semibold transition-colors ${
                      isDark 
                        ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                        : 'bg-gray-300 hover:bg-gray-400 text-gray-900'
                    }`}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className={`px-6 py-2 rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
                      isDark 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <span className="flex items-center gap-1">
                        {formData.status === 'published' ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Publish
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Save Draft
                          </>
                        )}
                      </span>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </form>
          
          {/* AI Assistant */}
          <AIAssistant
            content={formData.body}
            onSuggestion={(suggestion) => {
              setFormData(prev => ({ ...prev, body: prev.body + ' ' + suggestion }));
            }}
          />
          

          

        </motion.div>
      </div>
    </div>
  );
}

export default CreatePost;