import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ArticleView } from '../components';
import { motion } from 'motion/react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { updateMeta, slugify } from '../lib/utils';

export default function ArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    // Use onSnapshot for better resiliency and caching behavior
    const unsubscribe = onSnapshot(doc(db, 'articles', id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setArticle({ id: docSnap.id, ...data });
        
        // Update SEO metadata
        const title = data.title;
        const summary = data.summary;
        const category = data.category || 'intelligence';
        const path = `/article/${slugify(category)}/${docSnap.id}/${slugify(title)}`;
        updateMeta(title, summary, path);
      } else {
        setArticle(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching article:", error);
      setLoading(false);
    });

    window.scrollTo(0, 0);
    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest">Decrypting Story...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-32">
        <h2 className="text-2xl font-serif font-bold mb-4">Intelligence Missing</h2>
        <p className="text-gray-600 mb-8">The requested intelligence report could not be found or has been classified.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-bbc-dark text-white text-xs font-bold uppercase tracking-widest hover:bg-bbc-red transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <button 
        onClick={() => navigate('/')}
        className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-bbc-red transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Intelligence Feed
      </button>
      <ArticleView article={article} />
    </div>
  );
}
