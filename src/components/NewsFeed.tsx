import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Clock, User, Tag, Bookmark } from 'lucide-react';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { formatDate } from '../lib/utils';

interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  category: string;
  imageUrl?: string;
  imageUrls?: string[];
  videoUrls?: string[];
  publishedAt: any;
  isBreaking?: boolean;
  language: string;
}

export default function NewsFeed({ onArticleClick }: { onArticleClick: (article: Article) => void }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const { toggleBookmark, isBookmarked } = useUserPreferences();

  useEffect(() => {
    const q = query(
      collection(db, 'articles'), 
      orderBy('publishedAt', 'desc'),
      limit(15)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`[NewsFeed] Received ${snapshot.size} articles from ${db.app.options.projectId}/${(db as any)._databaseId || 'default'}`);
      setArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Article[]);
    }, (error) => {
      console.error("NewsFeed fetch error:", error);
      const err = handleFirestoreError(error, OperationType.LIST, 'articles');
    });
    return () => unsubscribe();
  }, []);

  if (articles.length === 0) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-[1px] bg-gray-200" />
          <p className="text-sm font-serif italic text-gray-400 tracking-widest uppercase">
            Gathering Global Intelligence
          </p>
          <div className="w-12 h-[1px] bg-gray-200" />
        </div>
      </div>
    );
  }

  const displayArticles = articles;
  const mainArticle = displayArticles[0];
  const sideArticles = displayArticles.slice(1, 4);
  const restArticles = displayArticles.slice(4);

  return (
    <div className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Main Feature */}
      <div className="lg:col-span-8">
        <motion.article 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onArticleClick(mainArticle)}
          className="group cursor-pointer"
        >
          <div className="relative aspect-video overflow-hidden bg-gray-100 mb-4">
            <img 
              src={mainArticle.imageUrls?.[0] || mainArticle.imageUrl || `https://picsum.photos/seed/${mainArticle.id}/1200/675`} 
              alt={mainArticle.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            {mainArticle.isBreaking && (
              <div className="absolute top-4 left-4 bg-bbc-red text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
                Breaking News
              </div>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 group-hover:text-bbc-red transition-colors leading-tight">
            {mainArticle.title}
          </h1>
          <p className="text-xl text-gray-600 font-serif mb-6 leading-relaxed italic">
            {mainArticle.summary}
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500 font-medium uppercase tracking-wider">
            <span className="flex items-center gap-2"><User className="w-4 h-4" /> {mainArticle.author}</span>
            <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {formatDate(mainArticle.publishedAt)}</span>
            <span className="flex items-center gap-2 text-bbc-red"><Tag className="w-4 h-4" /> {mainArticle.category}</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleBookmark(mainArticle.id);
              }}
              className={`ml-auto p-2 rounded-full transition-colors ${isBookmarked(mainArticle.id) ? 'text-bbc-red bg-red-50' : 'text-gray-400 hover:bg-gray-100'}`}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked(mainArticle.id) ? 'fill-current' : ''}`} />
            </button>
          </div>
        </motion.article>
      </div>

      {/* Side Articles */}
      <div className="lg:col-span-4 space-y-8">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100 pb-2">
          Trending Now
        </h3>
        {sideArticles.map((article, idx) => (
          <motion.article 
            key={article.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onArticleClick(article)}
            className="group cursor-pointer flex gap-4"
          >
            <div className="w-24 h-24 flex-shrink-0 overflow-hidden bg-gray-100">
              <img 
                src={article.imageUrls?.[0] || article.imageUrl || `https://picsum.photos/seed/${article.id}/200/200`} 
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            </div>
            <div className="flex-1">
              <h4 className="font-serif font-bold text-lg leading-snug group-hover:text-bbc-red transition-colors">
                {article.title}
              </h4>
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                  {article.category}
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookmark(article.id);
                  }}
                  className={`p-1 rounded-full transition-colors ${isBookmarked(article.id) ? 'text-bbc-red' : 'text-gray-300 hover:text-bbc-red'}`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked(article.id) ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      {/* Grid for rest */}
      {restArticles.length > 0 && (
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-100">
          {restArticles.map((article, idx) => (
            <motion.article 
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => onArticleClick(article)}
              className="group cursor-pointer"
            >
              <div className="aspect-video overflow-hidden bg-gray-100 mb-4">
                <img 
                  src={article.imageUrls?.[0] || article.imageUrl || `https://picsum.photos/seed/${article.id}/600/338`} 
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </div>
              <h4 className="font-serif font-bold text-xl mb-2 group-hover:text-bbc-red transition-colors">
                {article.title}
              </h4>
              <p className="text-gray-600 text-sm line-clamp-2 font-serif italic">
                {article.summary}
              </p>
            </motion.article>
          ))}
        </div>
      )}
    </div>
    </div>
  );
}
