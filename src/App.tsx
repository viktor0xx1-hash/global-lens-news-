import { useState, lazy, Suspense, useEffect } from 'react';
import Header from './components/Header';
import BreakingNewsTicker from './components/BreakingNewsTicker';
import NewsFeed from './components/NewsFeed';
import LiveUpdateFeed from './components/LiveUpdateFeed';
import Footer from './components/Footer';
import { motion, AnimatePresence } from 'motion/react';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const ArticleView = lazy(() => import('./components/ArticleView'));
const PolicyView = lazy(() => import('./components/PolicyView'));
const BookmarksView = lazy(() => import('./components/BookmarksView'));

export default function App() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<{ title: string, content: string } | null>(null);

  useEffect(() => {
    // Handle deep links from shared articles
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('article');
    
    if (articleId) {
      const fetchArticle = async () => {
        try {
          const docRef = doc(db, 'articles', articleId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setSelectedArticle({ id: docSnap.id, ...docSnap.data() });
          } else {
            // Check live updates if not found in articles
            const updateRef = doc(db, 'live-updates', articleId);
            const updateSnap = await getDoc(updateRef);
            if (updateSnap.exists()) {
              const data = updateSnap.data();
              setSelectedArticle({ 
                id: updateSnap.id, 
                ...data,
                title: data.title || 'Live Update',
                summary: data.summary || data.content.substring(0, 100)
              });
            }
          }
        } catch (error) {
          console.error("Error fetching deep linked article:", error);
        }
      };
      fetchArticle();
    }
  }, []);

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

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowAdmin(true);
  };

  const handleCloseAdmin = () => {
    setShowAdmin(false);
    setEditingItem(null);
  };

  return (
    <UserPreferencesProvider>
      <div className="min-h-screen flex flex-col">
        <Header onAdminClick={() => setShowAdmin(true)} onBookmarksClick={() => setShowBookmarks(true)} />
        <BreakingNewsTicker />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-8">
            <NewsFeed onArticleClick={setSelectedArticle} onEdit={isAdmin ? handleEdit : undefined} />
          </div>

          {/* Sidebar Area */}
          <aside className="lg:col-span-4 space-y-8">
            <LiveUpdateFeed onEdit={isAdmin ? handleEdit : undefined} />
          </aside>
        </div>
      </main>

      <Footer onPolicyClick={(title, content) => setSelectedPolicy({ title, content })} onAdminClick={() => setShowAdmin(true)} />

      <Suspense fallback={null}>
        {showAdmin && <AdminDashboard onClose={handleCloseAdmin} editItem={editingItem} />}
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

