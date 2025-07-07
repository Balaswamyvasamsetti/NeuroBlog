const express = require('express');
const authMiddleware = require('../middleware/auth');
const Category = require('../models/Category');
const router = express.Router();

// Get all categories with hierarchy
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().populate('parent', 'name');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single category
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate('parent', 'name');
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new category (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, parentId } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ error: 'Category already exists' });
    }
    
    // If parentId provided, verify parent exists
    if (parentId) {
      const parentCategory = await Category.findById(parentId);
      if (!parentCategory) {
        return res.status(404).json({ error: 'Parent category not found' });
      }
    }
    
    const category = new Category({
      name,
      description,
      parent: parentId || null
    });
    
    await category.save();
    await category.populate('parent', 'name');
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update category (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    
    const { name, description, parentId } = req.body;
    
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({ error: 'Category name already exists' });
      }
    }
    
    // Prevent circular reference
    if (parentId && parentId === req.params.id) {
      return res.status(400).json({ error: 'Category cannot be its own parent' });
    }
    
    Object.assign(category, {
      name: name || category.name,
      description: description || category.description,
      parent: parentId || category.parent
    });
    
    await category.save();
    await category.populate('parent', 'name');
    res.json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete category (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    
    // Check if category has children
    const childCategories = await Category.find({ parent: req.params.id });
    if (childCategories.length > 0) {
      return res.status(400).json({ error: 'Cannot delete category with subcategories' });
    }
    
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;