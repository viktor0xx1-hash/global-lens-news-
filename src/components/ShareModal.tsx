import { motion, AnimatePresence } from 'motion/react';
import { X, Twitter, Facebook, MessageCircle, Mail, Link2, Check } from 'lucide-react';
import { useState } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: {
    title: string;
    summary: string;
    id: string;
  };
}

export default function ShareModal({ isOpen, onClose, article }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  
  // Use query parameter instead of path to avoid 404 on SPAs without server-side routing
  const shareUrl = `${window.location.origin}/?article=${article.id}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(article.title);

  const shareOptions = [
    {
      name: 'Twitter / X',
      icon: <Twitter className="w-5 h-5" />,
      color: 'bg-black text-white',
      link: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
    },
    {
      name: 'Facebook',
      icon: <Facebook className="w-5 h-5" />,
      color: 'bg-[#1877F2] text-white',
      link: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    },
    {
      name: 'WhatsApp',
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'bg-[#25D366] text-white',
      link: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`
    },
    {
      name: 'Gmail',
      icon: <Mail className="w-5 h-5" />,
      color: 'bg-[#EA4335] text-white',
      link: `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=&su=${encodedTitle}&body=${encodedUrl}`
    }
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold uppercase tracking-widest text-bbc-dark">Share Article</h3>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {shareOptions.map((option) => (
                  <a
                    key={option.name}
                    href={option.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-3 rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98] ${option.color}`}
                  >
                    {option.icon}
                    <span className="text-sm font-bold">{option.name}</span>
                  </a>
                ))}
              </div>

              <div className="pt-4">
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">Copy Link</label>
                <div className="flex gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100">
                  <input 
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-transparent text-xs text-gray-500 outline-none px-2 truncate"
                  />
                  <button 
                    onClick={copyToClipboard}
                    className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${copied ? 'bg-green-500 text-white' : 'bg-bbc-dark text-white hover:bg-black'}`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                    <span className="text-[10px] font-bold uppercase">{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                Global Lens Journalism
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
