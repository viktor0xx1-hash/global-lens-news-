import { useState, lazy, Suspense } from 'react';
import Header from './components/Header';
import BreakingNewsTicker from './components/BreakingNewsTicker';
import NewsFeed from './components/NewsFeed';
import LiveUpdateFeed from './components/LiveUpdateFeed';
import Footer from './components/Footer';
import { motion, AnimatePresence } from 'motion/react';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';

const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const ArticleView = lazy(() => import('./components/ArticleView'));
const PolicyView = lazy(() => import('./components/PolicyView'));
const BookmarksView = lazy(() => import('./components/BookmarksView'));

export default function App() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<{ title: string, content: string } | null>(null);

  return (
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

      <Footer onPolicyClick={(title, content) => setSelectedPolicy({ title, content })} onAdminClick={() => setShowAdmin(true)} />

      <Suspense fallback={null}>
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
      </Suspense>
    </div>
    </UserPreferencesProvider>
  );
}

