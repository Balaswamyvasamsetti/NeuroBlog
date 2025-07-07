const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const NEUROBLOG_CONTEXT = `
You are NeuroBot, a helpful assistant for NeuroBlog.

IMPORTANT: Give SIMPLE, DIRECT answers. Keep responses SHORT and focused.

NEUROBLOG FEATURES:

BLOG POSTS:
- Create posts with text editor
- Edit and delete posts
- Schedule posts for later
- Add categories and tags
- Upload images

AI FEATURES:
- Generate blog titles
- Improve writing
- Get content suggestions
- Create summaries
- Auto-generate tags

USER FEATURES:
- Register and login
- User profiles
- Comment on posts
- React with emojis
- Search posts

ADMIN FEATURES:
- Dashboard with stats
- Manage users and posts
- View analytics

OTHER:
- Dark/light theme
- Voice navigation
- Real-time notifications
- Mobile friendly

RULES:
- Answer ONLY the specific question asked
- Use simple language
- Keep answers short (2-3 sentences)
- For "how to" questions, give numbered steps
- If not about NeuroBlog: "I only help with NeuroBlog questions. Please ask about our blogging platform features."
`;

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-pro',
      generationConfig: {
        temperature: 0.8,
        topK: 64,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });
    
    const prompt = `${NEUROBLOG_CONTEXT}

User Question: ${message}

Give a SIMPLE, DIRECT answer. Follow the rules above.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ 
      response: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ 
      error: 'Sorry, I encountered an error. Please try again.',
      response: "🔧 I'm experiencing technical difficulties right now. Please try asking about NeuroBlog features again! I'm here to help with blogging, AI tools, user management, and all platform features."
    });
  }
});

module.exports = router;