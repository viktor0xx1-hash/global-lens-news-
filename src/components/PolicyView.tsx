import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import { X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function PolicyView({ title, content, onClose }: { title: string, content: string, onClose: () => void }) {
  const { t } = useLanguage();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 bg-white z-[110] overflow-y-auto"
    >
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-bbc-dark">{t(title)}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="markdown-body prose prose-slate max-w-none">
          <Markdown>{content}</Markdown>
        </div>
      </div>
    </motion.div>
  );
}
