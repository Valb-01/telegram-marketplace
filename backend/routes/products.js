const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const { readDB, writeDB } = require('../data/db');
const { requireAdmin } = require('../middleware/auth');

// Multer config for digital files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../digital-files'));
  },
  filename: (req, file, cb) => {
    const unique = uuidv4().slice(0, 8);
    cb(null, `${unique}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
});

// GET /api/products – Get all products
router.get('/', (req, res) => {
  const db = readDB();
  let products = db.products;
  
  // Filter by category
  if (req.query.category) {
    products = products.filter(p => p.categoryId === req.query.category);
  }
  
  // Search
  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }
  
  // Featured only
  if (req.query.featured === 'true') {
    products = products.filter(p => p.featured);
  }
  
  // Sort
  if (req.query.sort === 'price_asc') products.sort((a, b) => a.price - b.price);
  if (req.query.sort === 'price_desc') products.sort((a, b) => b.price - a.price);
  if (req.query.sort === 'popular') products.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
  if (req.query.sort === 'newest') products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const start = (page - 1) * limit;
  const paginated = products.slice(start, start + limit);
  
  res.json({
    products: paginated,
    total: products.length,
    page,
    totalPages: Math.ceil(products.length / limit)
  });
});

// GET /api/products/:id – Get single product
router.get('/:id', (req, res) => {
  const db = readDB();
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  
  // Add category info
  const category = db.categories.find(c => c.id === product.categoryId);
  res.json({ ...product, category });
});

// POST /api/products – Create product (admin)
router.post('/', requireAdmin, upload.single('digitalFile'), (req, res) => {
  const db = readDB();
  
  let digitalFileId = null;
  if (req.file) {
    const fileId = `file_${uuidv4().slice(0, 8)}`;
    const fileRecord = {
      id: fileId,
      filename: req.file.originalname,
      path: `./digital-files/${req.file.filename}`,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date().toISOString()
    };
    db.digitalFiles.push(fileRecord);
    digitalFileId = fileId;
  }
  
  const product = {
    id: `prod_${uuidv4().slice(0, 8)}`,
    name: req.body.name,
    description: req.body.description,
    shortDescription: req.body.shortDescription || req.body.description.substring(0, 150),
    price: parseInt(req.body.price) || 0,
    priceUSDT: parseFloat(req.body.priceUSDT) || 0,
    categoryId: req.body.categoryId,
    image: req.body.image || '',
    images: req.body.image ? [req.body.image] : [],
    tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : [],
    featured: req.body.featured === 'true',
    digitalFileId,
    fileType: req.body.fileType || 'zip',
    fileSize: req.body.fileSize || '',
    downloads: 0,
    rating: 0,
    reviews: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.products.push(product);
  writeDB(db);
  
  res.status(201).json(product);
});

// PUT /api/products/:id – Update product (admin)
router.put('/:id', requireAdmin, upload.single('digitalFile'), (req, res) => {
  const db = readDB();
  const idx = db.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  
  const existing = db.products[idx];
  
  let digitalFileId = existing.digitalFileId;
  if (req.file) {
    const fileId = `file_${uuidv4().slice(0, 8)}`;
    const fileRecord = {
      id: fileId,
      filename: req.file.originalname,
      path: `./digital-files/${req.file.filename}`,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date().toISOString()
    };
    db.digitalFiles.push(fileRecord);
    digitalFileId = fileId;
  }
  
  db.products[idx] = {
    ...existing,
    name: req.body.name || existing.name,
    description: req.body.description || existing.description,
    shortDescription: req.body.shortDescription || existing.shortDescription,
    price: req.body.price !== undefined ? parseInt(req.body.price) : existing.price,
    priceUSDT: req.body.priceUSDT !== undefined ? parseFloat(req.body.priceUSDT) : existing.priceUSDT,
    categoryId: req.body.categoryId || existing.categoryId,
    image: req.body.image || existing.image,
    images: req.body.image ? [req.body.image] : existing.images,
    tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : existing.tags,
    featured: req.body.featured !== undefined ? req.body.featured === 'true' : existing.featured,
    digitalFileId,
    fileType: req.body.fileType || existing.fileType,
    fileSize: req.body.fileSize || existing.fileSize,
    updatedAt: new Date().toISOString()
  };
  
  writeDB(db);
  res.json(db.products[idx]);
});

// DELETE /api/products/:id – Delete product (admin)
router.delete('/:id', requireAdmin, (req, res) => {
  const db = readDB();
  const idx = db.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  
  db.products.splice(idx, 1);
  writeDB(db);
  
  res.json({ success: true });
});

// GET /api/products/categories/all – Get categories
router.get('/categories/all', (req, res) => {
  const db = readDB();
  res.json(db.categories);
});

module.exports = router;
