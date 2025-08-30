import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { getPlatformProxy } from 'wrangler';

// Determine repository root to locate seed file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const seedPath = resolve(__dirname, '../public/data/seed.json');

const seedData = JSON.parse(await readFile(seedPath, 'utf8'));

// Access the local D1 database bound as env.DB
const { env } = await getPlatformProxy();
const db = env.DB;

for (const job of seedData) {
  await db
    .prepare(
      `INSERT INTO jobs (id, title, company, location, tags, url, source, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
    )
    .bind(
      job.id,
      job.title,
      job.company,
      job.location,
      (job.tags || []).join(','),
      job.url,
      job.source,
      job.created_at
    )
    .run();
}

console.log(`Seeded ${seedData.length} jobs into the local database.`);

