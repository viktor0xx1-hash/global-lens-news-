import { useState } from 'react';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import { X, Clock, User, Tag, Share2, Bookmark, Twitter, Facebook, MessageCircle, Mail, Link2, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import SupportCard from './SupportCard';
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
  likes?: number;
  dislikes?: number;
}

export default function ArticleView({ article, onClose }: { article: Article, onClose: () => void }) {
  const { toggleBookmark, isBookmarked, toggleLike, toggleDislike, getVote } = useUserPreferences();
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  // Use query parameter instead of path to avoid 404 on SPAs without server-side routing
  const shareUrl = `${window.location.origin}/?article=${article.id}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(article.title);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayArticle = article;

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
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
            <div className="flex items-center gap-4 mr-2 border-r border-gray-100 pr-4">
              <button 
                onClick={() => toggleLike(article.id, 'articles')}
                className={`flex items-center gap-1.5 transition-colors ${getVote(article.id) === 'like' ? 'text-bbc-red' : 'text-gray-600 hover:text-bbc-red'}`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span className="text-xs font-bold">{article.likes || 0}</span>
              </button>
              <button 
                onClick={() => toggleDislike(article.id, 'articles')}
                className={`flex items-center gap-1.5 transition-colors ${getVote(article.id) === 'dislike' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <ThumbsDown className="w-4 h-4" />
                <span className="text-xs font-bold">{article.dislikes || 0}</span>
              </button>
            </div>
            <button 
              onClick={() => toggleBookmark(article.id)}
              className={`p-2 rounded-full transition-colors ${isBookmarked(article.id) ? 'text-bbc-red bg-red-50' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked(article.id) ? 'fill-current' : ''}`} />
            </button>
            <button 
              onClick={() => setShowShare(true)}
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
        <header className="mb-8">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-8 leading-tight">
            {displayArticle.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 font-medium uppercase tracking-wider border-y border-gray-100 py-6">
            <span className="flex items-center gap-2"><User className="w-4 h-4" /> By {displayArticle.author}</span>
            <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {formatDate(displayArticle.publishedAt, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {/* Prominent Share Bar */}
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Share this story</span>
            <div className="flex items-center gap-4 mr-2 border-r border-gray-100 pr-4">
              <button 
                onClick={() => toggleLike(article.id, 'articles')}
                className={`flex items-center gap-1.5 transition-colors ${getVote(article.id) === 'like' ? 'text-bbc-red' : 'text-gray-600 hover:text-bbc-red'}`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span className="text-xs font-bold">{article.likes || 0}</span>
              </button>
              <button 
                onClick={() => toggleDislike(article.id, 'articles')}
                className={`flex items-center gap-1.5 transition-colors ${getVote(article.id) === 'dislike' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <ThumbsDown className="w-4 h-4" />
                <span className="text-xs font-bold">{article.dislikes || 0}</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => toggleBookmark(article.id)}
                className={`w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-all ${isBookmarked(article.id) ? 'bg-bbc-red text-white' : 'bg-gray-200 text-gray-600'}`}
                title={isBookmarked(article.id) ? "Remove Bookmark" : "Bookmark Article"}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked(article.id) ? 'fill-current' : ''}`} />
              </button>
              <a 
                href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:scale-110 transition-transform"
                title="Share on X"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 transition-transform"
                title="Share on Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:scale-110 transition-transform"
                title="Share on WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a 
                href={`https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=&su=${encodedTitle}&body=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-[#EA4335] text-white flex items-center justify-center hover:scale-110 transition-transform"
                title="Share via Email"
              >
                <Mail className="w-4 h-4" />
              </a>
              <button 
                onClick={copyToClipboard}
                className={`w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-all ${copied ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                title="Copy Link"
              >
                {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </header>

        {/* Feature Image */}
        {(displayArticle.imageUrls?.[0] || displayArticle.imageUrl) && (
          <div className="aspect-video overflow-hidden bg-gray-100 mb-8">
            <img 
              src={displayArticle.imageUrls?.[0] || displayArticle.imageUrl} 
              alt={displayArticle.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Summary Section */}
        <div className="mb-12 pb-8 border-b border-gray-100">
          <p className="text-2xl font-serif text-gray-600 leading-relaxed italic">
            {displayArticle.summary}
          </p>
        </div>

        <div className="markdown-body prose prose-lg max-w-none">
          {(() => {
            const paragraphs = displayArticle.content.split('\n\n').filter(p => p.trim() !== '');
            const images = displayArticle.imageUrls || (displayArticle.imageUrl ? [displayArticle.imageUrl] : []);
            const videos = displayArticle.videoUrls || (displayArticle.videoUrl ? [displayArticle.videoUrl] : []);
            
            // Image 1 is used as Feature Image above
            const remainingImages = images.slice(1);
            let currentImageIdx = 0;

            return (
              <>
                {paragraphs.map((para, idx) => (
                  <div key={idx}>
                    <Markdown>{para}</Markdown>
                    
                    {/* Place Image 2 after Paragraph 1 */}
                    {idx === 0 && remainingImages[currentImageIdx] && (
                      <div className="my-12 aspect-video overflow-hidden bg-gray-100 shadow-lg rounded-sm">
                        <img 
                          src={remainingImages[currentImageIdx++]} 
                          alt={`Detail ${currentImageIdx}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {/* Place Image 3 after Paragraph 2 */}
                    {idx === 1 && remainingImages[currentImageIdx] && (
                      <div className="my-12 aspect-video overflow-hidden bg-gray-100 shadow-lg rounded-sm">
                        <img 
                          src={remainingImages[currentImageIdx++]} 
                          alt={`Detail ${currentImageIdx}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>
                ))}

                {/* Remaining Media at the bottom */}
                {(remainingImages.slice(currentImageIdx).length > 0 || videos.length > 0) && (
                  <div className="mt-16 space-y-8 pt-12 border-t border-gray-100">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-8">Additional Media</h4>
                    {videos.map((url, i) => {
                      const youtubeId = getYouTubeId(url);
                      return (
                        <div key={`v-${i}`} className="aspect-video overflow-hidden bg-black shadow-xl rounded-sm">
                          {youtubeId ? (
                            <iframe
                              className="w-full h-full"
                              src={`https://www.youtube.com/embed/${youtubeId}`}
                              title="YouTube video player"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          ) : (
                            <video 
                              src={url} 
                              controls 
                              className="w-full h-full object-contain"
                              preload="metadata"
                            />
                          )}
                        </div>
                      );
                    })}
                    {remainingImages.slice(currentImageIdx).map((url, i) => (
                      <div key={`ri-${i}`} className="aspect-video overflow-hidden bg-gray-100 shadow-md rounded-sm">
                        <img 
                          src={url} 
                          alt="Additional coverage"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        <SupportCard variant="article" />

        {/* Bottom Share Bar */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="flex flex-col items-center gap-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Enjoyed this story? Share it with your network</span>
            <div className="flex items-center gap-6 mb-4 border-b border-gray-100 pb-6">
              <button 
                onClick={() => toggleLike(article.id, 'articles')}
                className={`flex items-center gap-3 transition-all hover:scale-105 ${getVote(article.id) === 'like' ? 'text-bbc-red' : 'text-gray-500 hover:text-bbc-red'}`}
              >
                <ThumbsUp className="w-8 h-8" />
                <div className="text-left">
                  <div className="text-xl font-bold leading-none">{article.likes || 0}</div>
                  <div className="text-[10px] uppercase tracking-widest font-bold opacity-60">Likes</div>
                </div>
              </button>
              <div className="w-[1px] h-8 bg-gray-200 mx-2" />
              <button 
                onClick={() => toggleDislike(article.id, 'articles')}
                className={`flex items-center gap-3 transition-all hover:scale-105 ${getVote(article.id) === 'dislike' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <ThumbsDown className="w-8 h-8" />
                <div className="text-left">
                  <div className="text-xl font-bold leading-none">{article.dislikes || 0}</div>
                  <div className="text-[10px] uppercase tracking-widest font-bold opacity-60">Dislikes</div>
                </div>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => toggleBookmark(article.id)}
                className={`w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-lg ${isBookmarked(article.id) ? 'bg-bbc-red text-white' : 'bg-gray-800 text-white hover:bg-black'}`}
                title={isBookmarked(article.id) ? "Remove Bookmark" : "Bookmark Article"}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked(article.id) ? 'fill-current' : ''}`} />
              </button>
              <a 
                href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                title="Share on X"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                title="Share on Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                title="Share on WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a 
                href={`https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=&su=${encodedTitle}&body=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-[#EA4335] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                title="Share via Email"
              >
                <Mail className="w-5 h-5" />
              </a>
              <button 
                onClick={copyToClipboard}
                className={`w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-lg ${copied ? 'bg-green-500 text-white' : 'bg-gray-800 text-white hover:bg-black'}`}
                title="Copy Link"
              >
                {copied ? <Check className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <footer className="mt-20 pt-12 border-t border-gray-100">
          <div className="bg-gray-50 p-8 text-center">
            <h4 className="text-xl font-serif font-bold mb-2">Global Lens Journalism</h4>
            <p className="text-gray-600 font-serif italic">
              Reporting on the forces that shape our world.
            </p>
          </div>
        </footer>
      </article>

      <ShareModal 
        isOpen={showShare} 
        onClose={() => setShowShare(false)} 
        article={article} 
      />
    </motion.div>
  );
}
