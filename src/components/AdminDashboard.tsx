import { useState, useRef } from 'react';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { X, Send, FileText, Zap, ShieldAlert, Image as ImageIcon, Video as VideoIcon, Loader2 } from 'lucide-react';
import { languages } from '../contexts/LanguageContext';

export default function AdminDashboard({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'article' | 'update'>('article');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateVideoInputRef = useRef<HTMLInputElement>(null);

  // Article Form
  const [article, setArticle] = useState({
    title: '',
    summary: '',
    content: '',
    author: '',
    category: 'Geopolitics',
    imageUrl: '',
    videoUrl: '',
    isBreaking: false,
    language: 'en'
  });

  // Update Form
  const [update, setUpdate] = useState({
    content: '',
    videoUrl: '',
    isBreaking: false,
    language: 'en'
  });

  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    setUploading(true);
    try {
      const storageRef = ref(storage, `uploads/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
      if (activeTab === 'article') {
        if (type === 'image') setArticle(prev => ({ ...prev, imageUrl: url }));
        else setArticle(prev => ({ ...prev, videoUrl: url }));
      } else {
        setUpdate(prev => ({ ...prev, videoUrl: url }));
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handlePostArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'articles'), {
        ...article,
        publishedAt: serverTimestamp()
      });
      alert('Article published successfully!');
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'articles');
    } finally {
      setLoading(false);
    }
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'live-updates'), {
        ...update,
        timestamp: serverTimestamp()
      });
      setUpdate({ content: '', videoUrl: '', isBreaking: false, language: 'en' });
      alert('Live update posted!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'live-updates');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-bbc-dark text-white">
          <h2 className="text-xl font-bold uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-bbc-red" /> Editor Control
          </h2>
          <button onClick={onClose} className="hover:text-bbc-red transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('article')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'article' ? 'text-bbc-red border-b-2 border-bbc-red' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <FileText className="w-4 h-4" /> New Article
          </button>
          <button 
            onClick={() => setActiveTab('update')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'update' ? 'text-bbc-red border-b-2 border-bbc-red' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Zap className="w-4 h-4" /> Live Update
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {activeTab === 'article' ? (
            <form onSubmit={handlePostArticle} className="space-y-4">
              <input 
                required
                placeholder="Headline"
                className="w-full p-3 border border-gray-200 rounded focus:ring-2 focus:ring-bbc-red outline-none font-serif text-xl font-bold"
                value={article.title}
                onChange={e => setArticle({...article, title: e.target.value})}
              />
              <textarea 
                required
                placeholder="Summary (for homepage)"
                className="w-full p-3 border border-gray-200 rounded focus:ring-2 focus:ring-bbc-red outline-none font-serif h-24"
                value={article.summary}
                onChange={e => setArticle({...article, summary: e.target.value})}
              />
              <textarea 
                required
                placeholder="Content (Markdown supported)"
                className="w-full p-3 border border-gray-200 rounded focus:ring-2 focus:ring-bbc-red outline-none font-mono text-sm h-64"
                value={article.content}
                onChange={e => setArticle({...article, content: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  placeholder="Author Name"
                  className="p-3 border border-gray-200 rounded focus:ring-2 focus:ring-bbc-red outline-none"
                  value={article.author}
                  onChange={e => setArticle({...article, author: e.target.value})}
                />
                <select 
                  className="p-3 border border-gray-200 rounded focus:ring-2 focus:ring-bbc-red outline-none"
                  value={article.category}
                  onChange={e => setArticle({...article, category: e.target.value})}
                >
                  <option>Geopolitics</option>
                  <option>Economy</option>
                  <option>Conflict</option>
                  <option>Diplomacy</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400">Main Image</label>
                  <div className="flex gap-2">
                    <input 
                      placeholder="Image URL"
                      className="flex-1 p-3 border border-gray-200 rounded focus:ring-2 focus:ring-bbc-red outline-none text-sm"
                      value={article.imageUrl}
                      onChange={e => setArticle({...article, imageUrl: e.target.value})}
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ImageIcon className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400">Main Video</label>
                  <div className="flex gap-2">
                    <input 
                      placeholder="Video URL"
                      className="flex-1 p-3 border border-gray-200 rounded focus:ring-2 focus:ring-bbc-red outline-none text-sm"
                      value={article.videoUrl}
                      onChange={e => setArticle({...article, videoUrl: e.target.value})}
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'video/*';
                        input.onchange = (e: any) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'video');
                        input.click();
                      }}
                      className="p-3 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      <VideoIcon className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
              {uploading && (
                <div className="flex items-center gap-2 text-bbc-red text-xs font-bold animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading file...
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={article.isBreaking}
                  onChange={e => setArticle({...article, isBreaking: e.target.checked})}
                  className="w-4 h-4 accent-bbc-red"
                />
                <span className="text-sm font-bold uppercase text-bbc-red">Mark as Breaking News</span>
              </label>
              <button 
                disabled={loading}
                className="w-full bg-bbc-red text-white py-4 font-bold uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" /> {loading ? 'Publishing...' : 'Publish Article'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePostUpdate} className="space-y-4">
              <textarea 
                required
                placeholder="Short update text..."
                className="w-full p-3 border border-gray-200 rounded focus:ring-2 focus:ring-bbc-red outline-none h-32"
                value={update.content}
                onChange={e => setUpdate({...update, content: e.target.value})}
              />
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">Attach Video</label>
                <div className="flex gap-2">
                  <input 
                    placeholder="Video URL"
                    className="flex-1 p-3 border border-gray-200 rounded focus:ring-2 focus:ring-bbc-red outline-none text-sm"
                    value={update.videoUrl}
                    onChange={e => setUpdate({...update, videoUrl: e.target.value})}
                  />
                  <button 
                    type="button"
                    onClick={() => updateVideoInputRef.current?.click()}
                    className="p-3 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    <VideoIcon className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <input 
                  type="file"
                  ref={updateVideoInputRef}
                  className="hidden"
                  accept="video/*"
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'video')}
                />
              </div>
              {uploading && (
                <div className="flex items-center gap-2 text-bbc-red text-xs font-bold animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading file...
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={update.isBreaking}
                  onChange={e => setUpdate({...update, isBreaking: e.target.checked})}
                  className="w-4 h-4 accent-bbc-red"
                />
                <span className="text-sm font-bold uppercase text-bbc-red">Major Breaking Update</span>
              </label>
              <button 
                disabled={loading}
                className="w-full bg-bbc-dark text-white py-4 font-bold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" /> {loading ? 'Posting...' : 'Post Update'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
