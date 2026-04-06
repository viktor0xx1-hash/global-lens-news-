import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Languages } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { translateUpdate } from '../services/translationService';

interface LiveUpdate {
  id: string;
  content: string;
  timestamp: any;
  isBreaking?: boolean;
  language: string;
}

export default function BreakingNewsTicker() {
  const [updates, setUpdates] = useState<LiveUpdate[]>([]);
  const [translatedUpdates, setTranslatedUpdates] = useState<LiveUpdate[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { currentLanguage, t } = useLanguage();

  useEffect(() => {
    const q = query(
      collection(db, 'live-updates'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newUpdates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LiveUpdate[];
      setUpdates(newUpdates);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'live-updates');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const translateTicker = async () => {
      if (updates.length === 0) return;
      
      if (currentLanguage.code === 'en') {
        setTranslatedUpdates(updates);
        return;
      }

      setIsTranslating(true);
      try {
        // Translate sequentially to avoid rate limits
        const translated = [];
        for (const update of updates) {
          translated.push(await translateUpdate(update, currentLanguage.name));
        }
        setTranslatedUpdates(translated);
      } catch (error) {
        console.error("Ticker translation error:", error);
        setTranslatedUpdates(updates);
      } finally {
        setIsTranslating(false);
      }
    };

    translateTicker();
  }, [updates, currentLanguage.code]);

  const displayUpdates = translatedUpdates.length > 0 ? translatedUpdates : updates;

  useEffect(() => {
    if (displayUpdates.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % displayUpdates.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [displayUpdates]);

  if (displayUpdates.length === 0) return null;

  return (
    <div className="bg-bbc-red text-white py-2 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-4">
        <div className="flex items-center gap-2 font-bold uppercase tracking-tighter text-sm whitespace-nowrap border-r border-white/30 pr-4">
          <Zap className="w-4 h-4 fill-white animate-pulse" /> {t('Breaking')}
        </div>
        <div className="relative flex-1 h-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="absolute inset-0 text-sm font-medium truncate"
            >
              {displayUpdates[currentIndex].content}
            </motion.div>
          </AnimatePresence>
        </div>
        {isTranslating && (
          <div className="flex items-center gap-1 text-white/60 text-[10px] font-bold uppercase tracking-widest animate-pulse">
            <Languages className="w-3 h-3" /> {t('Translating...')}
          </div>
        )}
      </div>
    </div>
  );
}
