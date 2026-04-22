import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { AlertCircle } from 'lucide-react';

export default function BreakingNewsTicker() {
  const [news, setNews] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, 'articles'),
      orderBy('publishedAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const articles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNews(articles);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (news.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [news]);

  if (news.length === 0) return null;

  return (
    <div className="bg-bbc-red text-white py-2 overflow-hidden border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4">
        <div className="flex items-center gap-2 px-2 py-0.5 bg-white text-bbc-red text-[9px] font-black uppercase tracking-tighter rounded-sm shrink-0">
          <AlertCircle className="w-3 h-3 animate-pulse" />
          <span>Breaking</span>
        </div>
        
        <div className="relative flex-1 h-4">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute inset-0 text-[10px] md:text-xs font-bold uppercase tracking-wider truncate"
            >
              {news[currentIndex]?.title}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
