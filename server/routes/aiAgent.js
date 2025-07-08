const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const BlogSuggestion = require('../models/BlogSuggestion');
const Post = require('../models/Post');
const User = require('../models/User');
const router = express.Router();

// Function to fetch relevant images from multiple free sources
const fetchRelevantImages = async (topic, category = 'general', count = 3) => {
  try {
    // Try Pexels API first (free)
    const pexelsResponse = await fetchFromPexels(topic, count);
    if (pexelsResponse.length > 0) {
      console.log(`✅ Fetched ${pexelsResponse.length} images from Pexels`);
      return pexelsResponse;
    }
  } catch (error) {
    console.log('Pexels API error:', error.message);
  }
  
  // Fallback to high-quality placeholder images
  console.log('🖼️ Using high-quality placeholder images');
  return generateSmartPlaceholderImages(topic, count);
};

// Fetch from Pexels (free API)
const fetchFromPexels = async (topic, count) => {
  try {
    const searchQuery = topic.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const keywords = ['technology', 'business', 'innovation', 'digital', 'computer', 'data'];
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    
    // Use free Pexels API (no key required for basic usage)
    const response = await axios.get(`https://api.pexels.com/v1/search`, {
      params: {
        query: `${searchQuery} ${randomKeyword}`,
        per_page: count,
        orientation: 'landscape'
      },
      headers: {
        'Authorization': 'YOUR_PEXELS_API_KEY' // We'll use placeholder service instead
      },
      timeout: 8000
    });

    return response.data.photos.map(img => ({
      url: img.src.large,
      alt: `${topic} - Professional Image`,
      credit: img.photographer,
      creditUrl: img.photographer_url
    }));
  } catch (error) {
    return [];
  }
};

// Generate smart placeholder images with relevant themes
const generateSmartPlaceholderImages = (topic, count) => {
  const topicKeywords = topic.toLowerCase();
  let imageTheme = 'business';
  
  // Determine image theme based on topic and category
  if (topicKeywords.includes('ai') || topicKeywords.includes('artificial')) imageTheme = 'artificial-intelligence';
  else if (topicKeywords.includes('crypto') || topicKeywords.includes('blockchain')) imageTheme = 'cryptocurrency';
  else if (topicKeywords.includes('mobile') || topicKeywords.includes('app')) imageTheme = 'mobile-technology';
  else if (topicKeywords.includes('cloud') || topicKeywords.includes('server')) imageTheme = 'cloud-computing';
  else if (topicKeywords.includes('cyber') || topicKeywords.includes('security')) imageTheme = 'cybersecurity';
  else if (topicKeywords.includes('health') || topicKeywords.includes('medical')) imageTheme = 'healthcare';
  else if (topicKeywords.includes('business') || topicKeywords.includes('finance')) imageTheme = 'business';
  else if (topicKeywords.includes('education') || topicKeywords.includes('learning')) imageTheme = 'education';
  else if (topicKeywords.includes('environment') || topicKeywords.includes('climate')) imageTheme = 'nature';
  else if (topicKeywords.includes('entertainment') || topicKeywords.includes('gaming')) imageTheme = 'entertainment';
  else if (topicKeywords.includes('travel') || topicKeywords.includes('lifestyle')) imageTheme = 'lifestyle';
  else if (topicKeywords.includes('science') || topicKeywords.includes('research')) imageTheme = 'science';
  
  return Array.from({ length: count }, (_, i) => {
    const imageServices = [
      `https://source.unsplash.com/800x400/?${imageTheme}&sig=${Date.now() + i}`,
      `https://picsum.photos/800/400?random=${Date.now() + i}`,
      `https://loremflickr.com/800/400/${imageTheme}?random=${Date.now() + i}`
    ];
    
    return {
      url: imageServices[i % imageServices.length],
      alt: `${topic} - Professional ${imageTheme} Image`,
      credit: 'Free Stock Photos',
      creditUrl: '#'
    };
  });
};

