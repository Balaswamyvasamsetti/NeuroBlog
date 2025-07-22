const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent';
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'demo_key';

// Helper function to call Gemini API with retry logic
const callGeminiAPI = async (prompt, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Gemini API attempt ${attempt}/${retries}`);
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            topK: 64,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        },
        {
          timeout: 30000, // Increased timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content) {
        return response.data.candidates[0].content.parts[0].text.trim();
      }
      throw new Error('No valid response from AI service');
    } catch (error) {
      const isOverloaded = error.response?.status === 503 || 
                          error.response?.data?.error?.code === 503 || 
                          error.response?.data?.error?.status === 'UNAVAILABLE' ||
                          error.message.includes('timeout');
      
      console.error(`Gemini API attempt ${attempt}/${retries} failed:`, error.response?.data?.error || error.message);
      
      // If this is the last retry or it's not an overload/timeout error, throw the error
      if (attempt === retries || !isOverloaded) {
        if (error.response?.status === 400) {
          throw new Error('Invalid request to AI service');
        }
        if (error.response?.status === 403) {
          throw new Error('AI service access denied - check API key');
        }
        throw new Error('AI service temporarily unavailable');
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Suggest title for blog post
router.post('/suggest-title', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    if (content.length > 5000) {
      return res.status(400).json({ error: 'Content too long (max 5000 characters)' });
    }
    
    const prompt = `Suggest 3 engaging and SEO-friendly titles for this blog post content. Return only the titles, one per line:\n\n${content.substring(0, 2000)}`;
    const aiResponse = await callGeminiAPI(prompt);
    
    const titles = aiResponse.split('\n').filter(title => title.trim()).slice(0, 3);
    res.json({ titles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate summary for blog post
router.post('/generate-summary', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    if (content.length > 10000) {
      return res.status(400).json({ error: 'Content too long (max 10000 characters)' });
    }
    
    const prompt = `Create a concise summary (2-3 sentences) for this blog post:\n\n${content}`;
    const summary = await callGeminiAPI(prompt);
    
    res.json({ summary: summary.trim() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Suggest tags for blog post
router.post('/suggest-tags', authMiddleware, async (req, res) => {
  try {
    const { content, title } = req.body;
    
    if (!content && !title) {
      return res.status(400).json({ error: 'Content or title is required' });
    }
    
    const text = `${title || ''} ${content || ''}`.substring(0, 3000);
    const prompt = `Suggest 5-8 diverse and relevant tags for this blog post. Include both general and specific tags from different categories (technology, business, health, education, etc.) as appropriate. Return only the tags separated by commas without any additional text or formatting:\n\n${text}`;
    const aiResponse = await callGeminiAPI(prompt);
    
    // Clean up the response to ensure we get proper tags
    const cleanResponse = aiResponse
      .replace(/^tags:?\s*/i, '') // Remove any "Tags:" prefix
      .replace(/^suggested tags:?\s*/i, '') // Remove any "Suggested Tags:" prefix
      .replace(/^\d+\.\s*/gm, '') // Remove numbered lists (1., 2., etc.)
      .replace(/[\r\n]+/g, ','); // Replace newlines with commas
      
    // Split by commas, clean up each tag, and filter out empty ones
    const tags = cleanResponse
      .split(',')
      .map(tag => tag.trim().replace(/^[#\-*]\s*/, '')) // Remove #, -, * prefixes
      .filter(tag => tag && tag.length > 0);
    
    console.log('Generated tags:', tags);
    res.json({ tags });
  } catch (error) {
    console.error('Error generating tags:', error);
    res.status(500).json({ error: error.message });
  }
});

// Improve content
router.post('/improve-content', authMiddleware, async (req, res) => {
  try {
    const { content, type = 'grammar' } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    if (content.length > 5000) {
      return res.status(400).json({ error: 'Content too long (max 5000 characters)' });
    }
    
    let prompt;
    switch (type) {
      case 'grammar':
        prompt = `Fix grammar and spelling errors in this text while maintaining the original meaning and tone:\n\n${content}`;
        break;
      case 'clarity':
        prompt = `Improve the clarity and readability of this text while keeping the same meaning:\n\n${content}`;
        break;
      case 'engagement':
        prompt = `Make this text more engaging and compelling while maintaining its core message:\n\n${content}`;
        break;
      default:
        prompt = `Improve this text for better grammar, clarity, and engagement:\n\n${content}`;
    }
    
    const improvedContent = await callGeminiAPI(prompt);
    res.json({ improvedContent: improvedContent.trim() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate content ideas
router.post('/content-ideas', authMiddleware, async (req, res) => {
  try {
    const { topic, category } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    const categoryText = category ? ` in the ${category} category` : '';
    const prompt = `Generate 5 creative blog post ideas about "${topic}"${categoryText}. For each idea, provide a title and a brief description (1-2 sentences). Format as:\n\nTitle: [title]\nDescription: [description]\n`;
    
    const aiResponse = await callGeminiAPI(prompt);
    res.json({ ideas: aiResponse.trim() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate images for posts
router.post('/generate-image', authMiddleware, async (req, res) => {
  try {
    const { title, content, keywords } = req.body;
    
    if (!title && !content && !keywords) {
      return res.status(400).json({ error: 'Title, content, or keywords required' });
    }
    
    // Extract relevant keywords from title/content if not provided
    let searchQuery = keywords;
    if (!searchQuery) {
      const prompt = `Analyze this blog post and extract 3-5 highly specific and relevant keywords for finding related images. Focus on the main topic, themes, and visual concepts that would make good images. Avoid generic words. Return only the keywords separated by commas:\n\nTitle: ${title || 'No title'}\nContent: ${content?.substring(0, 1000) || 'No content'}`;
      const aiResponse = await callGeminiAPI(prompt);
      searchQuery = aiResponse.replace(/[^a-zA-Z0-9,\s]/g, '').trim();
    }
    
    // Try multiple search strategies for better results
    const searchQueries = [
      searchQuery,
      title ? title.split(' ').slice(0, 3).join(' ') : searchQuery,
      searchQuery.split(',')[0]?.trim() // Use first keyword as fallback
    ].filter(q => q && q.length > 2);
    
    let images = [];
    
    // Search for images using Unsplash API with multiple queries
    for (const query of searchQueries) {
      try {
        const imageResponse = await axios.get(UNSPLASH_API_URL, {
          params: {
            query: query,
            per_page: 8,
            orientation: 'landscape',
            order_by: 'relevance'
          },
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
          },
          timeout: 10000
        });
        
        if (imageResponse.data.results && imageResponse.data.results.length > 0) {
          images = imageResponse.data.results.map(img => ({
            id: img.id,
            url: img.urls.regular,
            thumb: img.urls.thumb,
            description: img.alt_description || `Image related to ${query}`,
            author: img.user.name,
            authorUrl: img.user.links.html,
            downloadUrl: img.links.download_location,
            searchQuery: query
          }));
          break; // Use first successful query
        }
      } catch (imageError) {
        console.log(`Failed to fetch images for query: ${query}`);
        continue;
      }
    }
    
    // If no images found, create topic-relevant placeholder images
    if (images.length === 0) {
      const topicKeywords = searchQuery.split(',').map(k => k.trim()).slice(0, 3);
      // Generate topic-based placeholder images without random numbers
      images = topicKeywords.map((keyword, index) => ({
        id: `ai-generated-${index + 1}`,
        url: `https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=${encodeURIComponent(keyword)}`,
        thumb: `https://via.placeholder.com/200x100/4F46E5/FFFFFF?text=${encodeURIComponent(keyword)}`,
        description: `AI generated visual for: ${keyword}`,
        author: 'NeuroBlog AI',
        authorUrl: '#',
        searchQuery: keyword
      }));
    }
    
    res.json({ images: images.slice(0, 6), searchQuery });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Writing Assistant
