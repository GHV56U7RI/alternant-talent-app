import React from "react";
import { useParams, Link } from "react-router-dom";

export default function ArticlePageSimple() {
  const { slug } = useParams();

  return (
    <div style={{ padding: "20px", background: "white", minHeight: "100vh" }}>
      <h1>Article Page - Test</h1>
      <p>Slug: {slug}</p>
      <Link to="/blog">Retour au blog</Link>
    </div>
  );
}
