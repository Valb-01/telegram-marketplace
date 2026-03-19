import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load from root .env
dotenv.config({ path: '../.env' });
dotenv.config({ path: '.env' }); // fallback

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
