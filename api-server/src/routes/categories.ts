import { Router, Request, Response } from 'express';
import { db } from '../db';
import { categories } from '../db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const categorySchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().optional(),
  icon: z.string().optional(),
});

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    const cats = await db.select().from(categories);
    res.json(cats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/', requireAdmin as any, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = categorySchema.parse(req.body);
    const slug = slugify(parsed.name);

    const [cat] = await db.insert(categories).values({
      name: parsed.name,
      slug,
      description: parsed.description,
      icon: parsed.icon,
    }).returning();

    res.status(201).json(cat);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/:id', requireAdmin as any, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const parsed = categorySchema.partial().parse(req.body);
    const [cat] = await db.update(categories).set(parsed).where(eq(categories.id, id)).returning();
    if (!cat) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(cat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/:id', requireAdmin as any, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(categories).where(eq(categories.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
