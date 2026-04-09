import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import { X, Clock, User, Tag, Share2, Bookmark } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import SupportCard from './SupportCard';

interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  category: string;
  imageUrl?: string;
  imageUrls?: string[];
  videoUrl?: string;
  videoUrls?: string[];
  publishedAt: any;
  language: string;
}

export default function ArticleView({ article, onClose }: { article: Article, onClose: () => void }) {
  const { t } = useLanguage();
  const { toggleBookmark, isBookmarked } = useUserPreferences();

  const displayArticle = article;

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const renderMedia = () => {
    const videos = displayArticle.videoUrls || (displayArticle.videoUrl ? [displayArticle.videoUrl] : []);
    const images = displayArticle.imageUrls || (displayArticle.imageUrl ? [displayArticle.imageUrl] : []);

    return (
      <div className="space-y-8 mb-12">
        {videos.map((url, i) => {
          const youtubeId = getYouTubeId(url);
          if (youtubeId) {
            return (
              <div key={`v-${i}`} className="aspect-video overflow-hidden bg-black">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            );
          }
          return (
            <div key={`v-${i}`} className="aspect-video overflow-hidden bg-black">
              <video 
                src={url} 
                controls 
                className="w-full h-full object-contain"
                preload="metadata"
              />
            </div>
          );
        })}
        {images.map((url, i) => (
          <div key={`i-${i}`} className="aspect-video overflow-hidden bg-gray-100">
            <img 
              src={url} 
              alt={`${displayArticle.title} - ${i + 1}`}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        ))}
        {videos.length === 0 && images.length === 0 && (
          <div className="aspect-video overflow-hidden bg-gray-100">
            <img 
              src={`https://picsum.photos/seed/${displayArticle.id}/1200/675`} 
              alt={displayArticle.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-white z-[100] overflow-y-auto"
    >
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-bbc-red">
              <Tag className="w-4 h-4" /> {displayArticle.category}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => toggleBookmark(article.id)}
              className={`p-2 rounded-full transition-colors ${isBookmarked(article.id) ? 'text-bbc-red bg-red-50' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked(article.id) ? 'fill-current' : ''}`} />
            </button>
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: article.title,
                    text: article.summary,
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 py-12">
        <header className="mb-12">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-8 leading-tight">
            {displayArticle.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 font-medium uppercase tracking-wider border-y border-gray-100 py-6">
            <span className="flex items-center gap-2"><User className="w-4 h-4" /> {t('By')} {displayArticle.author}</span>
            <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {new Date(displayArticle.publishedAt?.toDate()).toLocaleString()}</span>
          </div>
        </header>

        {renderMedia()}

        <div className="markdown-body prose prose-lg max-w-none">
          <Markdown>{displayArticle.content}</Markdown>
        </div>

        <SupportCard variant="article" />

        <footer className="mt-20 pt-12 border-t border-gray-100">
          <div className="bg-gray-50 p-8 text-center">
            <h4 className="text-xl font-serif font-bold mb-2">{t('Global Lens Journalism')}</h4>
            <p className="text-gray-600 font-serif italic">
              {t('Reporting on the forces that shape our world.')}
            </p>
          </div>
        </footer>
      </article>
    </motion.div>
  );
}
