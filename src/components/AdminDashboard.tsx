import { useState, useRef } from 'react';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { X, Send, FileText, Zap, ShieldAlert, Image as ImageIcon, Video as VideoIcon, Loader2 } from 'lucide-react';

export default function AdminDashboard({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'article' | 'update'>('article');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateVideoInputRef = useRef<HTMLInputElement>(null);

  // Article Form
  const [article, setArticle] = useState({
    title: '',
    summary: '',
    content: '',
    author: '',
    category: 'Geopolitics',
    imageUrls: [] as string[],
    videoUrls: [] as string[],
    isBreaking: false
  });

  // Update Form
  const [update, setUpdate] = useState({
    title: '',
    summary: '',
    content: '',
    videoUrls: [] as string[],
    imageUrls: [] as string[],
    isBreaking: false
  });

  // Track local previews for instant UI feedback
  const [previews, setPreviews] = useState<{
    id: string;
    localUrl: string;
    remoteUrl?: string;
    type: 'image' | 'video';
    progress: number;
    status: 'uploading' | 'done' | 'error';
  }[]>([]);
  const uploading = previews.some(p => p.status === 'uploading');

  const handleFileUpload = async (file: File, type: 'image' | 'video', target: 'article' | 'update') => {
    const sizeLimit = type === 'video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > sizeLimit) {
      alert(`File is too large. Max size for ${type}s is ${type === 'video' ? '100MB' : '10MB'}.`);
      return;
    }

    const id = Math.random().toString(36).substring(7);
    const localUrl = URL.createObjectURL(file);

    // Add to previews immediately for instant feedback
    setPreviews(prev => [...prev, { id, localUrl, type, progress: 0, status: 'uploading' }]);
    
    try {
      const storageRef = ref(storage, `uploads/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setPreviews(prev => prev.map(p => p.id === id ? { ...p, progress: Math.round(progress) } : p));
        }, 
        (error) => {
          console.error("Upload error:", error);
          setPreviews(prev => prev.map(p => p.id === id ? { ...p, status: 'error' } : p));
          URL.revokeObjectURL(localUrl);
        }, 
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Update the actual form state
          if (target === 'article') {
            if (type === 'image') setArticle(prev => ({ ...prev, imageUrls: [...prev.imageUrls, url] }));
            else setArticle(prev => ({ ...prev, videoUrls: [...prev.videoUrls, url] }));
          } else {
            if (type === 'image') setUpdate(prev => ({ ...prev, imageUrls: [...prev.imageUrls, url] }));
            else setUpdate(prev => ({ ...prev, videoUrls: [...prev.videoUrls, url] }));
          }

          // Mark preview as done
          setPreviews(prev => prev.map(p => p.id === id ? { ...p, status: 'done', remoteUrl: url } : p));
          // We don't revoke immediately so the UI doesn't flicker, but we could
        }
      );
    } catch (error) {
      console.error("Upload error:", error);
      setPreviews(prev => prev.map(p => p.id === id ? { ...p, status: 'error' } : p));
    }
  };

  const removeFile = (url: string, type: 'image' | 'video', target: 'article' | 'update') => {
    // Remove from previews too
    setPreviews(prev => {
      const p = prev.find(item => item.remoteUrl === url || item.localUrl === url);
      if (p) URL.revokeObjectURL(p.localUrl);
      return prev.filter(item => item.remoteUrl !== url && item.localUrl !== url);
    });

    if (target === 'article') {
      if (type === 'image') setArticle(prev => ({ ...prev, imageUrls: prev.imageUrls.filter(u => u !== url) }));
      else setArticle(prev => ({ ...prev, videoUrls: prev.videoUrls.filter(u => u !== url) }));
    } else {
      if (type === 'image') setUpdate(prev => ({ ...prev, imageUrls: prev.imageUrls.filter(u => u !== url) }));
      else setUpdate(prev => ({ ...prev, videoUrls: prev.videoUrls.filter(u => u !== url) }));
    }
  };

  const handlePostArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (previews.some(p => p.status === 'uploading')) {
      alert("Please wait for all media to finish uploading before publishing.");
      return;
    }
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
    if (previews.some(p => p.status === 'uploading')) {
      alert("Please wait for all media to finish uploading before posting.");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'live-updates'), {
        ...update,
        timestamp: serverTimestamp()
      });
      setUpdate({ title: '', summary: '', content: '', videoUrls: [], imageUrls: [], isBreaking: false });
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
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-400">Images</label>
                    <div className="flex flex-wrap gap-2">
                      {previews.filter(p => p.type === 'image').map(preview => (
                        <div key={preview.id} className="relative w-20 h-20 group">
                          <img 
                            src={preview.localUrl} 
                            className={`w-full h-full object-cover rounded border border-gray-200 ${preview.status === 'uploading' ? 'opacity-50' : ''}`} 
                            referrerPolicy="no-referrer" 
                          />
                          {preview.status === 'uploading' && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-white/80 rounded-full p-1">
                                <Loader2 className="w-4 h-4 animate-spin text-bbc-red" />
                              </div>
                            </div>
                          )}
                          <button 
                            type="button"
                            onClick={() => removeFile(preview.remoteUrl || preview.localUrl, 'image', 'article')}
                            className="absolute -top-2 -right-2 bg-bbc-red text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button 
                        type="button"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.multiple = true;
                          input.onchange = (e: any) => {
                            const files = Array.from(e.target.files as FileList);
                            files.forEach(file => handleFileUpload(file, 'image', 'article'));
                            e.target.value = ''; // Reset
                          };
                          input.click();
                        }}
                        className="w-20 h-20 border-2 border-dashed border-gray-200 rounded flex items-center justify-center hover:border-bbc-red transition-colors"
                      >
                        <ImageIcon className="w-6 h-6 text-gray-300" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-400">Videos</label>
                    <div className="flex flex-wrap gap-2">
                      {previews.filter(p => p.type === 'video').map(preview => (
                        <div key={preview.id} className="relative w-20 h-20 group">
                          <div className="w-full h-full bg-black rounded flex items-center justify-center overflow-hidden">
                            <video src={preview.localUrl} className={`w-full h-full object-cover ${preview.status === 'uploading' ? 'opacity-30' : ''}`} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              {preview.status === 'uploading' ? (
                                <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm">
                                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                                </div>
                              ) : (
                                <VideoIcon className="w-6 h-6 text-white" />
                              )}
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeFile(preview.remoteUrl || preview.localUrl, 'video', 'article')}
                            className="absolute -top-2 -right-2 bg-bbc-red text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button 
                        type="button"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'video/*';
                          input.multiple = true;
                          input.onchange = (e: any) => {
                            const files = Array.from(e.target.files as FileList);
                            files.forEach(file => handleFileUpload(file, 'video', 'article'));
                            e.target.value = ''; // Reset
                          };
                          input.click();
                        }}
                        className="w-20 h-20 border-2 border-dashed border-gray-200 rounded flex items-center justify-center hover:border-bbc-red transition-colors"
                      >
                        <VideoIcon className="w-6 h-6 text-gray-300" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-bbc-red text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Background Uploading...
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-bbc-red h-full transition-all duration-300" 
                      style={{ width: `${previews.reduce((acc, p) => acc + p.progress, 0) / previews.length}%` }}
                    />
                  </div>
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
                disabled={loading || uploading}
                className="w-full bg-bbc-red text-white py-4 font-bold uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" /> {loading ? 'Publishing...' : uploading ? 'Uploading Media...' : 'Publish Article'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePostUpdate} className="space-y-4">
              <input 
                required
                placeholder="Update Headline"
                className="w-full p-3 border border-gray-200 rounded focus:ring-2 focus:ring-bbc-red outline-none font-serif text-lg font-bold"
                value={update.title}
                onChange={e => setUpdate({...update, title: e.target.value})}
              />
              <textarea 
                required
                placeholder="Ticker Summary (Short & Punchy)"
                className="w-full p-3 border border-gray-200 rounded focus:ring-2 focus:ring-bbc-red outline-none h-20 text-sm"
                value={update.summary}
                onChange={e => setUpdate({...update, summary: e.target.value})}
              />
              <textarea 
                required
                placeholder="Full update content..."
                className="w-full p-3 border border-gray-200 rounded focus:ring-2 focus:ring-bbc-red outline-none h-48"
                value={update.content}
                onChange={e => setUpdate({...update, content: e.target.value})}
              />
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">Media Attachments</label>
                <div className="flex flex-wrap gap-2">
                  {previews.map(preview => (
                    <div key={preview.id} className="relative w-16 h-16 group">
                      {preview.type === 'image' ? (
                        <img 
                          src={preview.localUrl} 
                          className={`w-full h-full object-cover rounded border border-gray-200 ${preview.status === 'uploading' ? 'opacity-50' : ''}`} 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <div className="w-full h-full bg-black rounded flex items-center justify-center overflow-hidden">
                          <video src={preview.localUrl} className={`w-full h-full object-cover ${preview.status === 'uploading' ? 'opacity-30' : ''}`} />
                        </div>
                      )}
                      {preview.status === 'uploading' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 animate-spin text-bbc-red" />
                        </div>
                      )}
                      <button 
                        type="button"
                        onClick={() => removeFile(preview.remoteUrl || preview.localUrl, preview.type, 'update')}
                        className="absolute -top-2 -right-2 bg-bbc-red text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*,video/*';
                      input.multiple = true;
                      input.onchange = (e: any) => {
                        const files = Array.from(e.target.files as FileList);
                        files.forEach(file => {
                          const type = file.type.startsWith('image/') ? 'image' : 'video';
                          handleFileUpload(file, type, 'update');
                        });
                        e.target.value = ''; // Reset
                      };
                      input.click();
                    }}
                    className="w-16 h-16 border-2 border-dashed border-gray-200 rounded flex items-center justify-center hover:border-bbc-red transition-colors"
                  >
                    <ImageIcon className="w-5 h-5 text-gray-300" />
                  </button>
                </div>
              </div>
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-bbc-red text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Background Uploading...
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-bbc-red h-full transition-all duration-300" 
                      style={{ width: `${previews.reduce((acc, p) => acc + p.progress, 0) / previews.length}%` }}
                    />
                  </div>
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
                disabled={loading || uploading}
                className="w-full bg-bbc-dark text-white py-4 font-bold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" /> {loading ? 'Posting...' : uploading ? 'Uploading Media...' : 'Post Update'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
