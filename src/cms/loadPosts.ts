import matter from "gray-matter";
import type { PostFrontmatter, PostIndexItem } from "./types";
import searchData from "../../public/data/blog/search.json";

// Charge le composant MDX pour la page article
export const compModules = import.meta.glob("/content/posts/**/*.mdx");

export function getAllPosts(): PostIndexItem[] {
  // Utilise directement les données du fichier JSON
  return searchData.items.map(item => ({
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt,
    date: item.date,
    articleType: (item as any).articleType || "actualite", // Par défaut "actualite" pour compatibilité
    category: item.category,
    readTime: item.readTime,
    cover: item.cover,
    coverAlt: (item as any).coverAlt || "",
    summaryImage: (item as any).summaryImage || "",
    summaryImageAlt: (item as any).summaryImageAlt || "",
    aiSummary: (item as any).aiSummary || "",
    audioUrl: item.audioUrl,
    tags: item.tags,
    author: "",
    featured: item.featured,
    body: item.body
  }));
}
