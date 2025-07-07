import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

function VoiceControl() {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
      console.warn('Speech recognition not supported in this browser');
    }

    // Listen for navbar voice control toggle
    const handleVoiceToggle = () => {
      setIsOpen(true);
      if (!isVoiceEnabled) {
        initializeVoiceRecognition();
      }
    };
    
    window.addEventListener('toggleVoiceControl', handleVoiceToggle);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.removeEventListener('toggleVoiceControl', handleVoiceToggle);
    };
  }, [isVoiceEnabled]);

  const initializeVoiceRecognition = async () => {
    if (!isSupported) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      setIsPermissionGranted(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      setupRecognition();
      setIsVoiceEnabled(true);
      toast.success('🎤 Voice control enabled!');
    } catch (error) {
      console.error('Microphone permission denied:', error);
      toast.error('Microphone permission required for voice control');
      setIsPermissionGranted(false);
    }
  };

  const setupRecognition = () => {
    const recognition = recognitionRef.current;
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;
    recognition.grammars = null;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      toast.success('🎤 Listening... Speak now!', { duration: 2000 });
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
          setConfidence(result[0].confidence);
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const fullTranscript = finalTranscript || interimTranscript;
      setTranscript(fullTranscript);

      if (finalTranscript) {
        processVoiceCommand(finalTranscript.toLowerCase().trim());
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      switch (event.error) {
        case 'no-speech':
          toast.error('No speech detected. Please try again.');
          break;
        case 'audio-capture':
          toast.error('Microphone not accessible. Please check permissions.');
          break;
        case 'not-allowed':
          toast.error('Microphone permission denied. Please enable microphone access.');
          break;
        case 'network':
          toast.error('Network error. Please check your connection.');
          break;
        default:
          toast.error('Speech recognition error. Please try again.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  // Fuzzy string matching function
  const fuzzyMatch = (str1, str2, threshold = 0.7) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length >= threshold;
  };

  const levenshteinDistance = (str1, str2) => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
    for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  const processVoiceCommand = (command) => {
    console.log('Processing voice command:', command);
    
    // Normalize command
    const normalizedCommand = command
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\b(please|can you|could you|i want to|let me|take me to|open|show me|go to|navigate to)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Define command patterns with multiple variations
    const commandPatterns = {
      // Navigation commands
      home: ['home', 'homepage', 'home page', 'main page', 'start page', 'beginning'],
      create: ['create', 'create post', 'new post', 'write post', 'add post', 'compose', 'write', 'new blog', 'make post'],
      profile: ['profile', 'my profile', 'user profile', 'account', 'my account', 'user account'],
      admin: ['admin', 'dashboard', 'admin panel', 'admin dashboard', 'control panel', 'administration'],
      login: ['login', 'sign in', 'log in', 'signin', 'authenticate', 'sign on'],
      
      // Voice control
      enableVoice: ['enable voice', 'voice on', 'start voice', 'turn on voice', 'activate voice'],
      disableVoice: ['disable voice', 'voice off', 'stop voice', 'turn off voice', 'deactivate voice'],
      
      // Theme commands
      darkMode: ['dark mode', 'dark theme', 'night mode', 'dark', 'switch to dark', 'enable dark'],
      lightMode: ['light mode', 'light theme', 'day mode', 'light', 'switch to light', 'bright mode'],
      
      // Actions
      scrollUp: ['scroll up', 'go up', 'top', 'scroll to top', 'page up'],
      scrollDown: ['scroll down', 'go down', 'bottom', 'scroll to bottom', 'page down'],
      refresh: ['refresh', 'reload', 'refresh page', 'reload page'],
      back: ['back', 'go back', 'previous', 'previous page'],
      menu: ['menu', 'navigation', 'nav', 'open menu', 'show menu'],
      
      // Help
      help: ['help', 'commands', 'what can you do', 'available commands', 'voice commands']
    };
    
    // Check each command pattern
    for (const [action, patterns] of Object.entries(commandPatterns)) {
      for (const pattern of patterns) {
        if (normalizedCommand.includes(pattern) || 
            command.toLowerCase().includes(pattern) ||
            fuzzyMatch(normalizedCommand, pattern, 0.8)) {
          
          switch (action) {
            case 'home':
              navigate('/');
              toast.success('🏠 Navigating to Home');
              return;
            case 'create':
              navigate('/create');
              toast.success('✍️ Opening Create Post');
              return;
            case 'profile':
              navigate('/profile');
              toast.success('👤 Opening Profile');
              return;
            case 'admin':
              navigate('/admin');
              toast.success('🛠️ Opening Admin Dashboard');
              return;
            case 'login':
              navigate('/login');
              toast.success('🔐 Opening Login');
              return;
            case 'enableVoice':
              if (!isVoiceEnabled) {
                initializeVoiceRecognition();
              } else {
                toast.info('Voice control is already enabled');
              }
              return;
            case 'disableVoice':
              setIsVoiceEnabled(false);
              setIsListening(false);
              toast.success('🔇 Voice control disabled');
              return;
            case 'darkMode':
              if (!isDark) {
                toggleTheme();
                toast.success('🌙 Switched to dark mode');
              } else {
                toast.info('Already in dark mode');
              }
              return;
            case 'lightMode':
              if (isDark) {
                toggleTheme();
                toast.success('☀️ Switched to light mode');
              } else {
                toast.info('Already in light mode');
              }
              return;
            case 'scrollUp':
              window.scrollTo({ top: 0, behavior: 'smooth' });
              toast.success('⬆️ Scrolling to top');
              return;
            case 'scrollDown':
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
              toast.success('⬇️ Scrolling to bottom');
              return;
            case 'refresh':
              window.location.reload();
              toast.success('🔄 Refreshing page');
              return;
            case 'back':
              window.history.back();
              toast.success('⬅️ Going back');
              return;
            case 'menu':
              const menuButton = document.querySelector('[data-mobile-menu]');
              if (menuButton) {
                menuButton.click();
                toast.success('📱 Opening Menu');
              } else {
                toast.info('📋 Available: Home, Create, Profile, Admin');
              }
              return;
            case 'help':
              toast.success('🗣️ Say: "Home", "Create Post", "Profile", "Dark Mode", "Menu", "Scroll Up", "Back", "Refresh"', { duration: 4000 });
              return;
          }
        }
      }
    }
    
    // Search command handling
    if (command.includes('search for') || command.includes('find')) {
      const searchTerm = command.replace(/search for|find/g, '').trim();
      if (searchTerm) {
        navigate(`/?search=${encodeURIComponent(searchTerm)}`);
        toast.success(`🔍 Searching for: ${searchTerm}`);
      } else {
        const searchInput = document.querySelector('input[placeholder*="Search"]');
        if (searchInput) {
          searchInput.focus();
          toast.success('🔍 Search box focused');
        }
      }
      return;
    }
    
    // If no exact match, try partial matching with lower threshold
    const suggestions = [];
    for (const [action, patterns] of Object.entries(commandPatterns)) {
      for (const pattern of patterns) {
        if (fuzzyMatch(normalizedCommand, pattern, 0.6)) {
          suggestions.push(pattern);
        }
      }
    }
    
    if (suggestions.length > 0) {
      toast.error(`❓ Did you mean: "${suggestions[0]}"? Try saying it more clearly.`);
    } else {
      toast.error(`❓ Command "${command}" not recognized. Say "help" for available commands.`);
    }
  };

  const startListening = () => {
    if (!isSupported) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    if (!isVoiceEnabled) {
      toast.error('Please enable voice control first');
      return;
    }

    if (!recognitionRef.current) {
      toast.error('Speech recognition not initialized');
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      toast.error('Failed to start voice recognition');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className={`fixed bottom-20 sm:bottom-24 left-2 sm:left-6 z-50 p-3 sm:p-6 rounded-xl sm:rounded-2xl w-72 sm:w-80 backdrop-blur-xl border shadow-2xl xs-device sm-device md-device touch-friendly ${
              isDark 
                ? 'bg-gray-900/90 border-white/10 text-white' 
                : 'bg-white/90 border-gray-200 text-gray-900'
            }`}
          >
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                  isVoiceEnabled 
                    ? 'bg-blue-600' 
                    : isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  🎤
                </div>
              </div>
              <h3 className={`text-xl font-sf font-bold mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Voice Control
              </h3>
              <p className={`text-sm font-medium ${
                isVoiceEnabled 
                  ? isDark ? 'text-green-400' : 'text-green-600'
                  : isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {isVoiceEnabled ? '✅ Active & Ready' : '⚪ Disabled'}
              </p>
            </div>

            {/* Voice Control Status */}
            <div className={`mb-6 p-6 rounded-2xl border-2 transition-all duration-300 ${
              isVoiceEnabled
                ? isDark
                  ? 'border-green-500/30 bg-green-500/10'
                  : 'border-green-400/30 bg-green-50'
                : isDark
                  ? 'border-gray-600/50 bg-gray-800/30'
                  : 'border-gray-300/50 bg-gray-100/30'
            }`}>
              <div className="text-center">
                <div className="text-3xl mb-3">
                  {isVoiceEnabled ? '🟢' : '🔒'}
                </div>
                <h4 className={`font-bold text-lg mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {isVoiceEnabled ? 'Voice Control Active' : 'Voice Control Disabled'}
                </h4>
                <p className={`text-sm mb-4 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {isVoiceEnabled 
                    ? 'You can now control the app with voice commands' 
                    : 'Enable voice control to use hands-free navigation'
                  }
                </p>
                {!isVoiceEnabled && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={initializeVoiceRecognition}
                    className="w-full py-2 px-4 rounded-md font-semibold text-white transition-colors bg-blue-600 hover:bg-blue-700"
                  >
                    🎤 Enable Voice Control
                  </motion.button>
                )}
              </div>
            </div>

            {/* Voice Status */}
            {isVoiceEnabled && (
              <div className={`mb-4 p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status:</span>
                  <span className={`text-sm font-bold flex items-center gap-2 ${
                    isListening ? 'text-green-500' : isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {isListening ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Listening...
                      </>
                    ) : (
                      <>
                        <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-gray-400' : 'bg-gray-600'}`}></div>
                        Ready
                      </>
                    )}
                  </span>
                </div>
                
                {transcript && (
                  <div className="mt-2">
                    <div className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Transcript:</div>
                    <div className={`text-sm p-2 rounded ${isDark ? 'text-white bg-gray-700/50' : 'text-gray-900 bg-gray-200'}`}>
                      "{transcript}"
                    </div>
                    {confidence > 0 && (
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                          Confidence: {Math.round(confidence * 100)}%
                        </span>
                        <div className={`w-16 h-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}>
                          <div 
                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${confidence * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Control Buttons */}
            {isVoiceEnabled && (
              <div className="flex space-x-3 mb-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startListening}
                  disabled={isListening}
                  className={`flex-1 py-2 px-3 rounded-md font-medium text-sm transition-all duration-300 hover-lift interactive ${
                    isListening 
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 text-white hover-glow'
                  }`}
                >
                  {isListening ? '🎤 Listening...' : '🎤 Start Listening'}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={stopListening}
                  disabled={!isListening}
                  className={`flex-1 py-2 px-3 rounded-md font-medium text-sm transition-all duration-300 hover-lift interactive ${
                    !isListening 
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700 text-white hover-glow'
                  }`}
                >
                  🛑 Stop
                </motion.button>
              </div>
            )}

            {/* Voice Commands Help */}
            <div className={`p-4 rounded-xl ${
              isDark ? 'bg-gray-800/30' : 'bg-gray-100/50'
            }`}>
              <div className={`font-bold text-sm mb-3 flex items-center ${
                isDark ? 'text-gray-200' : 'text-gray-800'
              }`}>
                <span className="mr-2">📋</span>
                Available Voice Commands
              </div>
              <div className={`space-y-2 text-xs ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  "Go to home" - Navigate to homepage
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  "Create post" - Open post creator
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  "Profile" - Open user profile
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  "Dark mode" / "Light mode" - Switch theme
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  "Enable voice" / "Disable voice" - Toggle voice control
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full mr-2"></span>
                  "Search for [term]" - Search content
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  "Help" - Show all commands
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors text-xs ${
                isDark 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800'
              }`}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default VoiceControl;