import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import Home from './pages/Home';
import CreateCV from './pages/CreateCV';
import { Toaster } from './components/ui/toaster';
import { initGA4, trackPageView } from './lib/analytics';
import SEOHead from './components/SEOHead';

function NotFound() {
  const location = useLocation();
  return (
    <main className="min-h-screen bg-[#0a0a0b] text-white p-8">
      <SEOHead title="Page Not Found | Veyfolio" description="This page does not exist." path={location.pathname} noindex />
      <h1 className="text-2xl font-semibold mb-4">Page not found</h1>
      <Link to="/" className="text-blue-400 underline">Back to Veyfolio</Link>
    </main>
  );
}

/**
 * Tracks page views on route changes.
 * Must be rendered inside BrowserRouter to access useLocation.
 */
function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname, document.title);
  }, [location]);

  return null;
}

function App() {
  useEffect(() => {
    initGA4();
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <PageTracker />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateCV />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
