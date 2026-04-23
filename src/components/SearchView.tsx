import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Clock, ArrowRight, Loader2, Edit3 } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { slugify, formatDate } from '../lib/utils';

interface Article {
  id: string;
  title: string;
  summary: string;
  category: string;
  publishedAt: any;
  imageUrl?: string;
}

export default function SearchView({ onClose, isAdmin, onEdit }: { 
  onClose: () => void,
  isAdmin?: boolean,
  onEdit?: (article: any) => void
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Fetch articles on mount for searching
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const q = query(collection(db, 'articles'), orderBy('publishedAt', 'desc'), limit(100));
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Article[];
        setArticles(fetched);
        setLoading(false);
      } catch (error) {
        console.error("Search fetch error:", error);
        setLoading(false);
      }
    };
    fetchArticles();
    inputRef.current?.focus();
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredArticles([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = articles.filter(article => 
      article.title.toLowerCase().includes(term) || 
      article.summary.toLowerCase().includes(term) ||
      article.category.toLowerCase().includes(term)
    );
    setFilteredArticles(filtered);
  }, [searchTerm, articles]);

  const handleArticleClick = (article: Article) => {
    const slug = slugify(article.title);
    const catSlug = article.category ? slugify(article.category) : 'intelligence';
    navigate(`/article/${catSlug}/${article.id}/${slug}`);
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white z-[100] flex flex-col"
    >
      {/* Search Header */}
      <div className="border-b border-gray-100 px-4 py-4 md:py-8">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Search Intelligence Reports..."
            className="flex-1 bg-transparent border-none outline-none text-lg md:text-2xl font-serif placeholder:text-gray-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Scanning Archive...</p>
            </div>
          ) : searchTerm.trim() === '' ? (
            <div className="text-center py-20">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Search Global Lens</p>
              <h3 className="text-xl font-serif italic text-gray-300">Enter keywords to browse investigative documents</h3>
            </div>
          ) : filteredArticles.length > 0 ? (
            <div className="space-y-8">
              <p className="text-[10px] font-bold uppercase tracking-widest text-bbc-red pb-4 border-b border-gray-50">
                {filteredArticles.length} Intelligence Reports Found
              </p>
              {filteredArticles.map((article) => (
                <motion.div 
                  key={article.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => handleArticleClick(article)}
                  className="group cursor-pointer flex gap-4 md:gap-6 items-start hover:bg-gray-50/50 p-2 -mx-2 rounded-lg transition-colors"
                >
                  {article.imageUrl && (
                    <div className="w-20 h-20 md:w-32 md:h-20 shrink-0 bg-gray-100 overflow-hidden rounded-sm">
                      <img src={article.imageUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-bbc-red">{article.category}</span>
                      <span className="text-[9px] text-gray-400">•</span>
                      <span className="text-[9px] text-gray-400 font-bold flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {formatDate(article.publishedAt)}
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-base md:text-xl group-hover:text-bbc-red transition-colors line-clamp-2">
                      {article.title}
                    </h4>
                    <p className="text-xs md:text-sm text-gray-500 line-clamp-1 italic mt-1 font-serif">
                      {article.summary}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-2 self-center">
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-bbc-red shrink-0 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    {isAdmin && onEdit && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(article);
                          onClose();
                        }}
                        className="p-1.5 rounded-full text-gray-300 hover:text-bbc-red transition-colors"
                        title="Edit Article"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-xl font-serif text-gray-400 mb-2">No matching intelligence found.</h3>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-300">Try broader terms like "Global" or "Sector"</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
