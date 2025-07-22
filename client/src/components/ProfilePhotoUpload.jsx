import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';

function ProfilePhotoUpload({ currentPhoto, onPhotoUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { isDark } = useTheme();

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview) return;

    setUploading(true);
    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, you would upload to a service like Cloudinary or AWS S3
      onPhotoUpdate(preview);
      setIsOpen(false);
      setPreview(null);
      toast.success('Profile photo updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile photo');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = () => {
    onPhotoUpdate(null);
    setIsOpen(false);
    toast.success('Profile photo removed');
  };

  return (
    <>
      <div className="relative group">
        <div className={`w-32 h-32 rounded-full overflow-hidden border-4 transition-all duration-300 ${
          isDark ? 'border-white/20 group-hover:border-blue-500/50' : 'border-gray-200 group-hover:border-blue-500/50'
        }`}>
          {currentPhoto ? (
            <img
              src={currentPhoto}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-4xl ${
              isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
            }`}>
              <i className="fas fa-user"></i>
            </div>
          )}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center shadow-lg"
        >
          <i className="fas fa-camera"></i>
        </motion.button>
      </div>

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
              className={`max-w-md w-full rounded-2xl p-6 ${
                isDark ? 'bg-gray-900/95 border border-white/10' : 'bg-white/95 border border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <h2 className={`text-xl font-bold mb-2 flex items-center justify-center gap-2 ${
                  isDark 
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400' 
                    : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600'
                }`}>
                  <i className="fas fa-camera"></i> Update Profile Photo
                </h2>
              </div>

              {preview ? (
                <div className="text-center mb-6">
                  <div className="w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-blue-500/50 mb-4">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-3 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleUpload}
                      disabled={uploading}
                      className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium disabled:opacity-50"
                    >
                      {uploading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Uploading...
                        </div>
                      ) : ( <>
                          <i className="fas fa-check mr-2"></i>
                          Save Photo
                        </>
                      )}
                    </motion.button>
                    <button
                      onClick={() => setPreview(null)}
                      className={`px-6 py-2 rounded-xl font-medium transition-colors ${
                        isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full p-4 rounded-xl border-2 border-dashed transition-all ${
                      isDark 
                        ? 'border-blue-500/50 hover:border-blue-500 bg-blue-500/10 hover:bg-blue-500/20' 
                        : 'border-blue-500/50 hover:border-blue-500 bg-blue-50 hover:bg-blue-100'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2 text-blue-500">
                        <i className="fas fa-folder-open"></i>
                      </div>
                      <p className={`font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        Choose Photo
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        JPG, PNG up to 5MB
                      </p>
                    </div>
                  </motion.button>

                  {currentPhoto && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={removePhoto}
                      className="w-full p-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium"
                    > 
                      <i className="fas fa-trash-alt mr-2"></i>
                      Remove Current Photo
                    </motion.button>
                  )}
                </div>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                }`}
              >
                <i className="fas fa-times"></i>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ProfilePhotoUpload;