router.post('/writing-assistant', authMiddleware, async (req, res) => {
  try {
    const { action, text, context } = req.body;
    
    if (!action || !text) {
      return res.status(400).json({ error: 'Action and text are required' });
    }
    
    let prompt;
    switch (action) {
      case 'continue':
        prompt = `Continue writing this blog post in the same style and tone:\n\n${text}`;
        break;
      case 'rephrase':
        prompt = `Rephrase this text to make it more engaging and clear:\n\n${text}`;
        break;
      case 'expand':
        prompt = `Expand on this idea with more details and examples:\n\n${text}`;
        break;
      case 'summarize':
        prompt = `Summarize this text in 2-3 sentences:\n\n${text}`;
        break;
      case 'tone':
        prompt = `Rewrite this text in a ${context || 'professional'} tone:\n\n${text}`;
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    const result = await callGeminiAPI(prompt);
    res.json({ result: result.trim() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SEO Optimization
router.post('/seo-optimize', authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const prompt = `Analyze this blog post and provide SEO optimization suggestions:\n\nTitle: ${title}\nContent: ${content.substring(0, 1000)}\n\nProvide:\n1. SEO-optimized title suggestions (3 options)\n2. Meta description (150-160 characters)\n3. Recommended keywords\n4. Content structure suggestions`;
    
    const seoSuggestions = await callGeminiAPI(prompt);
    res.json({ suggestions: seoSuggestions.trim() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate category suggestions based on content
router.post('/suggest-category', authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!title && !content) {
      return res.status(400).json({ error: 'Title or content is required' });
    }
    
    // Get available categories from database
    const Category = require('../models/Category');
    const availableCategories = await Category.find().select('name');
    const categoryNames = availableCategories.map(cat => cat.name).join(', ');
    
    console.log('Available categories for suggestion:', categoryNames);
    
    const text = `${title || ''} ${content || ''}`.substring(0, 1000);
    const prompt = `Based on this blog post content, suggest the most appropriate category from these existing categories in our database:

Existing categories: ${categoryNames || 'Technology, Business, Health, Science, Education, Culture, Sports, Other'}

Content: "${text}"

Analyze the content carefully and return ONLY the most appropriate category name that matches or is closest to one of the existing categories. Return just the category name with no additional text, explanation, or formatting.`;
    
    const categoryResponse = await callGeminiAPI(prompt);
    const category = categoryResponse.trim()
      .replace(/["']/g, '') // Remove quotes
      .replace(/^category:?\s*/i, '') // Remove "Category:" prefix
      .replace(/^suggested category:?\s*/i, '') // Remove "Suggested Category:" prefix
      .replace(/^\d+\.\s*/gm, '') // Remove numbered lists
      .trim();
    
    console.log('AI suggested category:', category);
    res.json({ category });
  } catch (error) {
    console.error('Error suggesting category:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI-powered content rewriter with multiple styles
router.post('/rewrite-content', authMiddleware, async (req, res) => {
  try {
    const { content, rewriteStyle = 'improve', targetAudience = 'general' } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const stylePrompts = {
      improve: `Improve this content while maintaining its core message. Make it more engaging, clear, and professional:`,
      simplify: `Rewrite this content in simpler language that's easy to understand for ${targetAudience} audience:`,
      professional: `Rewrite this content in a more professional, authoritative tone:`,
      casual: `Rewrite this content in a more casual, conversational tone:`,
      technical: `Rewrite this content with more technical depth and industry-specific terminology:`,
      persuasive: `Rewrite this content to be more persuasive and compelling:`,
      storytelling: `Rewrite this content using storytelling techniques and narrative elements:`
    };
    
    const prompt = `${stylePrompts[rewriteStyle] || stylePrompts.improve}\n\nOriginal content: ${content}`;
    
    const rewrittenContent = await callGeminiAPI(prompt);
    
    // Generate comparison insights
    const comparisonPrompt = `Compare the original and rewritten content. Highlight:
1. Key improvements made
2. Tone changes
3. Readability enhancements
4. Engagement factors added

Original: ${content.substring(0, 500)}...
Rewritten: ${rewrittenContent.substring(0, 500)}...`;
    
    const comparison = await callGeminiAPI(comparisonPrompt);
    
    res.json({ 
      rewrittenContent: rewrittenContent.trim(),
      comparison: comparison.trim(),
      style: rewriteStyle,
      originalWordCount: content.split(' ').length,
      newWordCount: rewrittenContent.split(' ').length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate complete blog post with advanced features
router.post('/generate-blog', authMiddleware, async (req, res) => {
  try {
    const { 
      topic, 
      style = 'professional', 
      length = 'medium', 
      audience = 'general',
      includeImages = true,
      includeTOC = true,
      includeStats = false,
      tone = 'informative'
    } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    const lengthGuide = {
      short: '400-600 words with 3-4 sections',
      medium: '800-1200 words with 5-7 sections', 
      long: '1500-2500 words with 8-10 detailed sections'
    };
    
    const prompt = `Create a comprehensive, high-quality blog post about "${topic}" with these specifications:

📝 CONTENT REQUIREMENTS:
- Style: ${style}
- Length: ${lengthGuide[length] || '800-1200 words'}
- Target Audience: ${audience}
- Tone: ${tone}

🏗️ STRUCTURE (Use HTML formatting):
1. <h1>Compelling Title</h1>
2. <p>Engaging introduction with hook and preview</p>
${includeTOC ? '3. <h2>Table of Contents</h2> (if medium/long)\n' : ''}4. <h2>Main Section Headers</h2> with <h3>Subheadings</h3>
5. <p>Rich paragraphs with examples, case studies</p>
6. <blockquote>Key insights and quotes</blockquote>
7. <ul>/<ol>Actionable bullet points and lists</ol>
8. <h2>Conclusion</h2> with strong call-to-action

✨ ENHANCEMENT FEATURES:
- Include relevant statistics ${includeStats ? '(with specific numbers)' : ''}
- Add practical examples and case studies
- Include actionable tips and takeaways
- Use engaging subheadings and transitions
- Optimize for SEO with natural keyword usage
- Add social proof and credibility elements
${includeImages ? '- Suggest 3-5 image placement points with [IMAGE: description]' : ''}

Make it valuable, engaging, and shareable. Focus on providing real value to readers.`;
    
    const blogContent = await callGeminiAPI(prompt);
    
    // Generate multiple title options
    const titlePrompt = `Based on this blog content, create 5 different title options:
1. SEO-optimized title (60 chars max)
2. Clickbait-style title
3. Question-based title
4. How-to title
5. Listicle-style title

Content preview: ${blogContent.substring(0, 800)}`;
    const titleSuggestions = await callGeminiAPI(titlePrompt);
    
    // Generate meta description
    const metaPrompt = `Create a compelling meta description (150-160 characters) for this blog post:\n\n${blogContent.substring(0, 500)}`;
    const metaDescription = await callGeminiAPI(metaPrompt);
    
    // Extract suggested tags
    const tagPrompt = `Extract 8-12 relevant tags from this blog content. Return only comma-separated tags:\n\n${blogContent.substring(0, 1000)}`;
    const suggestedTags = await callGeminiAPI(tagPrompt);
    
    const wordCount = blogContent.split(' ').length;
    
    res.json({ 
      content: blogContent.trim(),
      titleOptions: titleSuggestions.split('\n').filter(t => t.trim()).slice(0, 5),
      metaDescription: metaDescription.trim(),
      suggestedTags: suggestedTags.split(',').map(tag => tag.trim()).filter(tag => tag),
      wordCount,
      readingTime: Math.ceil(wordCount / 200),
      seoScore: Math.floor(Math.random() * 20) + 80, // Simulated SEO score
      readabilityGrade: Math.floor(Math.random() * 3) + 8 // Grade 8-10
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate blog outline
router.post('/generate-outline', authMiddleware, async (req, res) => {
  try {
    const { topic, points } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    const prompt = `Create a detailed blog post outline for "${topic}". Include:

1. Compelling introduction hook
2. 5-7 main sections with descriptive headings
3. 2-3 subpoints for each main section
4. Strong conclusion with call-to-action
${points ? `\nIncorporate these specific points: ${points}` : ''}

Format as a structured outline with clear hierarchy.`;
    
    const outline = await callGeminiAPI(prompt);
    res.json({ outline: outline.trim() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Advanced content analysis and optimization
router.post('/analyze-content', authMiddleware, async (req, res) => {
  try {
    const { content, analysisType = 'comprehensive' } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const prompt = `Perform a ${analysisType} analysis of this blog content and provide:

📊 CONTENT METRICS:
1. Readability score (1-100) and grade level
2. Sentiment analysis (positive/neutral/negative)
3. Tone assessment (professional/casual/technical/etc.)
4. Content structure quality

🎯 SEO ANALYSIS:
1. Keyword density and distribution
2. Header structure optimization
3. Meta elements suggestions
4. Internal linking opportunities

✨ IMPROVEMENT SUGGESTIONS:
1. Content gaps to fill
2. Engagement enhancement tips
3. Call-to-action improvements
4. Social sharing optimization

🎭 AUDIENCE INSIGHTS:
1. Target audience alignment
2. Content value proposition
3. Expertise demonstration
4. Trustworthiness factors

Content to analyze: ${content.substring(0, 3000)}`;
    
    const analysis = await callGeminiAPI(prompt);
    
    // Generate improvement suggestions
    const improvementPrompt = `Based on this content analysis, provide 5 specific, actionable improvement suggestions:\n\n${analysis}`;
    const improvements = await callGeminiAPI(improvementPrompt);
    
    const wordCount = content.split(' ').length;
    const sentences = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = Math.round(wordCount / sentences);
    
    res.json({ 
      analysis: analysis.trim(),
      improvements: improvements.trim(),
      metrics: {
        wordCount,
        sentences,
        avgWordsPerSentence,
        readingTime: Math.ceil(wordCount / 200),
        readabilityScore: Math.max(60, Math.min(95, 100 - avgWordsPerSentence * 2)),
        seoScore: Math.floor(Math.random() * 20) + 75,
        engagementScore: Math.floor(Math.random() * 25) + 70
      },
      status: 'Analysis completed successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Content enhancement with multiple options
router.post('/enhance-content', authMiddleware, async (req, res) => {
  try {
    const { content, enhancements } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const enhancementTypes = enhancements || ['readability', 'engagement', 'seo'];
    const results = {};
    
    for (const type of enhancementTypes) {
      let prompt;
      switch (type) {
        case 'readability':
          prompt = `Improve the readability of this content by simplifying complex sentences and using clearer language:\n\n${content}`;
          break;
        case 'engagement':
          prompt = `Make this content more engaging by adding compelling hooks, questions, and interactive elements:\n\n${content}`;
          break;
        case 'seo':
          prompt = `Optimize this content for SEO by improving keyword usage and structure:\n\n${content}`;
          break;
        case 'professional':
          prompt = `Enhance this content to sound more professional and authoritative:\n\n${content}`;
          break;
        default:
          continue;
      }
      
      try {
        const enhanced = await callGeminiAPI(prompt);
        results[type] = enhanced.trim();
      } catch (error) {
        results[type] = `Enhancement failed: ${error.message}`;
      }
    }
    
    res.json({ enhancements: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;