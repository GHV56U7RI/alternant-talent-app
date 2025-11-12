import React from "react";
import { Link } from "react-router-dom";
import { getAllPosts } from "../cms/loadPosts";

export default function BlogPageTest() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-3xl font-bold mb-4">Test Blog Page</h1>
      <p className="text-gray-600 mb-4">Nombre d'articles trouvés: {posts.length}</p>

      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.slug} className="border p-4 rounded">
            <h2 className="text-xl font-semibold">{post.title}</h2>
            <p className="text-sm text-gray-600">Catégorie: {post.category}</p>
            <p className="text-sm text-gray-500">Date: {post.date}</p>
          </div>
        ))}
      </div>

      <Link to="/" className="mt-8 inline-block text-blue-600 hover:underline">
        Retour à l'accueil
      </Link>
    </div>
  );
}
