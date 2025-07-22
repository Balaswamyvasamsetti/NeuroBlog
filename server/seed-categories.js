const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

const categories = [
  { name: 'Technology', description: 'Posts about technology, programming, and digital innovations' },
  { name: 'Business', description: 'Posts about business, entrepreneurship, and finance' },
  { name: 'Health', description: 'Posts about health, wellness, and medical topics' },
  { name: 'Science', description: 'Posts about scientific discoveries and research' },
  { name: 'Education', description: 'Posts about learning, teaching, and educational topics' },
  { name: 'Culture', description: 'Posts about arts, entertainment, and cultural topics' },
  { name: 'Sports', description: 'Posts about sports, fitness, and athletic activities' },
  { name: 'Environment', description: 'Posts about environmental issues and sustainability' },
  { name: 'Travel', description: 'Posts about travel, destinations, and adventures' },
  { name: 'Food', description: 'Posts about cooking, recipes, and culinary experiences' }
];

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/neuroblog';

mongoose.connect(mongoURI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');
    
    // Insert new categories
    const result = await Category.insertMany(categories);
    console.log(`Added ${result.length} categories`);
    
    // Disconnect
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });