import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import ContactPage from './ContactPage.tsx'
import HelpCenter from './HelpCenter.tsx'
import FAQPage from './FAQPage.tsx'
import PrivacyPage from './PrivacyPage.tsx'
import TermsPage from './TermsPage.tsx'
import AboutPage from './AboutPage.tsx'
import BlogPage from './pages/BlogPage.tsx'
import BlogPageTest from './pages/BlogPageTest.tsx'
import ArticlePage from './pages/ArticlePage.tsx'
import ArticlePageSimple from './pages/ArticlePageSimple.tsx'
import ArticlePageDebug from './pages/ArticlePageDebug.tsx'
import AdminPage from './pages/AdminPage.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/aide" element={<HelpCenter />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/confidentialite" element={<PrivacyPage />} />
        <Route path="/cgu" element={<TermsPage />} />
        <Route path="/a-propos" element={<AboutPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog-test" element={<BlogPageTest />} />
        <Route path="/blog-simple/:slug" element={<ArticlePageSimple />} />
        <Route path="/blog-debug/:slug" element={<ArticlePageDebug />} />
        <Route path="/blog/:slug" element={<ArticlePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
