import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LiveUpdate {
  id: string;
  content: string;
  timestamp: any;
  isBreaking?: boolean;
  language: string;
}

export default function BreakingNewsTicker() {
  const [updates, setUpdates] = useState<LiveUpdate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { t } = useLanguage();

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

  const displayUpdates = updates;

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
      </div>
    </div>
  );
}
