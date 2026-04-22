import { useState, lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Header, Footer, AdminDashboard, ArticleView, PolicyView, BookmarksView, ErrorBoundary, BreakingNewsTicker } from './components';
import { motion, AnimatePresence } from 'motion/react';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import { auth } from './firebase';

// Pages
import HomePage from './pages/HomePage';
import ArticlePage from './pages/ArticlePage';
import CategoryPage from './pages/CategoryPage';
import AboutPage from './pages/AboutPage';

function AppContent() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<{ title: string, content: string } | null>(null);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        const adminEmail = "viktor0xx1@gmail.com";
        const adminUid = "Dt2QUfA9nCMCTb0NNGg1Ngkf86E3";
        setIsAdmin(user.email?.toLowerCase() === adminEmail.toLowerCase() || user.uid === adminUid);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Reset scroll on navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowAdmin(true);
  };

  const handleCloseAdmin = () => {
    setShowAdmin(false);
    setEditingItem(null);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-bbc-dark selection:bg-bbc-red selection:text-white">
      <Header onAdminClick={() => setShowAdmin(true)} onBookmarksClick={() => setShowBookmarks(true)} />
      <BreakingNewsTicker />
    
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 w-full">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-32 text-gray-400">
            <div className="w-8 h-8 border-2 border-bbc-red border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Loading Intelligence...</p>
          </div>
        }>
          <Routes>
            <Route path="/" element={<HomePage isAdmin={isAdmin} handleEdit={handleEdit} />} />
            <Route path="/article/:id/:slug" element={<ArticlePage />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </Suspense>
      </main>

      <Footer onPolicyClick={(title, content) => setSelectedPolicy({ title, content })} onAdminClick={() => setShowAdmin(true)} />

      <Suspense fallback={null}>
        {showAdmin && <AdminDashboard onClose={handleCloseAdmin} editItem={editingItem} />}
        <AnimatePresence>
          {showBookmarks && (
            <BookmarksView 
              onClose={() => setShowBookmarks(false)} 
            />
          )}
        </AnimatePresence>
        {selectedPolicy && <PolicyView title={selectedPolicy.title} content={selectedPolicy.content} onClose={() => setSelectedPolicy(null)} />}
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <UserPreferencesProvider>
          <AppContent />
        </UserPreferencesProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

