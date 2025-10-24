import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import ContactPage from './ContactPage.tsx'
import HelpCenter from './HelpCenter.tsx'
import FAQPage from './FAQPage.tsx'
import PrivacyPage from './PrivacyPage.tsx'
import TermsPage from './TermsPage.tsx'
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
        <Route path="/conditions" element={<TermsPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
