import { useState, useEffect, memo } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot, limit, startAfter, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Clock, User, Tag, Bookmark, Edit3, Share2, ChevronRight, Loader2 } from 'lucide-react';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { formatDate, slugify } from '../lib/utils';
import { useNavigate, Link } from 'react-router-dom';
import ShareModal from './ShareModal';
import { getCachedArticles, setCachedArticles } from '../services/newsService';

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
  <div className={`bg-gray-100 animate-pulse rounded-sm relative overflow-hidden ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
  </div>
);

export default memo(function NewsFeed({ onEdit, limitCount }: { onEdit?: (article: Article) => void, limitCount?: number }) {
  const cacheKey = `feed_${limitCount || 'default'}`;
  const cached = getCachedArticles(cacheKey);

  const [articles, setArticles] = useState<Article[]>(cached?.data || []);
  const [loading, setLoading] = useState(!cached);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(cached?.lastDoc || null);
  const [hasMore, setHasMore] = useState(true);
  const [sharingArticle, setSharingArticle] = useState<Article | null>(null);
  const { toggleBookmark, isBookmarked } = useUserPreferences();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLimit = limitCount || 10;
    const q = query(
      collection(db, 'articles'), 
      orderBy('publishedAt', 'desc'),
      limit(fetchLimit)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Article[];
      setArticles(data);
      const last = snapshot.docs[snapshot.docs.length - 1] || null;
      setLastDoc(last);
      setCachedArticles(cacheKey, data, last);
      
      if (snapshot.size < fetchLimit || limitCount) setHasMore(false);
      setLoading(false);
    }, (error) => {
      console.error("NewsFeed fetch error:", error);
      handleFirestoreError(error, OperationType.LIST, 'articles');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [limitCount]);

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
  const sideArticles = articles.slice(1, 6);
  const restArticles = articles.slice(6);

  const handleArticleClick = (article: Article) => {
    // Navigate to article page with slug-like URL including category if available
    const slug = slugify(article.title);
    const catSlug = article.category ? slugify(article.category) : 'intelligence';
    navigate(`/article/${catSlug}/${article.id}/${slug}`);
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-8">
      {/* Main Feature */}
      <div className="lg:col-span-8">
        <motion.article 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="group border-b border-gray-100 lg:border-none pb-2 lg:pb-0 mb-2 lg:mb-0"
        >
          <Link 
            to={`/article/${mainArticle.category ? slugify(mainArticle.category) : 'intelligence'}/${mainArticle.id}/${slugify(mainArticle.title)}`}
            className="block"
          >
            <div className="relative aspect-[16/10] md:aspect-video overflow-hidden bg-gray-100 mb-3 rounded-sm shadow-sm">
              <img 
                src={mainArticle.imageUrls?.[0] || mainArticle.imageUrl || `https://picsum.photos/seed/${mainArticle.id}/1200/675`} 
                alt={mainArticle.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              {mainArticle.isBreaking && (
                <div className="absolute top-3 left-3 bg-bbc-red text-white px-2 py-0.5 text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-lg">
                  Breaking News
                </div>
              )}
            </div>
            <h1 className="text-xl md:text-5xl font-serif font-bold mb-2 group-hover:text-bbc-red transition-colors leading-tight tracking-tight">
              {mainArticle.title}
            </h1>
          </Link>
          <p className="text-sm md:text-xl text-gray-600 font-serif mb-3 leading-relaxed italic line-clamp-2 md:line-clamp-none">
            {mainArticle.summary}
          </p>
          <div className="flex flex-wrap items-center gap-3 md:gap-6 text-[9px] md:text-sm text-gray-600 font-medium uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><User className="w-3 h-3 md:w-4 md:h-4" /> {mainArticle.author}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 md:w-4 md:h-4" /> {formatDate(mainArticle.publishedAt)}</span>
            <Link 
              to={`/category/${mainArticle.category.toLowerCase()}`}
              className="flex items-center gap-1.5 text-bbc-red hover:underline font-bold"
            >
              <Tag className="w-3 h-3 md:w-4 md:h-4" /> {mainArticle.category}
            </Link>
            <div className="ml-auto flex items-center gap-1 md:gap-4">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBookmark(mainArticle.id);
                }}
                className={`p-1.5 rounded-full transition-colors ${isBookmarked(mainArticle.id) ? 'text-bbc-red bg-red-50' : 'text-gray-400 hover:bg-gray-100'}`}
                aria-label={isBookmarked(mainArticle.id) ? "Remove Bookmark" : "Add Bookmark"}
              >
                <Bookmark className={`w-3.5 h-3.5 md:w-5 md:h-5 ${isBookmarked(mainArticle.id) ? 'fill-current' : ''}`} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSharingArticle(mainArticle);
                }}
                className="p-1.5 px-2 md:px-4 rounded-full bg-gray-50 text-gray-500 hover:bg-bbc-red hover:text-white transition-all flex items-center gap-1.5"
                title="Share Article"
                aria-label="Share article"
              >
                <Share2 className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-[7px] md:text-[10px] font-bold uppercase tracking-widest hidden xs:block">Share</span>
              </button>
              {onEdit && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(mainArticle);
                  }}
                  className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-bbc-red transition-colors"
                  title="Edit Article"
                >
                  <Edit3 className="w-3.5 h-3.5 md:w-5 md:h-5" />
                </button>
              )}
            </div>
          </div>
        </motion.article>
      </div>

      {/* Side Articles */}
      <div className="lg:col-span-4 space-y-6 lg:space-y-8">
        <h2 className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-gray-600 border-b border-gray-100 pb-2">
          Trending Now
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 lg:gap-8">
          {sideArticles.map((article, idx) => (
            <motion.article 
              key={article.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group flex gap-4"
            >
              <Link 
                to={`/article/${article.category ? slugify(article.category) : 'intelligence'}/${article.id}/${slugify(article.title)}`}
                className="w-20 md:w-24 h-20 md:h-24 flex-shrink-0 overflow-hidden bg-gray-100 rounded-sm"
              >
                <img 
                  src={article.imageUrls?.[0] || article.imageUrl || `https://picsum.photos/seed/${article.id}/200/200`} 
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/article/${article.category ? slugify(article.category) : 'intelligence'}/${article.id}/${slugify(article.title)}`}>
                  <h3 className="font-serif font-bold text-sm md:text-lg leading-snug group-hover:text-bbc-red transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                </Link>
                <div className="flex items-center justify-between mt-2">
                  <Link 
                    to={`/category/${article.category.toLowerCase()}`}
                    className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest font-bold hover:text-bbc-red"
                  >
                    {article.category}
                  </Link>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(article.id);
                      }}
                      className={`p-1 rounded-full transition-colors ${isBookmarked(article.id) ? 'text-bbc-red' : 'text-gray-300 hover:text-bbc-red'}`}
                      aria-label="Bookmark article"
                    >
                      <Bookmark className={`w-3 h-3 md:w-4 md:h-4 ${isBookmarked(article.id) ? 'fill-current' : ''}`} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSharingArticle(article);
                      }}
                      className="p-1 rounded-full text-gray-300 hover:text-bbc-red transition-colors"
                      aria-label="Share article"
                    >
                      <Share2 className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                    {onEdit && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(article);
                        }}
                        className="p-1 rounded-full text-gray-300 hover:text-bbc-red transition-colors"
                        title="Edit Article"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
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
              className="group"
            >
              <Link 
                to={`/article/${article.category ? slugify(article.category) : 'intelligence'}/${article.id}/${slugify(article.title)}`}
                className="block"
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
                <h3 className="font-serif font-bold text-lg md:text-xl mb-2 group-hover:text-bbc-red transition-colors line-clamp-2">
                  {article.title}
                </h3>
              </Link>
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
                {onEdit && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(article);
                    }}
                    className="p-1.5 rounded-full bg-gray-50 text-gray-400 hover:bg-bbc-red hover:text-white transition-all"
                    title="Edit Article"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
                <Link 
                  to={`/category/${article.category.toLowerCase()}`}
                  className="text-[10px] text-gray-400 uppercase tracking-widest font-bold hover:text-bbc-red"
                >
                  {article.category}
                </Link>
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
        <Link 
          to="/category/all"
          className="px-8 py-3 bg-bbc-dark text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors inline-flex items-center gap-2 mx-auto shadow-sm"
        >
          Browse Full Intelligence Archive <ChevronRight className="w-3 h-3" />
        </Link>
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
});
