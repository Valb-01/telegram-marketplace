/**
 * Seed script — populates the database with demo data.
 * Run: npx tsx src/db/seed.ts
 */
import 'dotenv/config';
import { db } from './index';
import { categories, products, users } from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  // ── Categories ──────────────────────────────────────────────────────────────

  const categoryData = [
    { name: 'Design Assets',   slug: 'design-assets',   icon: '🎨', description: 'UI kits, icons, illustrations' },
    { name: 'Code Templates',  slug: 'code-templates',  icon: '💻', description: 'Source code, boilerplates' },
    { name: 'Photography',     slug: 'photography',     icon: '📸', description: 'Stock photos, presets' },
    { name: 'Music & Audio',   slug: 'music-audio',     icon: '🎵', description: 'Beats, samples, sound effects' },
    { name: 'eBooks & Guides', slug: 'ebooks-guides',   icon: '📚', description: 'PDFs, tutorials, courses' },
    { name: '3D Models',       slug: '3d-models',       icon: '🧊', description: 'OBJ, FBX, Blender files' },
  ];

  console.log('  → Inserting categories...');
  const insertedCats = await db
    .insert(categories)
    .values(categoryData)
    .onConflictDoNothing()
    .returning();

  const catMap = new Map(insertedCats.map((c) => [c.slug, c.id]));

  // ── Products ─────────────────────────────────────────────────────────────────

  const productData = [
    {
      categoryId: catMap.get('design-assets'),
      name: 'Premium UI Kit — Dark Edition',
      slug: 'premium-ui-kit-dark-edition',
      description: `A comprehensive dark-mode UI kit with 200+ components built for Figma and Sketch.\n\nIncludes:\n• 200+ hand-crafted components\n• 50+ screen templates\n• 8 color themes\n• Auto-layout ready\n• Icons included`,
      shortDescription: '200+ dark UI components for Figma & Sketch',
      priceStars: 150,
      priceUsdt: '2.99',
      thumbnailUrl: 'https://picsum.photos/seed/ui-kit/800/450',
      tags: ['figma', 'ui-kit', 'dark', 'components'],
      isFeatured: true,
      isActive: true,
    },
    {
      categoryId: catMap.get('code-templates'),
      name: 'Next.js SaaS Boilerplate',
      slug: 'nextjs-saas-boilerplate',
      description: `Production-ready Next.js 14 SaaS starter kit.\n\nIncludes:\n• Auth (NextAuth.js)\n• Stripe billing\n• PostgreSQL + Prisma\n• Email (Resend)\n• Admin dashboard\n• Deployment configs`,
      shortDescription: 'Full-stack SaaS starter with auth, billing & more',
      priceStars: 500,
      priceUsdt: '9.99',
      thumbnailUrl: 'https://picsum.photos/seed/nextjs/800/450',
      tags: ['nextjs', 'saas', 'typescript', 'stripe'],
      isFeatured: true,
      isActive: true,
    },
    {
      categoryId: catMap.get('ebooks-guides'),
      name: 'Web3 Development Masterclass',
      slug: 'web3-development-masterclass',
      description: `Complete guide to building decentralized applications.\n\nCovers:\n• Solidity smart contracts\n• Hardhat & Foundry\n• ethers.js & wagmi\n• IPFS & Arweave storage\n• DeFi protocol design`,
      shortDescription: 'Complete guide to building dApps from scratch',
      priceStars: 300,
      priceUsdt: '5.99',
      thumbnailUrl: 'https://picsum.photos/seed/web3/800/450',
      tags: ['web3', 'solidity', 'ethereum', 'guide'],
      isFeatured: true,
      isActive: true,
    },
    {
      categoryId: catMap.get('design-assets'),
      name: 'Gradient Mesh Pack — 100 Backgrounds',
      slug: 'gradient-mesh-pack-100',
      description: 'Hand-crafted gradient mesh backgrounds perfect for landing pages, app backgrounds, and social media. All PNG 4K resolution.',
      shortDescription: '100 gradient mesh backgrounds in 4K resolution',
      priceStars: 75,
      priceUsdt: '1.49',
      thumbnailUrl: 'https://picsum.photos/seed/gradients/800/450',
      tags: ['gradients', 'backgrounds', 'design', '4k'],
      isFeatured: false,
      isActive: true,
    },
    {
      categoryId: catMap.get('music-audio'),
      name: 'Lo-Fi Hip Hop Sample Pack',
      slug: 'lofi-hiphop-sample-pack',
      description: 'Studio-quality lo-fi samples and loops. 150+ royalty-free samples ready for your next project. WAV + MP3 formats included.',
      shortDescription: '150+ royalty-free lo-fi samples & loops',
      priceStars: 200,
      priceUsdt: '3.99',
      thumbnailUrl: 'https://picsum.photos/seed/lofi/800/450',
      tags: ['music', 'lofi', 'samples', 'royalty-free'],
      isFeatured: false,
      isActive: true,
    },
    {
      categoryId: catMap.get('3d-models'),
      name: 'Sci-Fi Interior 3D Scene Pack',
      slug: 'scifi-interior-3d-scene-pack',
      description: 'Fully rigged sci-fi interior 3D models optimized for Blender 4.x. Includes 15 unique assets with PBR textures at 4K resolution.',
      shortDescription: '15 sci-fi 3D assets with PBR textures for Blender',
      priceStars: 400,
      priceUsdt: '7.99',
      thumbnailUrl: 'https://picsum.photos/seed/3d/800/450',
      tags: ['3d', 'blender', 'scifi', 'pbr'],
      isFeatured: false,
      isActive: true,
    },
    {
      categoryId: catMap.get('code-templates'),
      name: 'Telegram Bot Starter Kit (TypeScript)',
      slug: 'telegram-bot-starter-kit',
      description: 'Production-ready Telegram bot template with TypeScript, inline keyboards, webhook support, Redis session storage, and Docker deployment.',
      shortDescription: 'TypeScript Telegram bot with webhooks & Redis',
      priceStars: 100,
      priceUsdt: '1.99',
      thumbnailUrl: 'https://picsum.photos/seed/tgbot/800/450',
      tags: ['telegram', 'bot', 'typescript', 'docker'],
      isFeatured: false,
      isActive: true,
    },
    {
      categoryId: catMap.get('photography'),
      name: 'Cinematic Lightroom Presets Bundle',
      slug: 'cinematic-lightroom-presets',
      description: '50 professional Lightroom presets for a cinematic look. Compatible with Lightroom Classic, Mobile, and Adobe Camera Raw. One-click application.',
      shortDescription: '50 cinematic Lightroom presets — one-click look',
      priceStars: 120,
      priceUsdt: '2.49',
      thumbnailUrl: 'https://picsum.photos/seed/presets/800/450',
      tags: ['lightroom', 'presets', 'photography', 'cinematic'],
      isFeatured: false,
      isActive: true,
    },
  ];

  console.log('  → Inserting products...');
  await db.insert(products).values(productData).onConflictDoNothing();

  console.log(`\n✅ Seed complete!`);
  console.log(`   ${insertedCats.length} categories`);
  console.log(`   ${productData.length} products`);
  console.log('\n💡 Next steps:');
  console.log('   1. Set ADMIN_TELEGRAM_ID in .env to your Telegram user ID');
  console.log('   2. pnpm dev — start the server');
  console.log('   3. /start your bot to open the Mini App');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
