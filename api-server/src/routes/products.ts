import { Router, Request, Response } from 'express';
import { db } from '../db';
import { products, categories } from '../db/schema';
import { eq, and, like, desc, asc } from 'drizzle-orm';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const router = Router();

// ── Multer Storage ────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (_, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed',
      'image/png', 'image/jpeg', 'image/gif', 'image/webp',
      'video/mp4', 'audio/mpeg',
      'application/octet-stream',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(zip|pdf|mp4|mp3|png|jpg|gif)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// ── Validators ────────────────────────────────────────────────────────────────

const productSchema = z.object({
  name: z.string().min(1).max(256),
  description: z.string().optional(),
  shortDescription: z.string().max(512).optional(),
  priceStars: z.coerce.number().int().min(1),
  priceUsdt: z.coerce.number().min(0).optional(),
  categoryId: z.coerce.number().int().optional(),
  tags: z.string().optional(), // JSON string array
  isActive: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ── GET /products ─────────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, featured, search, limit = '20', offset = '0', sort = 'newest' } = req.query as Record<string, string>;

    let query = db
      .select({
        product: products,
        category: categories,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .$dynamic();

    const conditions = [eq(products.isActive, true)];

    if (category) {
      const [cat] = await db.select().from(categories).where(eq(categories.slug, category)).limit(1);
      if (cat) conditions.push(eq(products.categoryId, cat.id));
    }

    if (featured === 'true') {
      conditions.push(eq(products.isFeatured, true));
    }

    query = query.where(and(...conditions));

    if (sort === 'price_asc') query = query.orderBy(asc(products.priceStars));
    else if (sort === 'price_desc') query = query.orderBy(desc(products.priceStars));
    else query = query.orderBy(desc(products.createdAt));

    query = query.limit(parseInt(limit)).offset(parseInt(offset));

    const rows = await query;

    res.json(
      rows.map(({ product, category: cat }) => ({
        ...product,
        fileUrl: undefined, // never expose file path
        category: cat,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ── GET /products/:slug ───────────────────────────────────────────────────────

router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const [row] = await db
      .select({ product: products, category: categories })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.slug, req.params.slug), eq(products.isActive, true)))
      .limit(1);

    if (!row) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ ...row.product, fileUrl: undefined, category: row.category });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// ── POST /products (Admin) ────────────────────────────────────────────────────

router.post(
  '/',
  requireAdmin as any,
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      const parsed = productSchema.parse(req.body);
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;

      const fileFile = files?.['file']?.[0];
      const thumbnailFile = files?.['thumbnail']?.[0];

      let slug = slugify(parsed.name);
      // Ensure slug uniqueness
      const existing = await db.select({ slug: products.slug }).from(products).where(like(products.slug, `${slug}%`));
      if (existing.length > 0) slug = `${slug}-${Date.now()}`;

      const tags = parsed.tags ? (JSON.parse(parsed.tags) as string[]) : [];

      const [product] = await db
        .insert(products)
        .values({
          name: parsed.name,
          slug,
          description: parsed.description,
          shortDescription: parsed.shortDescription,
          priceStars: parsed.priceStars,
          priceUsdt: parsed.priceUsdt ? parsed.priceUsdt.toString() : null,
          categoryId: parsed.categoryId,
          tags,
          isActive: parsed.isActive ?? true,
          isFeatured: parsed.isFeatured ?? false,
          fileUrl: fileFile ? fileFile.filename : null,
          fileName: fileFile ? fileFile.originalname : null,
          fileSize: fileFile ? fileFile.size : null,
          thumbnailUrl: thumbnailFile
            ? `/uploads/thumbnails/${thumbnailFile.filename}`
            : parsed.thumbnailUrl || null,
        })
        .returning();

      res.status(201).json({ ...product, fileUrl: undefined });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: err.errors });
        return;
      }
      console.error(err);
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
);

// ── PUT /products/:id (Admin) ─────────────────────────────────────────────────

router.put(
  '/:id',
  requireAdmin as any,
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const parsed = productSchema.partial().parse(req.body);
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;

      const fileFile = files?.['file']?.[0];
      const thumbnailFile = files?.['thumbnail']?.[0];

      const updateData: Partial<typeof products.$inferInsert> = {
        ...parsed,
        priceUsdt: parsed.priceUsdt !== undefined ? parsed.priceUsdt.toString() : undefined,
        tags: parsed.tags ? (JSON.parse(parsed.tags as unknown as string) as string[]) : undefined,
        updatedAt: new Date(),
      };

      if (fileFile) {
        updateData.fileUrl = fileFile.filename;
        updateData.fileName = fileFile.originalname;
        updateData.fileSize = fileFile.size;
      }
      if (thumbnailFile) {
        updateData.thumbnailUrl = `/uploads/thumbnails/${thumbnailFile.filename}`;
      }

      const [product] = await db
        .update(products)
        .set(updateData)
        .where(eq(products.id, id))
        .returning();

      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      res.json({ ...product, fileUrl: undefined });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update product' });
    }
  }
);

// ── DELETE /products/:id (Admin) ──────────────────────────────────────────────

router.delete('/:id', requireAdmin as any, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [product] = await db.delete(products).where(eq(products.id, id)).returning();
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
