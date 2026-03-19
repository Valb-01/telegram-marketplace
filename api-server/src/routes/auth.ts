import { Router, Request, Response } from 'express';
import { telegramAuth } from '../middleware/auth';

const router = Router();

router.post('/telegram', async (req: Request, res: Response) => {
  await telegramAuth(req, res);
});

export default router;
