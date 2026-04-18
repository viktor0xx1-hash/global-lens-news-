import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { motion } from 'motion/react';
import { formatTime } from '../lib/utils';
import { Edit3, Share2, Bookmark } from 'lucide-react';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import ShareModal from './ShareModal';

interface LiveUpdate {
  id: string;
  title?: string;
  summary?: string;
  content: string;
  videoUrls?: string[];
  imageUrls?: string[];
  timestamp: any;
  isBreaking?: boolean;
}

const Skeleton = ({ className }: { className: string }) => (
  <div className={`bg-gray-200 animate-pulse rounded-sm ${className}`} />
);

export default function LiveUpdateFeed({ onEdit }: { onEdit?: (update: LiveUpdate) => void }) {
  const [updates, setUpdates] = useState<LiveUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharingUpdate, setSharingUpdate] = useState<LiveUpdate | null>(null);
  const { toggleBookmark, isBookmarked } = useUserPreferences();

  useEffect(() => {
    const q = query(
      collection(db, 'live-updates'), 
      orderBy('timestamp', 'desc'), 
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUpdates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LiveUpdate[]);
      setLoading(false);
    }, (error) => {
      console.error("LiveUpdateFeed fetch error:", error);
      handleFirestoreError(error, OperationType.LIST, 'live-updates');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 border border-gray-100 space-y-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 bg-bbc-red rounded-full" />
          <div className="h-4 w-24 bg-gray-100 animate-pulse" />
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="relative pl-8 space-y-2">
            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-gray-100" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-bbc-red rounded-full animate-ping" />
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-bbc-red">
            Live Updates
          </h3>
        </div>
      </div>
      
      <div className="space-y-8 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-200">
        {updates.map((update, idx) => (
          <motion.div 
            key={update.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="relative pl-8"
          >
            <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${update.isBreaking ? 'bg-bbc-red' : 'bg-bbc-dark'}`} />
            <div className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider flex items-center justify-between">
              <span>{formatTime(update.timestamp)} GMT</span>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => toggleBookmark(update.id)}
                  className={`p-1.5 rounded-full transition-all shadow-sm ${isBookmarked(update.id) ? 'bg-red-50 text-bbc-red' : 'bg-white border border-gray-100 text-gray-400 hover:bg-bbc-red hover:text-white'}`}
                  title={isBookmarked(update.id) ? "Remove Bookmark" : "Bookmark Update"}
                >
                  <Bookmark className={`w-3 h-3 ${isBookmarked(update.id) ? 'fill-current' : ''}`} />
                </button>
                <button 
                  onClick={() => setSharingUpdate(update)}
                  className="p-1.5 rounded-full bg-white border border-gray-100 text-gray-400 hover:bg-bbc-red hover:text-white transition-all shadow-sm"
                  title="Share Update"
                >
                  <Share2 className="w-3 h-3" />
                </button>
                {onEdit && (
                  <button 
                    onClick={() => onEdit(update)}
                    className="text-gray-300 hover:text-bbc-red transition-colors"
                    title="Edit Update"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            {update.title && (
              <h4 className={`text-sm font-bold mb-1 ${update.isBreaking ? 'text-bbc-red' : 'text-bbc-dark'}`}>
                {update.title}
              </h4>
            )}
            {update.summary && (
              <p className="text-sm font-serif italic text-gray-600 mb-3 leading-relaxed border-l-2 border-gray-200 pl-3">
                {update.summary}
              </p>
            )}
            <div className={`text-sm leading-relaxed ${update.isBreaking ? 'font-bold text-bbc-red' : 'text-gray-700'}`}>
              {(() => {
                const paragraphs = update.content.split('\n\n').filter(p => p.trim() !== '');
                const images = update.imageUrls || [];
                const videos = update.videoUrls || [];
                let currentImgIdx = 0;

                if (paragraphs.length > 0) {
                  return (
                    <div className="space-y-4">
                      {paragraphs.map((para, idx) => (
                        <div key={idx}>
                          <p>{para}</p>
                          
                          {/* Image after Para 1 */}
                          {idx === 0 && images[currentImgIdx] && (
                            <div className="my-4 aspect-video overflow-hidden bg-gray-100 rounded border border-gray-200 shadow-sm">
                              <img 
                                src={images[currentImgIdx++]} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                loading="lazy"
                              />
                            </div>
                          )}

                          {/* Image after Para 2 */}
                          {idx === 1 && images[currentImgIdx] && (
                            <div className="my-4 aspect-video overflow-hidden bg-gray-100 rounded border border-gray-200 shadow-sm">
                              <img 
                                src={images[currentImgIdx++]} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                loading="lazy"
                              />
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Remaining Media */}
                      {(images.slice(currentImgIdx).length > 0 || videos.length > 0) && (
                        <div className="mt-4 space-y-2">
                          {images.slice(currentImgIdx).map((url, i) => (
                            <div key={`rem-i-${i}`} className="aspect-video overflow-hidden bg-gray-100 rounded border border-gray-200 shadow-sm">
                              <img 
                                src={url} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                loading="lazy"
                              />
                            </div>
                          ))}
                          {videos.map((url, i) => (
                            <div key={`rem-v-${i}`} className="aspect-video overflow-hidden bg-black rounded shadow-sm">
                              <video 
                                src={url} 
                                controls 
                                className="w-full h-full object-contain"
                                preload="metadata"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return update.content;
              })()}
            </div>
            {/* Fallback for empty content but has media */}
            {update.content.trim() === '' && (
              <div className="mt-3 space-y-2">
                {update.imageUrls?.map((url, i) => (
                  <div key={i} className="aspect-video overflow-hidden bg-gray-100 rounded border border-gray-200 shadow-sm">
                    <img 
                      src={url} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </div>
                ))}
                {update.videoUrls?.map((url, i) => (
                  <div key={i} className="aspect-video overflow-hidden bg-black rounded shadow-sm">
                    <video 
                      src={url} 
                      controls 
                      className="w-full h-full object-contain"
                      preload="metadata"
                    />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
        
        {updates.length === 0 && (
          <div className="text-xs text-gray-400 font-medium uppercase tracking-wider pl-8">
            Monitoring channels...
          </div>
        )}
      </div>

      {sharingUpdate && (
        <ShareModal 
          isOpen={!!sharingUpdate} 
          onClose={() => setSharingUpdate(null)} 
          article={{
            id: sharingUpdate.id,
            title: sharingUpdate.title || 'Live Update',
            summary: sharingUpdate.summary || sharingUpdate.content.substring(0, 100)
          }} 
        />
      )}
    </div>
  );
}
