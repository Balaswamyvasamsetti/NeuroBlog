import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AIAssistant from '../components/AIAssistant';
import ImageGenerator from '../components/ImageGenerator';

function EditPost() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    summary: '',
    category: '',
    tags: [],
    status: 'draft'
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [originalPost, setOriginalPost] = useState(null);

  useEffect(() => {
    fetchPost();
    fetchCategories();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await axios.get(`/api/posts/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const post = response.data;
      
      // Check if user owns this post or is admin
      if (user && post.author._id !== user.id && user.role !== 'admin') {
        // Show an alert and redirect to home page
        alert('You can only edit posts that you have created.');
        navigate('/');
        return;
      }
      
      setOriginalPost(post);
      setFormData({
        title: post.title,
        body: post.body,
        summary: post.summary || '',
        category: post.category?._id || '',
        tags: post.tags || [],
        status: post.status
      });
      setSelectedImage(post.featuredImage);
    } catch (error) {
      console.error('Error fetching post:', error);
      alert('Error loading the post. You may not have permission to edit it.');
      navigate('/');
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
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

  const handleAISuggestion = (suggestion) => {
    setFormData(prev => ({ ...prev, body: suggestion }));
  };

  const handleImageSelect = (image) => {
    setSelectedImage(image);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.body) {
      alert('Title and content are required');
      return;
    }

    setLoading(true);
    try {
      const postData = {
        ...formData,
        category: formData.category || null,
        featuredImage: selectedImage ? {
          url: selectedImage.url,
          description: selectedImage.description,
          author: selectedImage.author,
          authorUrl: selectedImage.authorUrl
        } : null
      };
      
      await axios.put(`/api/posts/${id}`, postData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      navigate(`/post/${id}`);
    } catch (error) {
      alert(error.response?.data?.error || 'Error updating post');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="text-center">
          <h1 className="text-5xl font-sf font-black mb-4 neuro-text-shadow">
            <span className="gradient-text">Edit</span>
            <span className="gradient-text-2"> Your Story</span>
          </h1>
          <p className="text-gray-400 text-lg font-poppins">Update and improve your content</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Section */}
          <div className="ios-card p-6">
            <label className="block text-lg font-semibold text-gray-200 mb-4">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter your post title..."
              className="ios-input neuro-focus w-full text-xl font-sf"
              required
            />
          </div>

          {/* AI Image Generator */}
          <ImageGenerator 
            title={formData.title}
            content={formData.body}
            onImageSelect={handleImageSelect}
          />

          {/* Content Section */}
          <div className="ios-card p-6">
            <label className="block text-lg font-semibold text-gray-200 mb-4">Content</label>
            <textarea
              name="body"
              value={formData.body}
              onChange={handleChange}
              placeholder="Write your story here..."
              rows={12}
              className="ios-input neuro-focus w-full resize-none font-poppins"
              required
            />
          </div>

          {/* Summary Section */}
          <div className="ios-card p-6">
            <label className="block text-lg font-semibold text-gray-200 mb-4">Summary</label>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              placeholder="Brief summary of your post..."
              rows={3}
              className="ios-input neuro-focus w-full resize-none font-poppins"
            />
          </div>

          {/* Tags and Category */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="ios-card p-6">
              <label className="block text-lg font-semibold text-gray-200 mb-4">Tags</label>
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={handleTagsChange}
                placeholder="Enter tags separated by commas..."
                className="ios-input neuro-focus w-full font-sf"
              />
            </div>

            <div className="ios-card p-6">
              <label className="block text-lg font-semibold text-gray-200 mb-4">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="ios-input neuro-focus w-full font-sf"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status and Actions */}
          <div className="ios-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="text-lg font-semibold text-gray-200">Status:</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="ios-input neuro-focus font-sf"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => navigate(`/post/${id}`)}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors font-sf"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="btn-neuro neuro-glow px-8 py-3 font-sf font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <span>💾 Update Post</span>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </form>
        
        {/* AI Assistant */}
        <AIAssistant 
          content={formData.body}
          onSuggestion={handleAISuggestion}
        />
      </motion.div>
    </div>
  );
}

export default EditPost;