// Tag normalization utility to standardize tags
const tagMappings = {
  // AI/ML related
  'artificial-intelligence': 'ai',
  'machine-learning': 'ai',
  'ml': 'ai',
  'deep-learning': 'ai',
  
  // Programming languages
  'javascript': 'javascript',
  'js': 'javascript',
  'python': 'python',
  'py': 'python',
  
  // Frameworks
  'react': 'react',
  'reactjs': 'react',
  'node': 'nodejs',
  'nodejs': 'nodejs',
  
  // Technologies
  'cloud-computing': 'cloud',
  'cybersecurity': 'security',
  'mobile-development': 'mobile',
  'database': 'database',
  'db': 'database'
};

const normalizeTag = (tag) => {
  if (!tag) return '';
  const cleanTag = tag.toLowerCase().trim().replace(/\s+/g, '-');
  return tagMappings[cleanTag] || cleanTag;
};

const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  const normalized = tags.map(normalizeTag);
  return [...new Set(normalized)].filter(tag => tag.length > 0);
};

module.exports = { normalizeTag, normalizeTags };