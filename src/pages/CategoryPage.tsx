import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot, where, limit, startAfter, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Clock, Tag, Bookmark, Share2, ArrowLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { formatDate, slugify } from '../lib/utils';
import { ShareModal, NewsReel } from '../components';

interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  category: string;
  imageUrl?: string;
  imageUrls?: string[];
  publishedAt: any;
  isBreaking?: boolean;
}

export default function CategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [sharingArticle, setSharingArticle] = useState<Article | null>(null);
  const { toggleBookmark, isBookmarked } = useUserPreferences();

  useEffect(() => {
    setLoading(true);
    setHasMore(true);
    let q;
    const articlesRef = collection(db, 'articles');
    
    if (categoryId && categoryId !== 'all') {
      const categoryLabel = categoryId === 'geopolitics' 
        ? 'World News/Geopolitics' 
        : (categoryId.charAt(0).toUpperCase() + categoryId.slice(1));
      
      const categoryFilter = categoryId === 'geopolitics'
        ? where('category', 'in', ['World News/ Geopolitics', 'World News/Geopolitics', 'Geopolitics'])
        : where('category', '==', categoryLabel);

      q = query(
        articlesRef, 
        categoryFilter,
        orderBy('publishedAt', 'desc'),
        limit(12)
      );
    } else {
      q = query(
        articlesRef, 
        orderBy('publishedAt', 'desc'),
        limit(12)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setArticles(snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as Article[]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      if (snapshot.size < 12) setHasMore(false);
      setLoading(false);
    }, (error) => {
      console.error("Category fetch error:", error);
      handleFirestoreError(error, OperationType.LIST, 'articles');
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [categoryId]);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      let nextQuery;
      const articlesRef = collection(db, 'articles');
      
      if (categoryId && categoryId !== 'all') {
        const categoryLabel = categoryId === 'geopolitics' 
          ? 'World News/Geopolitics' 
          : (categoryId.charAt(0).toUpperCase() + categoryId.slice(1));
        
        const categoryFilter = categoryId === 'geopolitics'
          ? where('category', 'in', ['World News/ Geopolitics', 'World News/Geopolitics', 'Geopolitics'])
          : where('category', '==', categoryLabel);

        nextQuery = query(
          articlesRef,
          categoryFilter,
          orderBy('publishedAt', 'desc'),
          startAfter(lastDoc),
          limit(12)
        );
      } else {
        nextQuery = query(
          articlesRef,
          orderBy('publishedAt', 'desc'),
          startAfter(lastDoc),
          limit(12)
        );
      }
      
      const snapshot = await getDocs(nextQuery);
      if (snapshot.size < 12) setHasMore(false);
      const newArticles = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as Article[];
      setArticles(prev => [...prev, ...newArticles]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
    } catch (error) {
      console.error("Load more error:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const categoryName = categoryId === 'all' 
    ? 'Full Archive' 
    : (categoryId === 'geopolitics' ? 'World News/Geopolitics' : (categoryId?.charAt(0).toUpperCase() + categoryId?.slice(1)));

  if (loading) {
    return (
      <div className="py-24 text-center text-gray-400">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-48 bg-gray-200 mx-auto" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="space-y-4 text-left">
                <div className="aspect-video bg-gray-200" />
                <div className="h-6 bg-gray-200 w-3/4" />
                <div className="h-4 bg-gray-200 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-gray-100 pb-8 gap-4">
        <div>
          <button 
            onClick={() => navigate('/')}
            className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-bbc-red transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
          <h1 className="text-2xl md:text-4xl font-serif font-bold text-bbc-dark flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-bbc-red italic">{categoryName}</span> Intelligence
          </h1>
          <p className="text-gray-500 mt-2 font-serif italic pb-2">
            Viewing {articles.length} reports in this sector
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {articles.map((article, idx) => (
              <motion.article 
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => {
                  const slug = slugify(article.title);
                  const catSlug = slugify(article.category);
                  navigate(`/article/${catSlug}/${article.id}/${slug}`);
                }}
                className="group cursor-pointer border-b border-gray-50 pb-8 last:border-0"
              >
                <div className="aspect-video overflow-hidden bg-gray-100 mb-4 rounded-sm shadow-sm">
                  <img 
                    src={article.imageUrls?.[0] || article.imageUrl || `https://picsum.photos/seed/${article.id}/600/338`} 
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h4 className="font-serif font-bold text-xl mb-3 group-hover:text-bbc-red transition-colors leading-snug">
                  {article.title}
                </h4>
                <div className="flex items-center gap-4 mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                   <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {formatDate(article.publishedAt)}</span>
                   {categoryId === 'all' && (
                     <span className="text-bbc-red">#{article.category}</span>
                   )}
                </div>
                <p className="text-gray-600 text-sm line-clamp-3 font-serif italic mb-6">
                  {article.summary}
                </p>
                <div className="flex items-center gap-3 mt-auto">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(article.id);
                    }}
                    className={`p-2 rounded-full transition-all ${isBookmarked(article.id) ? 'bg-red-50 text-bbc-red' : 'bg-gray-50 text-gray-400 hover:bg-bbc-red hover:text-white'}`}
                    title={isBookmarked(article.id) ? "Remove Bookmark" : "Bookmark Article"}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isBookmarked(article.id) ? 'fill-current' : ''}`} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSharingArticle(article);
                    }}
                    className="p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-bbc-red hover:text-white transition-all"
                    title="Share Article"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="ml-auto text-bbc-red opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
                    Read Report <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </motion.article>
            ))}
          </div>

          {articles.length === 0 && (
            <div className="py-24 text-center">
              <p className="text-gray-400 italic">No reports available in this intelligence sector currently.</p>
            </div>
          )}

          {hasMore && (
            <div className="mt-16 text-center border-t border-gray-100 pt-12">
              <button 
                onClick={loadMore}
                disabled={loadingMore}
                className="px-12 py-4 bg-bbc-dark text-white text-[10px] font-bold uppercase tracking-widest hover:bg-bbc-red transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
              >
                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Retrieve More Intelligence'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-20 -mx-4">
        <NewsReel />
      </div>

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
