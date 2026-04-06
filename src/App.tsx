import { useState } from 'react';
import Header from './components/Header';
import BreakingNewsTicker from './components/BreakingNewsTicker';
import NewsFeed from './components/NewsFeed';
import LiveUpdateFeed from './components/LiveUpdateFeed';
import AdminDashboard from './components/AdminDashboard';
import ArticleView from './components/ArticleView';
import PolicyView from './components/PolicyView';
import BookmarksView from './components/BookmarksView';
import Footer from './components/Footer';
import { POLICIES } from './constants';
import { motion, AnimatePresence } from 'motion/react';

import { LanguageProvider } from './contexts/LanguageContext';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';

export default function App() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<{ title: string, content: string } | null>(null);

  return (
    <LanguageProvider>
      <UserPreferencesProvider>
        <div className="min-h-screen flex flex-col">
          <Header onAdminClick={() => setShowAdmin(true)} onBookmarksClick={() => setShowBookmarks(true)} />
          <BreakingNewsTicker />
        
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main Content Area */}
            <div className="lg:col-span-8">
              <NewsFeed onArticleClick={setSelectedArticle} />
            </div>

            {/* Sidebar Area */}
            <aside className="lg:col-span-4 space-y-8">
              <LiveUpdateFeed />
            </aside>
          </div>
        </main>

        <Footer onPolicyClick={(title, content) => setSelectedPolicy({ title, content })} />

        {showAdmin && <AdminDashboard onClose={() => setShowAdmin(false)} />}
        <AnimatePresence>
          {showBookmarks && (
            <BookmarksView 
              onClose={() => setShowBookmarks(false)} 
              onArticleClick={(article) => {
                setSelectedArticle(article);
                setShowBookmarks(false);
              }} 
            />
          )}
        </AnimatePresence>
        {selectedArticle && <ArticleView article={selectedArticle} onClose={() => setSelectedArticle(null)} />}
        {selectedPolicy && <PolicyView title={selectedPolicy.title} content={selectedPolicy.content} onClose={() => setSelectedPolicy(null)} />}
      </div>
      </UserPreferencesProvider>
    </LanguageProvider>
  );
}

