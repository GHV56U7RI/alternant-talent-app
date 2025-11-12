import React from "react";
import { Headphones } from "lucide-react";
import type { PostIndexItem } from "../../cms/types";

const TILE_SIZE = 120;

export default function NewsBlock({ posts }: { posts: PostIndexItem[] }) {
  const left = posts.filter((_, i) => i % 2 === 0);
  const right = posts.filter((_, i) => i % 2 === 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 md:gap-y-14 md:gap-x-20">
      <div className="space-y-10 md:space-y-14">
        {left.map((p) => (
          <Card key={p.slug} post={p} />
        ))}
      </div>
      <div className="space-y-10 md:space-y-14">
        {right.map((p) => (
          <Card key={p.slug} post={p} />
        ))}
      </div>
    </div>
  );
}

function Card({ post }: { post: PostIndexItem }) {
  const hasAudio = !!post.audioUrl;

  return (
    <a
      href={`/blog/${post.slug}`}
      className="group flex gap-5 md:gap-6 items-start no-underline hover:no-underline focus:no-underline"
    >
      {/* Vignette */}
      <div
        className="flex-none rounded-2xl overflow-hidden shadow-none"
        style={{
          width: TILE_SIZE,
          height: TILE_SIZE,
          background: post.cover ? "#000" : "#f5f5f5",
        }}
      >
        {post.cover ? (
          <img
            src={post.cover}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full" />
        )}
      </div>

      {/* Texte */}
      <div className="min-w-0 pt-1">
        <h3 className="text-[18px] md:text-[20px] leading-tight font-medium text-neutral-900 line-clamp-2">
          {post.title}
        </h3>
        <div className="mt-2 text-[12px] md:text-[14px] text-neutral-500 flex flex-row items-center gap-1 md:gap-2">
          {hasAudio && (
            <>
              <span className="flex items-center gap-1.5">
                <Headphones
                  className="w-[18px] h-[18px] md:w-3.5 md:h-3.5"
                  aria-hidden="true"
                />
                Audio
              </span>
              <span aria-hidden>·</span>
            </>
          )}
          <span className="capitalize">{labelCategory(post.category)}</span>
          <span aria-hidden>·</span>
          <time>{formatFrDate(post.date)}</time>
        </div>
      </div>
    </a>
  );
}

function labelCategory(k: string) {
  const map: Record<string, string> = {
    alternance: "Alternance",
    securite: "Sécurité",
    produit: "Produit",
    societe: "Société",
  };
  return map[k] ?? k;
}

function formatFrDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
