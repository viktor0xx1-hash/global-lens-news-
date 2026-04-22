import { useState } from 'react';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import { Clock, User, Tag, Share2, Bookmark, Twitter, Facebook, MessageCircle, Mail, Link2, Check } from 'lucide-react';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { formatDate } from '../lib/utils';
import ShareModal from './ShareModal';

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

export default function ArticleView({ article }: { article: Article }) {
  const { toggleBookmark, isBookmarked } = useUserPreferences();
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const slug = article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const baseUrl = window.location.hostname === 'localhost' ? window.location.origin : 'https://globallens.online';
  const shareUrl = `${baseUrl}/article/${article.id}/${slug}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(article.title);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white"
    >
      <header className="mb-8">
        <h1 className="text-3xl md:text-6xl font-serif font-bold mb-8 leading-tight">
          {article.title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-6 text-[10px] md:text-sm text-gray-500 font-medium uppercase tracking-wider border-y border-gray-100 py-6">
          <span className="flex items-center gap-2"><User className="w-4 h-4" /> By {article.author}</span>
          <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {formatDate(article.publishedAt, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          <span className="flex items-center gap-2 text-bbc-red"><Tag className="w-4 h-4" /> {article.category}</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Share story</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => toggleBookmark(article.id)}
              className={`w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-all ${isBookmarked(article.id) ? 'bg-bbc-red text-white' : 'bg-gray-200 text-gray-600'}`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked(article.id) ? 'fill-current' : ''}`} />
            </button>
            <a href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:scale-110 transition-transform">
              <Twitter className="w-4 h-4" />
            </a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 transition-transform">
              <Facebook className="w-4 h-4" />
            </a>
            <a href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:scale-110 transition-transform">
              <MessageCircle className="w-4 h-4" />
            </a>
            <button onClick={copyToClipboard} className={`w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-all ${copied ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Feature Image */}
      {(article.imageUrls?.[0] || article.imageUrl) && (
        <div className="aspect-video overflow-hidden bg-gray-100 mb-8 rounded-sm shadow-sm">
          <img 
            src={article.imageUrls?.[0] || article.imageUrl} 
            alt={article.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Summary */}
      <div className="mb-12 pb-8 border-b border-gray-100">
        <p className="text-xl md:text-2xl font-serif text-gray-600 leading-relaxed italic">
          {article.summary}
        </p>
      </div>

      {/* Content */}
      <div className="markdown-body prose prose-lg max-w-none prose-serif">
        {(() => {
          const paragraphs = article.content.split('\n\n').filter(p => p.trim() !== '');
          const images = article.imageUrls || (article.imageUrl ? [article.imageUrl] : []);
          const remainingImages = images.slice(1);
          let currentImageIdx = 0;

          return (
            <>
              {paragraphs.map((para, idx) => (
                <div key={idx} className="mb-6">
                  <Markdown>{para}</Markdown>
                  
                  {idx === 0 && remainingImages[currentImageIdx] && (
                    <div className="my-12 aspect-video overflow-hidden bg-gray-100 shadow-lg rounded-sm">
                      <img src={remainingImages[currentImageIdx++]} alt="Context" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}

                  {idx === 1 && remainingImages[currentImageIdx] && (
                    <div className="my-12 aspect-video overflow-hidden bg-gray-100 shadow-lg rounded-sm">
                      <img src={remainingImages[currentImageIdx++]} alt="Evidence" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Videos and more images */}
              {(article.videoUrls?.length || remainingImages.slice(currentImageIdx).length) > 0 && (
                <div className="mt-16 space-y-8 pt-12 border-t border-gray-100">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Supporting Intelligence</h4>
                  {article.videoUrls?.map((url, i) => {
                    const id = getYouTubeId(url);
                    return (
                      <div key={i} className="aspect-video overflow-hidden bg-black rounded-sm shadow-xl">
                        {id ? <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${id}`} allowFullScreen /> : <video src={url} controls className="w-full h-full object-contain" />}
                      </div>
                    );
                  })}
                  {remainingImages.slice(currentImageIdx).map((url, i) => (
                    <div key={i} className="aspect-video overflow-hidden bg-gray-100 rounded-sm shadow-md">
                      <img src={url} alt="Supplementary" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        })()}
      </div>

      <footer className="mt-20 pt-12 border-t border-gray-100 pb-12">
        <div className="bg-gray-50 p-8 text-center rounded">
          <h4 className="text-xl font-serif font-bold mb-2">Global Lens Intelligence</h4>
          <p className="text-gray-600 font-serif italic text-sm">
            Reporting on the geopolitical forces that shape our borderless world.
          </p>
        </div>
      </footer>

      {showShare && (
        <ShareModal 
          isOpen={showShare} 
          onClose={() => setShowShare(false)} 
          article={article} 
        />
      )}
    </motion.article>
  );
}