// Clean text formatter - pure readable content
const formatBlogContent = (content, images, topic, newsUrl) => {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });

  // Remove ALL formatting and create pure text
  const cleanContent = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/#{1,6}\s*/g, '') // Remove headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .replace(/>/g, '') // Remove quotes
    .replace(/•/g, '-') // Replace bullets
    .replace(/\n{3,}/g, '\n\n') // Clean breaks
    .trim();

  return `${cleanContent}

Image: ${images[0]?.url}
Photo Credit: ${images[0]?.credit}

${images[1] ? `Additional Image: ${images[1]?.url}\n\n` : ''}Related Resources:
- Original Source: ${newsUrl || 'Not available'}
- Topic: ${topic}
- Published: ${currentDate}
- Reading Time: 8-12 minutes

Stay updated with the latest technology insights!

© 2025 NeuroBlog - All rights reserved.`;
};

// Auto-generate suggestions every 5 minutes
let autoGenerateInterval;

const startAutoGeneration = () => {
  if (autoGenerateInterval) clearInterval(autoGenerateInterval);
  
  autoGenerateInterval = setInterval(async () => {
    try {
      console.log('Auto-generating blog suggestions from latest news...');
      
      // Check if we have too many pending suggestions
      const pendingCount = await BlogSuggestion.countDocuments({ status: 'pending' });
      if (pendingCount >= 15) {
        console.log('Too many pending suggestions, skipping auto-generation');
        return;
      }
      
      // Get fresh news and generate 1-2 suggestions
      const trendingTopics = await fetchRealNews();
      if (trendingTopics.length === 0) return;
      
      const topicItem = trendingTopics[0]; // Use the most recent news
      
      // Check for duplicates
      const titleKeywords = topicItem.title.toLowerCase().split(' ').filter(word => word.length > 3);
      const keywordRegex = titleKeywords.slice(0, 3).join('|');
      
      // Check both suggestions and published posts for duplicates
      const existingSuggestion = await BlogSuggestion.findOne({
        $or: [
          { title: { $regex: keywordRegex, $options: 'i' } },
          { uniqueId: topicItem.uniqueId }
        ],
        createdAt: { $gte: new Date(Date.now() - 3 * 60 * 60 * 1000) }
      });
      
      const existingPost = await Post.findOne({
        $or: [
          { title: { $regex: keywordRegex, $options: 'i' } },
          { newsSource: { $regex: topicItem.source, $options: 'i' } }
        ],
        createdAt: { $gte: new Date(Date.now() - 6 * 60 * 60 * 1000) }
      });
      
      if (existingSuggestion || existingPost) {
        console.log(`Auto-generation skipped: similar content exists (${existingSuggestion ? 'suggestion' : 'published post'})`);
        return;
      }
      
      // Generate new suggestion with current date
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      });
      
      const uniqueAngle = ['breaking analysis', 'expert insights', 'industry impact', 'technical breakdown', 'market trends'][Math.floor(Math.random() * 5)];
      
      const prompt = `LIVE UPDATE (${currentDate}): "${topicItem.title}" - ${topicItem.description}

Create a PROFESSIONAL ${uniqueAngle} blog post with perfect structure:

✅ REQUIREMENTS:
- Clean, readable text (NO HTML tags)
- Use markdown: ## for headings, **bold**, *italic*
- Professional quotes with attribution
- Bullet points for statistics
- Current date context throughout
- Engaging and informative content

Return ONLY valid JSON:
{
  "title": "Compelling title (max 70 chars, unique from news headline)",
  "summary": "Engaging summary with immediate relevance and ${currentDate} context",
  "content": "## Breaking Development\n\nWhat just happened and why it matters right now (${currentDate})...\n\n## Key Statistics and Data\n\n• Important data point 1 with specific numbers\n• Market figure 2 with percentages\n• Industry metric 3 with growth data\n• Recent developments and trends\n\n## Expert Analysis\n\nComprehensive analysis of the situation and its broader implications...\n\n> \"This development marks a turning point for the industry. We're seeing unprecedented changes.\" - Industry Expert, Leading Tech Company\n\n## Future Outlook for ${new Date().getFullYear()}\n\nWhat this means for the coming months and years ahead...\n\n## Impact on Businesses and Consumers\n\nPractical implications and what people need to know...\n\n## Key Takeaways\n\n• Critical insight 1 for immediate consideration\n• Important implication 2 for long-term planning\n• Action point 3 for staying competitive\n• Trend 4 to monitor closely\n\n## Conclusion\n\nProfessional summary with clear next steps and future outlook.\n\n**Live Update:** ${currentDate}",
  "tags": ["${new Date().getFullYear()}", "live-update", "breaking-news", "analysis", "trending"],
  "category": "General",
  "featured": true,
  "publishDate": "${currentDate}"
}`;
      
      // Fetch images for auto-generated content
      const images = await fetchRelevantImages(topicItem.title, 'general', 2);
      
      const aiResponse = await callGeminiAPI(prompt);
      const parsedResponse = parseAIResponse(aiResponse);
      
      // Format content with images
      parsedResponse.content = formatBlogContent(
        parsedResponse.content, 
        images, 
        topicItem.title, 
        topicItem.url
      );
      
      const suggestion = new BlogSuggestion({
        title: parsedResponse.title,
        content: parsedResponse.content,
        summary: parsedResponse.summary,
        tags: parsedResponse.tags,
        category: parsedResponse.category,
        source: `Auto: ${topicItem.source}`,
        newsUrl: topicItem.url,
        uniqueId: topicItem.uniqueId,
        featured: parsedResponse.featured || true,
        readTime: parsedResponse.readTime,
        publishDate: parsedResponse.publishDate
      });
      
      await suggestion.save();
      console.log(`Auto-generated suggestion: ${parsedResponse.title}`);
      
    } catch (error) {
      console.error('Auto-generation error:', error.message);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
};

// Start auto-generation when module loads
startAutoGeneration();

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// Helper function to call Gemini API with retry logic
const callGeminiAPI = async (prompt, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
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
        { timeout: 30000 }
      );
      
      if (response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content) {
        return response.data.candidates[0].content.parts[0].text.trim();
      }
      throw new Error('No valid response from AI service');
    } catch (error) {
      const isOverloaded = error.response?.data?.error?.code === 503 || 
                          error.response?.data?.error?.status === 'UNAVAILABLE';
      
      console.log(`Gemini API attempt ${attempt}/${retries} failed:`, error.response?.data?.error || error.message);
      
      if (attempt === retries || !isOverloaded) {
        throw new Error('AI service temporarily unavailable');
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Fetch news from multiple sources including RSS feeds
const fetchFromMultipleSources = async () => {
  const allNews = [];
  
  // Try Google News API first
  try {
    const googleNews = await fetchFromGoogleNews();
    allNews.push(...googleNews);
    console.log(`✅ Fetched ${googleNews.length} articles from Google News`);
  } catch (error) {
    console.log('❌ Google News API failed:', error.message);
  }
  
  // Try RSS feeds as backup
  try {
    const rssNews = await fetchFromRSSFeeds();
    allNews.push(...rssNews);
    console.log(`✅ Fetched ${rssNews.length} articles from RSS feeds`);
  } catch (error) {
    console.log('❌ RSS feeds failed:', error.message);
  }
  
  // Try free news APIs
  try {
    const freeNews = await fetchFromFreeAPIs();
    allNews.push(...freeNews);
    console.log(`✅ Fetched ${freeNews.length} articles from free APIs`);
  } catch (error) {
    console.log('❌ Free APIs failed:', error.message);
  }
  
  return allNews.length > 0 ? allNews : getFallbackTopics();
};

// Fetch from Google News API
const fetchFromGoogleNews = async () => {
  const newsAPI = process.env.GOOGLE_NEWS_API_KEY;
  if (!newsAPI) throw new Error('No Google News API key');
  
  console.log('🔄 Fetching from Google News API...');

  // Diverse keywords across multiple fields
  const allKeywords = [
    // Technology
    'AI technology', 'machine learning', 'blockchain', 'cybersecurity', 'cloud computing', 'quantum computing',
    // Business & Finance
    'startup funding', 'market trends', 'economic news', 'cryptocurrency', 'stock market', 'business innovation',
    // Health & Science
    'medical breakthrough', 'scientific discovery', 'health research', 'climate change', 'space exploration', 'biotechnology',
    // Entertainment & Culture
    'entertainment news', 'movie industry', 'music trends', 'gaming industry', 'social media trends', 'digital culture',
    // Sports & Lifestyle
    'sports news', 'fitness trends', 'travel industry', 'food trends', 'fashion industry', 'lifestyle changes',
    // Education & Career
    'education technology', 'career trends', 'remote work', 'skill development', 'online learning', 'job market',
    // Environment & Sustainability
    'renewable energy', 'environmental protection', 'sustainable living', 'green technology', 'conservation efforts',
    // Politics & Society
    'policy changes', 'social movements', 'government initiatives', 'public health', 'urban development'
  ];
  const randomKeyword = allKeywords[Math.floor(Math.random() * allKeywords.length)];
    
  // Get very recent news (last 4 hours)
  const fromTime = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
  
  const response = await axios.get(`https://newsapi.org/v2/everything`, {
    params: {
      q: randomKeyword,
      language: 'en',
      sortBy: 'publishedAt',
      from: fromTime,
      pageSize: 20,
      apiKey: newsAPI
    },
    timeout: 15000
  });

  if (response.data.articles && response.data.articles.length > 0) {
    return response.data.articles
      .filter(article => 
        article.title && 
        article.description && 
        !article.title.includes('[Removed]') &&
        article.title.length > 20
      )
      .slice(0, 10)
      .map(article => ({
        title: article.title,
        description: article.description.substring(0, 300),
        source: article.source.name,
        url: article.url,
        publishedAt: article.publishedAt,
        category: categorizeArticle(article.title + ' ' + article.description),
        uniqueId: Buffer.from(article.title + article.publishedAt).toString('base64').substring(0, 10)
      }));
  }
  return [];
};

// Fetch from RSS feeds
const fetchFromRSSFeeds = async () => {
  const rssFeeds = [
    'https://feeds.feedburner.com/TechCrunch',
    'https://www.wired.com/feed/rss',
    'https://feeds.reuters.com/reuters/technologyNews',
    'https://feeds.bbci.co.uk/news/business/rss.xml',
    'https://feeds.feedburner.com/venturebeat/SZYF',
    'https://feeds.feedburner.com/oreilly/radar'
  ];
  
  // For now, return empty array as RSS parsing requires additional libraries
  // In production, you would use xml2js or similar to parse RSS feeds
  return [];
};

// Fetch from free news APIs
const fetchFromFreeAPIs = async () => {
  try {
    // Try NewsAPI.org free tier or other free services
    // For now, return empty array
    return [];
  } catch (error) {
    return [];
  }
};

// Categorize articles based on content
const categorizeArticle = (content) => {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('technology') || lowerContent.includes('ai') || lowerContent.includes('software')) return 'Technology';
  if (lowerContent.includes('business') || lowerContent.includes('finance') || lowerContent.includes('economy')) return 'Business';
  if (lowerContent.includes('health') || lowerContent.includes('medical') || lowerContent.includes('healthcare')) return 'Health';
  if (lowerContent.includes('science') || lowerContent.includes('research') || lowerContent.includes('study')) return 'Science';
  if (lowerContent.includes('entertainment') || lowerContent.includes('movie') || lowerContent.includes('music')) return 'Entertainment';
  if (lowerContent.includes('sports') || lowerContent.includes('game') || lowerContent.includes('team')) return 'Sports';
  if (lowerContent.includes('education') || lowerContent.includes('learning') || lowerContent.includes('school')) return 'Education';
  if (lowerContent.includes('environment') || lowerContent.includes('climate') || lowerContent.includes('green')) return 'Environment';
  
  return 'General';
};

// Main function to fetch real news
const fetchRealNews = async () => {
  try {
    console.log('🌍 Fetching news from multiple sources...');
    const news = await fetchFromMultipleSources();
    console.log(`✅ Total articles collected: ${news.length}`);
    return news;
  } catch (error) {
    console.error('Error fetching news from all sources:', error.message);
    return getFallbackTopics();
  }
};

// Diverse fallback topics across all fields
const getFallbackTopics = () => {
  const topics = [
    // Technology
    { title: 'AI Revolution in Software Development', description: 'How AI is transforming coding and development workflows', source: 'Tech News', category: 'Technology' },
    { title: 'Quantum Computing Breakthroughs', description: 'Latest advances in quantum technology and applications', source: 'Science Today', category: 'Technology' },
    { title: 'Cybersecurity Trends 2025', description: 'Emerging threats and security solutions', source: 'Security Weekly', category: 'Technology' },
    
    // Business & Finance
    { title: 'Startup Funding Landscape Changes', description: 'New trends in venture capital and startup investments', source: 'Business Weekly', category: 'Business' },
    { title: 'Cryptocurrency Market Evolution', description: 'Latest developments in digital currency markets', source: 'Finance Today', category: 'Finance' },
    { title: 'Remote Work Revolution Continues', description: 'How remote work is reshaping business operations', source: 'Work Trends', category: 'Business' },
    
    // Health & Science
    { title: 'Medical AI Breakthrough', description: 'Artificial intelligence revolutionizing healthcare diagnostics', source: 'Health Science', category: 'Health' },
    { title: 'Climate Change Solutions', description: 'Innovative approaches to environmental challenges', source: 'Environmental News', category: 'Environment' },
    { title: 'Space Exploration Milestones', description: 'Recent achievements in space technology and exploration', source: 'Space Today', category: 'Science' },
    
    // Entertainment & Culture
    { title: 'Digital Entertainment Trends', description: 'How streaming and gaming are evolving', source: 'Entertainment Weekly', category: 'Entertainment' },
    { title: 'Social Media Platform Changes', description: 'Latest updates in social media landscape', source: 'Digital Culture', category: 'Social Media' },
    { title: 'Gaming Industry Innovation', description: 'New technologies transforming gaming experiences', source: 'Gaming News', category: 'Gaming' },
    
    // Education & Career
    { title: 'Online Learning Revolution', description: 'How digital education is transforming learning', source: 'Education Today', category: 'Education' },
    { title: 'Future of Work Skills', description: 'Essential skills for the modern workplace', source: 'Career Insights', category: 'Career' },
    { title: 'Professional Development Trends', description: 'New approaches to career advancement', source: 'Professional Growth', category: 'Career' },
    
    // Lifestyle & Health
    { title: 'Wellness Technology Advances', description: 'How technology is improving personal health', source: 'Wellness Weekly', category: 'Health' },
    { title: 'Sustainable Living Practices', description: 'Practical approaches to environmental responsibility', source: 'Green Living', category: 'Lifestyle' },
    { title: 'Travel Industry Recovery', description: 'How travel is adapting to new global realities', source: 'Travel News', category: 'Travel' }
  ];
  return topics.sort(() => Math.random() - 0.5).slice(0, 8);
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
      title: parsed.title.substring(0, 75),
      content: parsed.content,
      summary: parsed.summary || parsed.title,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [`${new Date().getFullYear()}`, 'trending'],
      category: parsed.category || 'General',
      featured: parsed.featured || true,
      readTime: parsed.readTime || '8-10 min read',
      publishDate: parsed.publishDate || new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      })
    };
  } catch (error) {
    console.error('Failed to parse AI response:', response.substring(0, 200));
    // Return a fallback structure with current date
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    
    return {
      title: `Breaking Tech News - ${currentDate}`,
      content: `## Latest Technology Update\n\n${response.substring(0, 600)}\n\n## Key Points\n\n• Breaking development in technology sector\n• Significant industry impact and implications\n• Future outlook for ${new Date().getFullYear()}\n• Market reactions and expert opinions\n\n## Analysis\n\nThis development represents a significant shift in the technology landscape, with far-reaching implications for businesses and consumers alike.\n\n> \"This is a game-changing development that will reshape how we think about technology solutions.\" - Tech Industry Expert\n\n## What This Means\n\nThe implications of this development extend beyond immediate market reactions, potentially influencing long-term technology adoption and innovation strategies.\n\n## Key Takeaways\n\n• Monitor industry developments closely\n• Assess impact on current technology strategies\n• Prepare for potential market shifts\n• Stay informed about emerging trends\n\n**Published:** ${currentDate}\n\n© 2025 NeuroBlog Technology Insights`,
      summary: `Latest technology news and comprehensive analysis - ${currentDate}`,
      tags: [`${new Date().getFullYear()}`, 'breaking-news', 'trending', 'ai-generated'],
      category: 'General',
      featured: true,
      publishDate: currentDate
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

    for (let i = 0; i < Math.min(10, trendingTopics.length); i++) {
      const topicItem = trendingTopics[i];
      
      // Enhanced duplicate prevention - check both suggestions and published posts
      const titleKeywords = topicItem.title.toLowerCase().split(' ').filter(word => word.length > 3);
      const keywordRegex = titleKeywords.slice(0, 3).join('|');
      
      // Check existing suggestions
      const existingSuggestion = await BlogSuggestion.findOne({
        $or: [
          { title: { $regex: keywordRegex, $options: 'i' } },
          { source: { $regex: topicItem.source, $options: 'i' } }
        ],
        createdAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) }
      });
      
      // Check published posts
      const existingPost = await Post.findOne({
        $or: [
          { title: { $regex: keywordRegex, $options: 'i' } },
          { newsSource: { $regex: topicItem.source, $options: 'i' } }
        ],
        createdAt: { $gte: new Date(Date.now() - 4 * 60 * 60 * 1000) } // Check last 4 hours
      });
      
      if (existingSuggestion || existingPost) {
        console.log(`Skipping duplicate content: ${topicItem.title} (${existingSuggestion ? 'suggestion' : 'published post'} exists)`);
        continue;
      }
      
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      });
      
      const uniqueAngle = ['comprehensive analysis', 'expert insights', 'future implications', 'industry impact', 'technical deep-dive', 'market analysis'][Math.floor(Math.random() * 6)];
      
      const prompt = `BREAKING NEWS (${currentDate}): "${topicItem.title}" - ${topicItem.description}

Source: ${topicItem.source} | Published: ${topicItem.publishedAt || 'Just now'}

Create a PROFESSIONAL, engaging blog post with ${uniqueAngle}. Requirements:

✅ PERFECT BLOG STRUCTURE:
- Clean, readable text (NO HTML tags)
- Use markdown formatting: ## for headings, **bold**, *italic*
- Engaging introduction with current context
- Multiple sections with clear subheadings
- Statistics in bullet points
- Expert quotes with attribution
- Professional conclusion
- Current date context throughout

✅ CONTENT STYLE:
- Professional yet engaging tone
- Real statistics and data points
- Expert insights and industry quotes
- Practical implications for readers
- Future predictions for ${new Date().getFullYear()}
- Actionable takeaways

Return ONLY valid JSON:

{
  "title": "Compelling, SEO-optimized title (max 70 chars, unique from news)",
  "summary": "Engaging 2-3 sentence hook with current relevance and impact",
  "content": "Introduction\n\nEngaging opening paragraph that sets the context and explains why this matters right now in ${currentDate}. This development has significant implications for the technology industry and beyond.\n\nKey Statistics and Market Data\n\n- Important statistic 1 with specific numbers and percentages\n- Market data point 2 showing growth trends and market impact\n- Industry figure 3 demonstrating significant changes\n- Recent survey results highlighting consumer and business reactions\n\nDeep Analysis: What's Really Happening\n\nComprehensive analysis of the situation, breaking down the key factors and implications. This section explores the underlying causes and potential consequences of this development.\n\nIndustry Impact and Reactions\n\nDetailed examination of how this affects different sectors and stakeholders. Major companies and industry leaders are responding with various strategies and initiatives.\n\nExpert Opinion: This represents a significant shift in how we approach technology solutions. The implications are far-reaching and will likely influence industry practices for years to come. - Dr. Sarah Johnson, Tech Industry Analyst\n\nFuture Implications for ${new Date().getFullYear()}\n\nForward-looking analysis of what this means for the coming months and years. Several key trends are emerging that will shape the technology landscape.\n\nWhat This Means for Businesses and Consumers\n\nPractical implications and actionable insights for different audiences. Businesses need to adapt their strategies while consumers should be aware of upcoming changes.\n\nKey Takeaways\n\n- Critical insight 1 that readers should remember for decision-making\n- Important implication 2 for long-term planning and strategy\n- Action item 3 for staying competitive in the market\n- Future trend 4 to monitor closely for opportunities\n\nConclusion\n\nProfessional wrap-up that ties everything together and provides clear next steps for readers. This development marks a pivotal moment in technology evolution.",
  "tags": ["${new Date().getFullYear()}", "breaking-news", "analysis", "insights", "trending"],
  "category": "General",
  "featured": true,
  "readTime": "8-12 min read",
  "publishDate": "${currentDate}"
}

Make it PERFECT and ENGAGING!`;

      try {
        // Fetch relevant images for the topic
        const images = await fetchRelevantImages(topicItem.title, topicItem.category || 'general', 2);
        console.log(`🖼️ Generated ${images.length} images for: ${topicItem.title.substring(0, 50)}...`);
        
        const aiResponse = await callGeminiAPI(prompt);
        const parsedResponse = parseAIResponse(aiResponse);
        
        // Format content with images and proper structure
        parsedResponse.content = formatBlogContent(
          parsedResponse.content, 
          images, 
          topicItem.title, 
          topicItem.url
        );
        
        // Enhanced post-generation duplicate check (suggestions + published posts)
        const titleWords = parsedResponse.title.split(' ').slice(0, 3).join('|');
        
        const [duplicateSuggestion, duplicatePost] = await Promise.all([
          BlogSuggestion.findOne({
            $or: [
              { title: parsedResponse.title },
              { title: { $regex: titleWords, $options: 'i' } }
            ]
          }),
          Post.findOne({
            $or: [
              { title: parsedResponse.title },
              { title: { $regex: titleWords, $options: 'i' } }
            ]
          })
        ]);
        
        if (duplicateSuggestion || duplicatePost) {
          const uniqueSuffix = ['Insights', 'Analysis', 'Perspective', 'Guide', 'Deep Dive', 'Update'][Math.floor(Math.random() * 6)];
          const timestamp = new Date().getHours().toString().padStart(2, '0') + new Date().getMinutes().toString().padStart(2, '0');
          parsedResponse.title = `${parsedResponse.title.substring(0, 55)} - ${uniqueSuffix} ${timestamp}`;
          console.log(`🔄 Made title unique: ${parsedResponse.title}`);
        }
        
        const suggestion = new BlogSuggestion({
          title: parsedResponse.title,
          content: parsedResponse.content,
          summary: parsedResponse.summary,
          tags: parsedResponse.tags,
          category: topicItem.category || parsedResponse.category,
          source: `${topicItem.source} - ${topicItem.title}`,
          newsUrl: topicItem.url,
          uniqueId: topicItem.uniqueId || Date.now().toString(),
          featured: parsedResponse.featured || true,
          readTime: parsedResponse.readTime,
          publishDate: parsedResponse.publishDate
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
      status: 'published',
      featured: suggestion.featured || true,
      readTime: suggestion.readTime || '8-10 min read',
      publishDate: suggestion.publishDate || new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      }),
      newsSource: suggestion.source
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
      status: shouldPublish ? 'published' : 'draft',
      featured: suggestion.featured || true,
      readTime: suggestion.readTime || '8-10 min read',
      publishDate: suggestion.publishDate || new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      }),
      newsSource: suggestion.source
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
    
    if (pendingCount >= 8) {
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

// Stop auto-generation endpoint (admin only)
router.post('/stop-auto-generation', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    if (autoGenerateInterval) {
      clearInterval(autoGenerateInterval);
      autoGenerateInterval = null;
    }
    
    res.json({ message: 'Auto-generation stopped' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start auto-generation endpoint (admin only)
router.post('/start-auto-generation', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    startAutoGeneration();
    res.json({ message: 'Auto-generation started' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;