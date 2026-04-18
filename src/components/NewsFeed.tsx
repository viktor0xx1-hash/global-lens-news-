import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot, limit, startAfter, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Clock, User, Tag, Bookmark, Edit3, Share2, ChevronRight, Loader2 } from 'lucide-react';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { formatDate } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import ShareModal from './ShareModal';

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

const Skeleton = ({ className }: { className: string }) => (
  <div className={`bg-gray-200 animate-pulse rounded-sm ${className}`} />
);

export default function NewsFeed({ onEdit }: { onEdit?: (article: Article) => void }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [sharingArticle, setSharingArticle] = useState<Article | null>(null);
  const { toggleBookmark, isBookmarked } = useUserPreferences();
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, 'articles'), 
      orderBy('publishedAt', 'desc'),
      limit(10)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Article[]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      if (snapshot.size < 10) setHasMore(false);
      setLoading(false);
    }, (error) => {
      console.error("NewsFeed fetch error:", error);
      handleFirestoreError(error, OperationType.LIST, 'articles');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextQuery = query(
        collection(db, 'articles'),
        orderBy('publishedAt', 'desc'),
        startAfter(lastDoc),
        limit(10)
      );
      const snapshot = await getDocs(nextQuery);
      if (snapshot.size < 10) setHasMore(false);
      const newArticles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Article[];
      setArticles(prev => [...prev, ...newArticles]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
    } catch (error) {
      console.error("Load more error:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-1/2" />
          </div>
          <div className="lg:col-span-4 space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-24 h-24 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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

  const mainArticle = articles[0];
  const sideArticles = articles.slice(1, 4);
  const restArticles = articles.slice(4);

  const handleArticleClick = (article: Article) => {
    // Navigate to article page with slug-like URL
    const slug = article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    navigate(`/article/${article.id}/${slug}`);
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Main Feature */}
      <div className="lg:col-span-8">
        <motion.article 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => handleArticleClick(mainArticle)}
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
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4 group-hover:text-bbc-red transition-colors leading-tight">
            {mainArticle.title}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 font-serif mb-6 leading-relaxed italic line-clamp-3 md:line-clamp-none">
            {mainArticle.summary}
          </p>
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-[10px] md:text-sm text-gray-500 font-medium uppercase tracking-wider">
            <span className="flex items-center gap-2"><User className="w-3 h-3 md:w-4 md:h-4" /> {mainArticle.author}</span>
            <span className="flex items-center gap-2"><Clock className="w-3 h-3 md:w-4 md:h-4" /> {formatDate(mainArticle.publishedAt)}</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/category/${mainArticle.category.toLowerCase()}`);
              }}
              className="flex items-center gap-2 text-bbc-red hover:underline"
            >
              <Tag className="w-3 h-3 md:w-4 md:h-4" /> {mainArticle.category}
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleBookmark(mainArticle.id);
              }}
              className={`ml-auto p-2 rounded-full transition-colors ${isBookmarked(mainArticle.id) ? 'text-bbc-red bg-red-50' : 'text-gray-400 hover:bg-gray-100'}`}
            >
              <Bookmark className={`w-4 h-4 md:w-5 md:h-5 ${isBookmarked(mainArticle.id) ? 'fill-current' : ''}`} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setSharingArticle(mainArticle);
              }}
              className="p-2 px-3 md:px-4 rounded-full bg-gray-100 text-gray-600 hover:bg-bbc-red hover:text-white transition-all flex items-center gap-2"
              title="Share Article"
            >
              <Share2 className="w-3 h-3 md:w-4 md:h-4" />
              <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest">Share</span>
            </button>
            {onEdit && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(mainArticle);
                }}
                className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-bbc-red transition-colors"
                title="Edit Article"
              >
                <Edit3 className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            )}
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
            onClick={() => handleArticleClick(article)}
            className="group cursor-pointer flex gap-4"
          >
            <div className="w-20 md:w-24 h-20 md:h-24 flex-shrink-0 overflow-hidden bg-gray-100">
              <img 
                src={article.imageUrls?.[0] || article.imageUrl || `https://picsum.photos/seed/${article.id}/200/200`} 
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-serif font-bold text-base md:text-lg leading-snug group-hover:text-bbc-red transition-colors line-clamp-2">
                {article.title}
              </h4>
              <div className="flex items-center justify-between mt-3">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/category/${article.category.toLowerCase()}`);
                  }}
                  className="text-[10px] text-gray-400 uppercase tracking-widest font-bold hover:text-bbc-red"
                >
                  {article.category}
                </button>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(article.id);
                    }}
                    className={`p-1.5 rounded-full transition-all flex items-center justify-center ${isBookmarked(article.id) ? 'bg-red-50 text-bbc-red' : 'bg-gray-50 text-gray-400 hover:bg-bbc-red hover:text-white'}`}
                    title={isBookmarked(article.id) ? "Remove Bookmark" : "Bookmark Article"}
                  >
                    <Bookmark className={`w-3 h-3 ${isBookmarked(article.id) ? 'fill-current' : ''}`} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSharingArticle(article);
                    }}
                    className="p-1.5 rounded-full bg-gray-50 text-gray-400 hover:bg-bbc-red hover:text-white transition-all flex items-center justify-center"
                    title="Share Article"
                  >
                    <Share2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      </div>

      {/* Grid for rest */}
      {restArticles.length > 0 && (
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-100 mt-8">
          {restArticles.map((article, idx) => (
            <motion.article 
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => handleArticleClick(article)}
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
              <h4 className="font-serif font-bold text-lg md:text-xl mb-2 group-hover:text-bbc-red transition-colors line-clamp-2">
                {article.title}
              </h4>
              <div className="flex items-center gap-3 mb-3">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookmark(article.id);
                  }}
                  className={`p-1.5 rounded-full transition-all flex items-center justify-center ${isBookmarked(article.id) ? 'bg-red-50 text-bbc-red' : 'bg-gray-50 text-gray-400 hover:bg-bbc-red hover:text-white'}`}
                  title={isBookmarked(article.id) ? "Remove Bookmark" : "Bookmark Article"}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isBookmarked(article.id) ? 'fill-current' : ''}`} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSharingArticle(article);
                  }}
                  className="p-1.5 rounded-full bg-gray-50 text-gray-400 hover:bg-bbc-red hover:text-white transition-all inline-flex"
                  title="Share Article"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/category/${article.category.toLowerCase()}`);
                  }}
                  className="text-[10px] text-gray-400 uppercase tracking-widest font-bold hover:text-bbc-red"
                >
                  {article.category}
                </button>
              </div>
              <p className="text-gray-600 text-sm line-clamp-2 md:line-clamp-3 font-serif italic">
                {article.summary}
              </p>
            </motion.article>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-12 text-center pb-8 border-b border-gray-100">
          <button 
            onClick={loadMore}
            disabled={loadingMore}
            className="px-12 py-4 bg-gray-50 border border-gray-100 text-gray-500 text-xs font-bold uppercase tracking-widest hover:bg-bbc-red hover:text-white hover:border-bbc-red transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
          >
            {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load More Intel'}
          </button>
        </div>
      )}

      {/* Explore More Button for SEO & UX */}
      <div className="mt-8 text-center">
        <button 
          onClick={() => navigate('/category/all')}
          className="px-8 py-3 bg-bbc-dark text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2 mx-auto shadow-sm"
        >
          Browse Full Intelligence Archive <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Share Modal */}
      {sharingArticle && (
        <ShareModal 
          isOpen={!!sharingArticle} 
          onClose={() => setSharingArticle(null)} 
          article={sharingArticle} 
        />
      )}
    </div>
  );
}
