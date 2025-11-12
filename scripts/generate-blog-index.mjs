import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, "content", "posts");
const OUT = path.join(ROOT, "public", "data", "blog", "search.json");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    return fs.statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const files = walk(POSTS_DIR).filter((f) => f.endsWith(".mdx"));
const items = [];

for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  if (data.status !== "published") continue;

  items.push({
    slug: data.slug,
    title: data.title,
    excerpt: data.excerpt,
    date: data.date,
    category: data.category,
    readTime: data.readTime,
    cover: data.cover ?? null,
    audioUrl: data.audioUrl ?? null,
    tags: data.tags ?? [],
    featured: !!data.featured,
    body: content.slice(0, 800) // Pour recherche plein texte
  });
}

items.sort((a, b) => b.date.localeCompare(a.date));
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ items }, null, 2));
console.log(`✓ /public/data/blog/search.json (${items.length} items)`);
