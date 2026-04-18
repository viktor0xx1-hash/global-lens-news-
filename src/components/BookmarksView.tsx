import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { motion } from 'motion/react';
import { X, Bookmark } from 'lucide-react';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { useNavigate } from 'react-router-dom';

interface BookmarkedItem {
  id: string;
  title?: string;
  summary?: string;
  content?: string;
  category?: string;
  imageUrl?: string;
  imageUrls?: string[];
  publishedAt?: any;
  timestamp?: any;
  type: 'article' | 'update';
}

export default function BookmarksView({ onClose }: { onClose: () => void }) {
  const [bookmarkedItems, setBookmarkedItems] = useState<BookmarkedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { bookmarks, toggleBookmark } = useUserPreferences();
  const navigate = useNavigate();

  const handleArticleClick = (item: BookmarkedItem) => {
    if (item.type === 'article') {
      const slug = (item.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      navigate(`/article/${item.id}/${slug}`);
      onClose();
    }
  };

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (bookmarks.length === 0) {
        setBookmarkedItems([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch from articles
        const articlesQuery = query(
          collection(db, 'articles'),
          where(documentId(), 'in', bookmarks.slice(0, 10))
        );
        
        // Fetch from live-updates
        const updatesQuery = query(
          collection(db, 'live-updates'),
          where(documentId(), 'in', bookmarks.slice(0, 10))
        );

        const [articlesSnap, updatesSnap] = await Promise.all([
          getDocs(articlesQuery),
          getDocs(updatesQuery)
        ]);

        const articles = articlesSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(), 
          type: 'article' as const 
        }));
        
        const updates = updatesSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(), 
          type: 'update' as const 
        }));

        // Combine and sort by date (publishedAt or timestamp)
        const combined = [...articles, ...updates].sort((a: any, b: any) => {
          const dateA = a.publishedAt || a.timestamp;
          const dateB = b.publishedAt || b.timestamp;
          return (dateB?.seconds || 0) - (dateA?.seconds || 0);
        });

        setBookmarkedItems(combined as BookmarkedItem[]);
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
        // We don't want to show a big error if one collection fails or is empty
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
        ) : bookmarkedItems.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
              No bookmarks yet
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookmarkedItems.map((item) => (
              <div 
                key={item.id}
                className="group cursor-pointer flex gap-4"
                onClick={() => handleArticleClick(item)}
              >
                <div className="w-20 h-20 flex-shrink-0 overflow-hidden bg-gray-100 rounded">
                  <img 
                    src={item.imageUrls?.[0] || item.imageUrl || `https://picsum.photos/seed/${item.id}/200/200`} 
                    alt={item.title || 'Update'}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${item.type === 'article' ? 'bg-blue-100 text-blue-600' : 'bg-bbc-red text-white'}`}>
                      {item.type}
                    </span>
                    {item.category && (
                      <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif font-bold text-sm leading-snug group-hover:text-bbc-red transition-colors line-clamp-2">
                    {item.title || item.summary || (item.content ? item.content.substring(0, 60) + '...' : 'Live Update')}
                  </h4>
                  <div className="flex items-center justify-end mt-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(item.id);
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
