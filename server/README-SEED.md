# NeuroBlog Seed Data

This directory contains seed scripts to populate the database with initial data.

## Seeding Categories

To fix the category selection issue in the Create Post page, you need to run the seed-categories.js script to populate the database with categories.

### Steps to Run the Seed Script:

1. Make sure your MongoDB server is running
2. Navigate to the server directory:
   ```
   cd server
   ```
3. Run the seed script:
   ```
   node seed-categories.js
   ```
4. You should see output confirming that categories were added to the database

### Expected Output:
```
Connected to MongoDB
Cleared existing categories
Added 10 categories
Disconnected from MongoDB
```

### Categories Added:
- Technology
- Business
- Health
- Science
- Education
- Culture
- Sports
- Environment
- Travel
- Food

After running this script, the category dropdown in the Create Post page should work correctly.

## Troubleshooting

If you encounter any issues:

1. Check that your MongoDB connection string is correct in your .env file
2. Ensure MongoDB is running and accessible
3. Check for any error messages in the console output
4. Verify that the Category model is correctly defined in models/Category.js