import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { motion } from 'motion/react';
import { X, Bookmark, Clock, Tag } from 'lucide-react';
import { useUserPreferences } from '../contexts/UserPreferencesContext';

interface Article {
  id: string;
  title: string;
  summary: string;
  category: string;
  imageUrl: string;
  publishedAt: any;
}

export default function BookmarksView({ onClose, onArticleClick }: { onClose: () => void, onArticleClick: (article: any) => void }) {
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const { bookmarks, toggleBookmark } = useUserPreferences();

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (bookmarks.length === 0) {
        setBookmarkedArticles([]);
        setLoading(false);
        return;
      }

      try {
        // Firestore 'in' query is limited to 10 IDs, but for a simple bookmark feature it's okay for now
        // For more, we'd fetch in chunks or individually
        const q = query(
          collection(db, 'articles'),
          where(documentId(), 'in', bookmarks.slice(0, 10))
        );
        const snapshot = await getDocs(q);
        setBookmarkedArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Article[]);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'articles');
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [bookmarks]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-[120] shadow-2xl flex flex-col"
    >
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-bbc-dark text-white">
        <h2 className="text-xl font-bold uppercase tracking-widest flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-bbc-red fill-current" /> Bookmarks
        </h2>
        <button onClick={onClose} className="hover:text-bbc-red transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-bbc-red border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookmarkedArticles.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
              No bookmarks yet
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookmarkedArticles.map((article) => (
              <div 
                key={article.id}
                className="group cursor-pointer flex gap-4"
                onClick={() => onArticleClick(article)}
              >
                <div className="w-20 h-20 flex-shrink-0 overflow-hidden bg-gray-100 rounded">
                  <img 
                    src={article.imageUrl || `https://picsum.photos/seed/${article.id}/200/200`} 
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif font-bold text-sm leading-snug group-hover:text-bbc-red transition-colors line-clamp-2">
                    {article.title}
                  </h4>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {article.category}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(article.id);
                      }}
                      className="text-bbc-red hover:text-red-700 transition-colors"
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
