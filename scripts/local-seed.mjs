/* eslint-env node */
import { readFile } from "node:fs/promises";
import { getPlatformProxy } from "wrangler";
import logger from "../src/logger.js";

async function main() {
  const { env } = await getPlatformProxy();
  const db = env.DB;

  const dataPath = new URL("../public/data/seed.json", import.meta.url);
  const jobs = JSON.parse(await readFile(dataPath, "utf8"));

  for (const job of jobs) {
    const { id, title, company, location, tags, url, source, created_at } = job;
    await db
      .prepare(
        `INSERT INTO jobs (id, title, company, location, tags, url, source, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        title,
        company,
        location,
        JSON.stringify(tags),
        url,
        source,
        created_at
      )
      .run();
  }

  logger.info(`Inserted ${jobs.length} job(s)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
