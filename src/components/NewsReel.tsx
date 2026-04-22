import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function NewsReel() {
  const [articles, setArticles] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch a mix of recent articles to ensure there is content to loop
    const q = query(
      collection(db, 'articles'),
      orderBy('publishedAt', 'desc'),
      limit(24)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setArticles(docs);
    });

    return () => unsubscribe();
  }, []);

  if (articles.length < 3) return null; // Only show if we have enough content to reel

  const handleArticleClick = (article: any) => {
    const slug = article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    navigate(`/article/${article.id}/${slug}`);
  };

  // We duplicate the list for a seamless infinite scroll effect
  const displayArticles = [...articles, ...articles];

  return (
    <div className="w-full bg-gray-50 py-16 overflow-hidden border-y border-gray-100 mt-8 relative">
      <div className="max-w-7xl mx-auto px-4 mb-10 flex justify-between items-end">
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-bbc-red mb-2 translate-y-1">The Archive</h4>
          <h3 className="text-3xl font-serif font-bold italic text-bbc-dark">Intelligence Stream</h3>
        </div>
        <div className="flex flex-col items-end">
          <div className="w-12 h-0.5 bg-bbc-red mb-3"></div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hidden md:block">Constant Perspective</p>
        </div>
      </div>

      <div className="flex">
        <motion.div 
          className="flex flex-nowrap"
          animate={{
            x: ["0%", "-50%"]
          }}
          transition={{
            x: {
              repeat: Infinity,
              duration: articles.length * 5, // Speed varies with amount of content
              ease: "linear",
            },
          }}
        >
          {displayArticles.map((article, idx) => (
            <div 
              key={`${article.id}-${idx}`}
              onClick={() => handleArticleClick(article)}
              className="flex-shrink-0 w-64 md:w-80 px-4 group cursor-pointer border-r border-gray-200/50"
            >
              <div className="aspect-video overflow-hidden rounded-sm mb-4 bg-gray-200 shadow-sm transition-all duration-700 group-hover:shadow-xl group-hover:-translate-y-1 grayscale hover:grayscale-0">
                <img 
                  src={article.imageUrls?.[0] || article.imageUrl} 
                  className="w-full h-full object-cover"
                  alt={article.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-2">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-bbc-red bg-red-50 px-2 py-0.5 rounded-full inline-block">
                  {article.category}
                </span>
                <h5 className="font-serif font-bold text-sm md:text-base leading-tight group-hover:text-bbc-red transition-all duration-300 line-clamp-2">
                  {article.title}
                </h5>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{article.author}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Modern Gradient Fades for depth */}
      <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />
    </div>
  );
}
