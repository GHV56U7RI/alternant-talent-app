import { useParams, Link } from "react-router-dom";
import { getAllPosts } from "../cms/loadPosts";

export default function ArticlePageDebug() {
  const { slug } = useParams();

  console.log("ArticlePageDebug - slug:", slug);

  const posts = getAllPosts();
  console.log("All posts:", posts);

  const post = posts.find((p) => p.slug === slug);
  console.log("Found post:", post);

  if (!post) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>Article introuvable</h1>
        <p>Slug: {slug}</p>
        <Link to="/blog">Retour au blog</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", background: "white", minHeight: "100vh" }}>
      <h1>{post.title}</h1>
      <p>{post.excerpt}</p>
      <p>Date: {post.date}</p>
      <p>Catégorie: {post.category}</p>
      <p>Temps de lecture: {post.readTime} min</p>
      <Link to="/blog">Retour au blog</Link>
    </div>
  );
}
