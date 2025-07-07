const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const BlogSuggestion = require('../models/BlogSuggestion');
const Post = require('../models/Post');
const User = require('../models/User');
const router = express.Router();

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Helper function to call Gemini API
const callGeminiAPI = async (prompt) => {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      },
      { timeout: 20000 }
    );
    
    if (response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content) {
      return response.data.candidates[0].content.parts[0].text.trim();
    }
    throw new Error('No valid response from AI service');
  } catch (error) {
    console.error('Gemini API Error:', error.response?.data || error.message);
    throw new Error('AI service temporarily unavailable');
  }
};

// Fetch real news from multiple sources
const fetchRealNews = async () => {
  try {
    const newsAPI = process.env.GOOGLE_NEWS_API_KEY || process.env.NEWS_API_KEY;
    if (!newsAPI) {
      console.log('No news API key, using fallback topics');
      return getFallbackTopics();
    }

    const techKeywords = ['artificial intelligence', 'machine learning', 'blockchain', 'cybersecurity', 'cloud computing', 'quantum computing'];
    const randomKeyword = techKeywords[Math.floor(Math.random() * techKeywords.length)];
    
    const response = await axios.get(`https://newsapi.org/v2/everything`, {
      params: {
        q: randomKeyword,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 10,
        apiKey: newsAPI
      },
      timeout: 10000
    });

    if (response.data.articles && response.data.articles.length > 0) {
      return response.data.articles.slice(0, 8).map(article => ({
        title: article.title,
        description: article.description || article.content?.substring(0, 200) || 'Latest technology news',
        source: article.source.name,
        url: article.url
      }));
    }
  } catch (error) {
    console.error('Error fetching news:', error.message);
  }
  
  return getFallbackTopics();
};

// Fallback topics when news API fails
const getFallbackTopics = () => {
  const topics = [
    { title: 'AI Revolution in Software Development', description: 'How AI is transforming coding and development workflows', source: 'Tech News' },
    { title: 'Quantum Computing Breakthroughs', description: 'Latest advances in quantum technology and applications', source: 'Science Today' },
    { title: 'Cybersecurity Trends 2024', description: 'Emerging threats and security solutions', source: 'Security Weekly' },
    { title: 'Cloud Computing Evolution', description: 'Next-generation cloud services and architectures', source: 'Cloud Tech' },
    { title: 'Blockchain Beyond Crypto', description: 'Real-world applications of blockchain technology', source: 'Blockchain News' },
    { title: 'Mobile Development Trends', description: 'Latest frameworks and development practices', source: 'Mobile Dev' },
    { title: 'Web3 and Decentralized Internet', description: 'The future of decentralized web technologies', source: 'Web3 Today' },
    { title: 'Green Technology Solutions', description: 'Sustainable tech innovations for climate change', source: 'Green Tech' }
  ];
  return topics.sort(() => Math.random() - 0.5).slice(0, 5);
};

// Helper function to clean and parse AI response
const parseAIResponse = (response) => {
  try {
    // Remove markdown code blocks if present
    let cleanResponse = response.replace(/```json\s*|```\s*/g, '').trim();
    
    // Try to find JSON object in the response
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanResponse = jsonMatch[0];
    }
    
    const parsed = JSON.parse(cleanResponse);
    
    // Validate required fields
    if (!parsed.title || !parsed.content) {
      throw new Error('Missing required fields');
    }
    
    return {
      title: parsed.title.substring(0, 80),
      content: parsed.content,
      summary: parsed.summary || parsed.title,
      tags: Array.isArray(parsed.tags) ? parsed.tags : ['technology'],
      category: parsed.category || 'Technology'
    };
  } catch (error) {
    console.error('Failed to parse AI response:', response.substring(0, 200));
    // Return a fallback structure instead of throwing
    return {
      title: 'AI Generated Content',
      content: response.substring(0, 1000) + '...',
      summary: 'AI generated content based on trending topics',
      tags: ['technology', 'ai-generated'],
      category: 'Technology'
    };
  }
};

