const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../data/db');
const { requireAdmin } = require('../middleware/auth');

// ─── Dashboard stats ───────────────────────────────────────────────
router.get('/stats', requireAdmin, (req, res) => {
  const db = readDB();
  
  const stats = {
    totalProducts: db.products.length,
    totalOrders: db.orders.length,
    totalCategories: db.categories.length,
    pendingUSDT: db.orders.filter(o => o.status === 'pending_usdt').length,
    completedOrders: db.orders.filter(o => o.status === 'completed').length,
    totalRevenue: db.orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (o.priceStars || 0), 0),
    recentOrders: db.orders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(o => ({
        id: o.id,
        productName: o.productName,
        userId: o.userId,
        userName: o.userName,
        priceStars: o.priceStars,
        priceUSDT: o.priceUSDT,
        paymentMethod: o.paymentMethod,
        status: o.status,
        createdAt: o.createdAt
      })),
    topProducts: db.products
      .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
      .slice(0, 5)
      .map(p => ({ id: p.id, name: p.name, downloads: p.downloads, price: p.price }))
  };
  
  res.json(stats);
});

// ─── Categories CRUD ───────────────────────────────────────────────

router.get('/categories', (req, res) => {
  const db = readDB();
  res.json(db.categories);
});

router.post('/categories', requireAdmin, (req, res) => {
  const { name, icon, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  
  const db = readDB();
  const category = {
    id: `cat_${uuidv4().slice(0, 8)}`,
    name,
    icon: icon || '📦',
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    description: description || '',
    createdAt: new Date().toISOString()
  };
  
  db.categories.push(category);
  writeDB(db);
  res.status(201).json(category);
});

router.put('/categories/:id', requireAdmin, (req, res) => {
  const db = readDB();
  const idx = db.categories.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Category not found' });
  
  const { name, icon, description } = req.body;
  db.categories[idx] = {
    ...db.categories[idx],
    name: name || db.categories[idx].name,
    icon: icon || db.categories[idx].icon,
    description: description || db.categories[idx].description,
    updatedAt: new Date().toISOString()
  };
  
  writeDB(db);
  res.json(db.categories[idx]);
});

router.delete('/categories/:id', requireAdmin, (req, res) => {
  const db = readDB();
  const idx = db.categories.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Category not found' });
  
  // Check if any products use this category
  const productsUsing = db.products.filter(p => p.categoryId === req.params.id).length;
  if (productsUsing > 0) {
    return res.status(400).json({
      error: `Cannot delete: ${productsUsing} product(s) are using this category`
    });
  }
  
  db.categories.splice(idx, 1);
  writeDB(db);
  res.json({ success: true });
});

module.exports = router;
