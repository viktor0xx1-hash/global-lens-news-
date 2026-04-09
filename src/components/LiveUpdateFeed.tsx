import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface LiveUpdate {
  id: string;
  title?: string;
  content: string;
  videoUrls?: string[];
  imageUrls?: string[];
  timestamp: any;
  isBreaking?: boolean;
  language: string;
}

export default function LiveUpdateFeed() {
  const [updates, setUpdates] = useState<LiveUpdate[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    const q = query(
      collection(db, 'live-updates'), 
      orderBy('timestamp', 'desc'), 
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUpdates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LiveUpdate[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'live-updates');
    });
    return () => unsubscribe();
  }, []);

  const displayUpdates = updates;

  return (
    <div className="bg-gray-50 p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-bbc-red rounded-full animate-ping" />
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-bbc-red">
            {t('Live Updates')}
          </h3>
        </div>
      </div>
      
      <div className="space-y-8 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-200">
        {displayUpdates.map((update, idx) => (
          <motion.div 
            key={update.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="relative pl-8"
          >
            <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${update.isBreaking ? 'bg-bbc-red' : 'bg-bbc-dark'}`} />
            <div className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">
              {new Date(update.timestamp?.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} GMT
            </div>
            {update.title && (
              <h4 className={`text-sm font-bold mb-1 ${update.isBreaking ? 'text-bbc-red' : 'text-bbc-dark'}`}>
                {update.title}
              </h4>
            )}
            <p className={`text-sm leading-relaxed ${update.isBreaking ? 'font-bold text-bbc-red' : 'text-gray-700'}`}>
              {update.content}
            </p>
            <div className="mt-3 space-y-2">
              {update.imageUrls?.map((url, i) => (
                <div key={i} className="aspect-video overflow-hidden bg-gray-100 rounded border border-gray-200">
                  <img 
                    src={url} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
              {update.videoUrls?.map((url, i) => (
                <div key={i} className="aspect-video overflow-hidden bg-black rounded">
                  <video 
                    src={url} 
                    controls 
                    className="w-full h-full object-contain"
                    preload="metadata"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        ))}
        
        {updates.length === 0 && (
          <div className="text-xs text-gray-400 font-medium uppercase tracking-wider pl-8">
            {t('Monitoring channels...')}
          </div>
        )}
      </div>
    </div>
  );
}