// Generate blog suggestions based on trending news
router.post('/generate-suggestions', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get real news topics
    const trendingTopics = await fetchRealNews();
    const suggestions = [];

    for (let i = 0; i < Math.min(5, trendingTopics.length); i++) {
      const topicItem = trendingTopics[i];
      
      // Check for existing similar content (less strict to allow generation)
      const titleWords = topicItem.title.split(' ').slice(0, 2).join(' ');
      const existingSuggestion = await BlogSuggestion.findOne({
        title: { $regex: titleWords, $options: 'i' },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Only check last 24 hours
      });
      
      if (existingSuggestion) {
        console.log(`Skipping recent duplicate: ${topicItem.title}`);
        continue;
      }
      
      const prompt = `Based on this trending topic: "${topicItem.title}" - ${topicItem.description}

Create a comprehensive, informative blog post that provides in-depth analysis and insights. Return ONLY a valid JSON object with this exact structure:

{
  "title": "An engaging title (max 80 characters)",
  "summary": "A brief 2-3 sentence summary",
  "content": "Full article content (800-1200 words) with proper structure including introduction, main points with subheadings, practical examples, and conclusion",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "category": "Technology"
}

Do not include any markdown formatting or code blocks. Return only the JSON object.`;

      try {
        const aiResponse = await callGeminiAPI(prompt);
        const parsedResponse = parseAIResponse(aiResponse);
        
        // Light duplicate check after generation
        const duplicateCheck = await BlogSuggestion.findOne({
          title: parsedResponse.title
        });
        
        if (duplicateCheck) {
          parsedResponse.title = `${parsedResponse.title} - ${Date.now()}`;
        }
        
        const suggestion = new BlogSuggestion({
          title: parsedResponse.title,
          content: parsedResponse.content,
          summary: parsedResponse.summary,
          tags: parsedResponse.tags,
          category: parsedResponse.category,
          source: `${topicItem.source} - ${topicItem.title}`
        });

        await suggestion.save();
        suggestions.push(suggestion);
      } catch (error) {
        console.error('Error generating suggestion:', error);
        
        // Create a fallback suggestion if AI fails
        const fallbackSuggestion = new BlogSuggestion({
          title: topicItem.title.substring(0, 80),
          content: `# ${topicItem.title}\n\n${topicItem.description}\n\nThis is a trending topic in technology that deserves deeper analysis and discussion.`,
          summary: topicItem.description || 'A trending technology topic worth exploring.',
          tags: ['technology', 'trends', 'innovation'],
          category: 'Technology',
          source: topicItem.source
        });
        
        await fallbackSuggestion.save();
        suggestions.push(fallbackSuggestion);
      }
    }

    res.json({ 
      message: `Generated ${suggestions.length} blog suggestions from trending topics`,
      suggestions 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get only pending suggestions
router.get('/suggestions', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const suggestions = await BlogSuggestion.find({ status: 'pending' })
      .sort({ generatedAt: -1 })
      .limit(10);

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Direct publish suggestion (admin only)
router.post('/suggestions/:id/publish', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const suggestion = await BlogSuggestion.findById(req.params.id);
    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    // Create a fixed admin ObjectId
    const mongoose = require('mongoose');
    const adminObjectId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
    
    // Create and publish the blog post immediately
    const post = new Post({
      title: suggestion.title,
      body: suggestion.content,
      summary: suggestion.summary,
      author: req.user.userId === 'admin' ? adminObjectId : req.user.userId,
      tags: suggestion.tags || [],
      status: 'published'
    });

    await post.save();

    // Update suggestion status
    suggestion.status = 'published';
    suggestion.publishedAt = new Date();
    suggestion.postId = post._id;
    await suggestion.save();

    res.json({ 
      message: 'Post published successfully',
      post,
      suggestion 
    });
  } catch (error) {
    console.error('Publish error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Approve and publish suggestion
router.post('/suggestions/:id/approve', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const suggestion = await BlogSuggestion.findById(req.params.id);
    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    const { adminNotes, shouldPublish = true } = req.body;

    // Create the actual blog post
    const mongoose = require('mongoose');
    const adminObjectId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
    
    const post = new Post({
      title: suggestion.title,
      body: suggestion.content,
      summary: suggestion.summary,
      author: req.user.userId === 'admin' ? adminObjectId : req.user.userId,
      tags: suggestion.tags,
      status: shouldPublish ? 'published' : 'draft'
    });

    await post.save();

    // Update suggestion status
    suggestion.status = shouldPublish ? 'published' : 'approved';
    suggestion.adminNotes = adminNotes;
    suggestion.approvedAt = new Date();
    suggestion.postId = post._id;
    if (shouldPublish) {
      suggestion.publishedAt = new Date();
    }

    await suggestion.save();

    res.json({ 
      message: shouldPublish ? 'Suggestion approved and published' : 'Suggestion approved',
      post,
      suggestion 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject suggestion
router.post('/suggestions/:id/reject', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const suggestion = await BlogSuggestion.findById(req.params.id);
    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    const { adminNotes } = req.body;

    suggestion.status = 'rejected';
    suggestion.adminNotes = adminNotes;
    await suggestion.save();

    res.json({ message: 'Suggestion rejected', suggestion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete suggestion
router.delete('/suggestions/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await BlogSuggestion.findByIdAndDelete(req.params.id);
    res.json({ message: 'Suggestion deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auto-generate suggestions (can be called by cron job)
router.post('/auto-generate', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Check if we already have pending suggestions
    const pendingCount = await BlogSuggestion.countDocuments({ status: 'pending' });
    
    if (pendingCount >= 5) {
      return res.json({ message: 'Sufficient pending suggestions already exist' });
    }

    // Generate new suggestions
    const generateResponse = await axios.post(
      `${req.protocol}://${req.get('host')}/api/ai-agent/generate-suggestions`,
      {},
      { headers: { Authorization: req.headers.authorization } }
    );

    res.json(generateResponse.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;