import { useState, useRef, useEffect } from 'react';
import { db, storage, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, limit, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { X, Send, FileText, Zap, ShieldAlert, Image as ImageIcon, Video as VideoIcon, Loader2, AlertCircle, CheckCircle2, User as UserIcon, Database, Edit3, Trash2 } from 'lucide-react';

export default function AdminDashboard({ onClose, editItem }: { onClose: () => void, editItem?: any }) {
  const [activeTab, setActiveTab] = useState<'article' | 'update'>('article');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [version] = useState('v2.9-EDIT-UPLOAD-FIX'); 
  const [editingId, setEditingId] = useState<string | null>(null);
  const [user, setUser] = useState(auth.currentUser);
  const [stats, setStats] = useState({ articles: 0, updates: 0 });
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'uid' | 'rules'>('idle');

  const copyToClipboard = (text: string, type: 'uid' | 'rules') => {
    navigator.clipboard.writeText(text);
    setCopyStatus(type);
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const runConnectionTest = async () => {
    setTestStatus('testing');
    try {
      // Log DB details for debugging
      const dbDetails = {
        databaseId: (db as any)._databaseId?.database || 'unknown',
        projectId: (db as any)._databaseId?.projectId || 'unknown',
        authUid: user?.uid,
        authEmail: user?.email
      };
      console.log("[Admin] Testing connection to:", dbDetails);

      // Try a write to the test collection
      const testRef = await addDoc(collection(db, 'test'), {
        timestamp: serverTimestamp(),
        userEmail: user?.email,
        userUid: user?.uid,
        type: 'connection-test',
        version: 'v2.8'
      });
      console.log("Test write successful:", testRef.id);
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
    } catch (err: any) {
      console.error("Test write failed:", err);
      setTestStatus('error');
      
      // Provide more helpful error message
      let msg = `❌ CONNECTION TEST FAILED!\n\n`;
      if (err.message.includes('permission')) {
        msg += `Reason: Security Rules are blocking this write.\n\n`;
        msg += `Action: Please copy the 'Rules' from the dashboard and paste them into your Firebase Console for the 'global-lens-db' database.`;
      } else {
        msg += `Error: ${err.message}`;
      }
      alert(msg);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(u => setUser(u));
    
    // Listen for stats to verify DB connection
    const unsubArticles = onSnapshot(collection(db, 'articles'), snap => {
      console.log("[Admin] Articles count update:", snap.size);
      setStats(prev => ({ ...prev, articles: snap.size }));
      setDbStatus('connected');
    }, err => {
      console.error("[Admin] Articles stats error:", err);
      setDbStatus('error');
    });
    const unsubUpdates = onSnapshot(collection(db, 'live-updates'), snap => {
      console.log("[Admin] Updates count update:", snap.size);
      setStats(prev => ({ ...prev, updates: snap.size }));
    }, err => {
      console.error("[Admin] Updates stats error:", err);
    });

    return () => {
      unsubscribe();
      unsubArticles();
      unsubUpdates();
    };
  }, []);

  // Handle Edit Item
  useEffect(() => {
    if (editItem) {
      setEditingId(editItem.id);
      if (editItem.publishedAt) {
        // It's an article
        setActiveTab('article');
        setArticle({
          title: editItem.title || '',
          summary: editItem.summary || '',
          content: editItem.content || '',
          author: editItem.author || '',
          category: editItem.category || 'Geopolitics',
          imageUrls: editItem.imageUrls || [],
          videoUrls: editItem.videoUrls || [],
          isBreaking: editItem.isBreaking || false
        });
        // Populate previews for editing
        const existingPreviews = [
          ...(editItem.imageUrls || []).map((url: string) => ({
            id: Math.random().toString(36).substring(7),
            localUrl: url,
            remoteUrl: url,
            type: 'image' as const,
            progress: 100,
            status: 'done' as const
          })),
          ...(editItem.videoUrls || []).map((url: string) => ({
            id: Math.random().toString(36).substring(7),
            localUrl: url,
            remoteUrl: url,
            type: 'video' as const,
            progress: 100,
            status: 'done' as const
          }))
        ];
        setPreviews(existingPreviews);
      } else {
        // It's a live update
        setActiveTab('update');
        setUpdate({
          title: editItem.title || '',
          summary: editItem.summary || '',
          content: editItem.content || '',
          imageUrls: editItem.imageUrls || [],
          videoUrls: editItem.videoUrls || [],
          isBreaking: editItem.isBreaking || false
        });
        const existingPreviews = [
          ...(editItem.imageUrls || []).map((url: string) => ({
            id: Math.random().toString(36).substring(7),
            localUrl: url,
            remoteUrl: url,
            type: 'image' as const,
            progress: 100,
            status: 'done' as const
          })),
          ...(editItem.videoUrls || []).map((url: string) => ({
            id: Math.random().toString(36).substring(7),
            localUrl: url,
            remoteUrl: url,
            type: 'video' as const,
            progress: 100,
            status: 'done' as const
          }))
        ];
        setPreviews(existingPreviews);
      }
    }
  }, [editItem]);
  const articleImageInputRef = useRef<HTMLInputElement>(null);
  const articleVideoInputRef = useRef<HTMLInputElement>(null);
  const updateMediaInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [urlType, setUrlType] = useState<'image' | 'video'>('image');

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
  const previewsRef = useRef(previews);
  useEffect(() => { previewsRef.current = previews; }, [previews]);
  const uploading = previews.some(p => p.status === 'uploading');

  const handleFileUpload = async (file: File, type: 'image' | 'video', target: 'article' | 'update') => {
    const id = Math.random().toString(36).substring(7);
    const localUrl = URL.createObjectURL(file);

    // Add to previews immediately for instant feedback
    setPreviews(prev => [...prev, { id, localUrl, type, progress: 0, status: 'uploading' }]);

    try {
      // SIMPLE UPLOAD - No compression, no resumable task to avoid mobile hangs
      const storageRef = ref(storage, `uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`);
      
      // We use a simple promise-based upload
      const result = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(result.ref);
      
      // Update the actual form state
      if (target === 'article') {
        if (type === 'image') setArticle(prev => ({ ...prev, imageUrls: [...prev.imageUrls, url] }));
        else setArticle(prev => ({ ...prev, videoUrls: [...prev.videoUrls, url] }));
      } else {
        if (type === 'image') setUpdate(prev => ({ ...prev, imageUrls: [...prev.imageUrls, url] }));
        else setUpdate(prev => ({ ...prev, videoUrls: [...prev.videoUrls, url] }));
      }

      // Mark preview as done
      setPreviews(prev => prev.map(p => p.id === id ? { ...p, status: 'done', remoteUrl: url, progress: 100 } : p));
    } catch (error: any) {
      console.error("Upload failed for file:", file.name, error);
      alert(`Upload failed for ${file.name}: ${error.message}`);
      setPreviews(prev => prev.map(p => p.id === id ? { ...p, status: 'error' } : p));
    }
  };

  const handleAddByUrl = (target: 'article' | 'update') => {
    if (!urlInput.trim()) return;
    
    // Split by comma or space and filter out empty strings
    const urls = urlInput.split(/[,\s]+/).map(u => u.trim()).filter(u => u.length > 0);
    if (urls.length === 0) return;

    const newPreviews = urls.map(url => ({
      id: Math.random().toString(36).substring(7),
      localUrl: url,
      remoteUrl: url,
      type: urlType,
      progress: 100,
      status: 'done' as const
    }));

    setPreviews(prev => [...prev, ...newPreviews]);

    // Update form state
    if (target === 'article') {
      setArticle(prev => ({
        ...prev,
        imageUrls: urlType === 'image' ? [...prev.imageUrls, ...urls] : prev.imageUrls,
        videoUrls: urlType === 'video' ? [...prev.videoUrls, ...urls] : prev.videoUrls
      }));
    } else {
      setUpdate(prev => ({
        ...prev,
        imageUrls: urlType === 'image' ? [...prev.imageUrls, ...urls] : prev.imageUrls,
        videoUrls: urlType === 'video' ? [...prev.videoUrls, ...urls] : prev.videoUrls
      }));
    }

    setUrlInput('');
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

  const handleDelete = async () => {
    if (!editingId) return;
    if (!window.confirm("Are you sure you want to delete this content? This cannot be undone.")) return;
    
    setLoading(true);
    try {
      const collectionName = activeTab === 'article' ? 'articles' : 'live-updates';
      await deleteDoc(doc(db, collectionName, editingId));
      console.log("Deleted document:", editingId);
      setSuccess(true);
      setEditingId(null);
      setLoading(false);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error("Delete failed:", error);
      alert(`❌ DELETE FAILED!\n\nReason: ${error.message}`);
      setLoading(false);
    }
  };

  const handlePostArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    
    const finalize = async () => {
      try {
        const dbId = (db as any)._databaseId || 'default';
        console.log(`[Admin] Attempting to ${editingId ? 'update' : 'publish'} article to ${dbId}...`, article);
        
        if (editingId) {
          await updateDoc(doc(db, 'articles', editingId), {
            ...article,
            updatedAt: serverTimestamp()
          });
          console.log("Article updated with ID:", editingId);
        } else {
          const docRef = await addDoc(collection(db, 'articles'), {
            ...article,
            publishedAt: serverTimestamp()
          });
          console.log("Article published with ID:", docRef.id);
        }

        setSuccess(true);
        setEditingId(null);
        setArticle({
          title: '',
          summary: '',
          content: '',
          author: '',
          category: 'Geopolitics',
          imageUrls: [],
          videoUrls: [],
          isBreaking: false
        });
        setPreviews([]);
        setLoading(false);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      } catch (error: any) {
        console.error("Post failed deep error:", error);
        alert(`❌ PUBLISH FAILED!\n\nReason: ${error.message}\n\nYour Email: ${user?.email}\nVerified: ${user?.emailVerified}\n\nIf this persists, please ensure you are logged in as the authorized admin.`);
        setLoading(false);
      }
    };

    if (uploading) {
      let attempts = 0;
      const check = setInterval(() => {
        attempts++;
        const stillUploading = previewsRef.current.some(p => p.status === 'uploading');
        if (!stillUploading || attempts > 20) { // 10 second timeout
          clearInterval(check);
          finalize();
        }
      }, 500);
    } else {
      finalize();
    }
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const finalize = async () => {
      try {
        console.log("Attempting to post live update...", update);
        if (editingId) {
          await updateDoc(doc(db, 'live-updates', editingId), {
            ...update,
            updatedAt: serverTimestamp()
          });
          console.log("Update updated with ID:", editingId);
        } else {
          const docRef = await addDoc(collection(db, 'live-updates'), {
            ...update,
            timestamp: serverTimestamp()
          });
          console.log("Update posted with ID:", docRef.id);
        }
        setSuccess(true);
        setEditingId(null);
        setUpdate({ title: '', summary: '', content: '', videoUrls: [], imageUrls: [], isBreaking: false });
        setPreviews([]);
        setLoading(false);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      } catch (error: any) {
        console.error("Update failed deep error:", error);
        alert(`❌ POST FAILED!\n\nReason: ${error.message}\n\nYour Email: ${user?.email}\nVerified: ${user?.emailVerified}`);
        setLoading(false);
      }
    };

    if (uploading) {
      let attempts = 0;
      const check = setInterval(() => {
        attempts++;
        const stillUploading = previewsRef.current.some(p => p.status === 'uploading');
        if (!stillUploading || attempts > 20) { // 10 second timeout
          clearInterval(check);
          finalize();
        }
      }, 500);
    } else {
      finalize();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-bbc-dark text-white">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-bbc-red" /> {editingId ? 'Edit Content' : 'Editor Control'}
              <span className="text-[10px] font-mono bg-bbc-red px-1 rounded ml-2">{version}</span>
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${user ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-[10px] text-gray-400 font-mono">
                  {user ? user.email : 'NOT LOGGED IN'}
                </span>
              </div>
              
              {user && (
                <>
                  <div className="w-px h-3 bg-gray-700" />
                  <button 
                    onClick={() => copyToClipboard(user.uid, 'uid')}
                    className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white font-mono transition-colors"
                    title="Click to copy UID"
                  >
                    UID: {user.uid.substring(0, 6)}... 
                    {copyStatus === 'uid' ? <span className="text-green-500">Copied!</span> : <FileText className="w-3 h-3" />}
                  </button>
                </>
              )}

              <div className="w-px h-3 bg-gray-700" />
              <div className="flex items-center gap-1.5">
                <Database className={`w-3 h-3 ${dbStatus === 'connected' ? 'text-green-500' : dbStatus === 'error' ? 'text-red-500' : 'text-gray-500 animate-pulse'}`} />
                <span className={`text-[10px] font-mono uppercase tracking-wider ${dbStatus === 'connected' ? 'text-green-500' : dbStatus === 'error' ? 'text-red-500' : 'text-gray-500'}`}>
                  {dbStatus === 'connected' ? 'Online' : dbStatus === 'error' ? 'Locked' : 'Sync...'}
                </span>
              </div>
              
              <div className="w-px h-3 bg-gray-700" />
              <div className="flex items-center gap-2">
                <button 
                  onClick={runConnectionTest}
                  disabled={testStatus === 'testing'}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider transition-colors ${
                    testStatus === 'success' ? 'bg-green-500/20 text-green-500' : 
                    testStatus === 'error' ? 'bg-red-500/20 text-red-500' : 
                    'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {testStatus === 'testing' ? '...' : testStatus === 'success' ? 'OK' : testStatus === 'error' ? 'Fail' : 'Test'}
                </button>
                
                <button 
                  onClick={() => copyToClipboard(`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    function isAdmin() {\n      return request.auth != null && (request.auth.token.email.matches("(?i)viktor0xx1@gmail\\\\.com") || request.auth.uid == "${user?.uid}");\n    }\n    match /test/{docId} { allow read, write: if true; }\n    match /articles/{articleId} { allow read: if true; allow write: if isAdmin(); }\n    match /live-updates/{updateId} { allow read: if true; allow write: if isAdmin(); }\n    match /users/{userId} { allow read: if request.auth != null && (request.auth.uid == userId || isAdmin()); allow write: if isAdmin(); }\n  }\n}`, 'rules')}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-bbc-red/20 text-bbc-red hover:bg-bbc-red/30 transition-colors"
                >
                  {copyStatus === 'rules' ? 'Rules Copied!' : 'Copy Rules'}
                </button>
              </div>
            </div>
          </div>
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

        <div className="p-6 overflow-y-auto relative">
          {loading && (
            <div className="absolute inset-0 bg-white/80 z-[60] flex flex-col items-center justify-center text-center p-6 backdrop-blur-[2px]">
              <Loader2 className="w-12 h-12 animate-spin text-bbc-red mb-4" />
              <h3 className="text-xl font-bold text-bbc-dark uppercase tracking-widest">
                {uploading ? 'Uploading Media...' : 'Publishing to Feed...'}
              </h3>
              <p className="text-xs text-gray-500 mt-2 font-mono">Connecting to global-lens-db...</p>
            </div>
          )}

          {success && (
            <div className="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Published Successfully!</h3>
              <p className="text-gray-500">Your content is now live on the global feed.</p>
            </div>
          )}

          <div className="mb-6 flex items-center gap-4 p-3 bg-gray-50 rounded border border-gray-100">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <Database className="w-3 h-3" /> Database Status:
            </div>
            <div className="flex gap-3">
              <span className="text-[10px] font-mono text-bbc-red bg-red-50 px-2 py-0.5 rounded">
                Articles: {stats.articles}
              </span>
              <span className="text-[10px] font-mono text-bbc-dark bg-gray-200 px-2 py-0.5 rounded">
                Updates: {stats.updates}
              </span>
            </div>
          </div>

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
                    <label className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
                      <ImageIcon className="w-3 h-3" /> Direct Gallery Upload
                    </label>
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
                          {preview.status === 'error' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                              <AlertCircle className="w-6 h-6 text-red-600" />
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
                      <label className="w-20 h-20 border-2 border-dashed border-gray-200 rounded flex flex-col items-center justify-center hover:border-bbc-red transition-colors cursor-pointer bg-white">
                        <ImageIcon className="w-6 h-6 text-gray-300" />
                        <span className="text-[8px] font-bold uppercase text-gray-400 mt-1">Upload</span>
                        <input 
                          type="file"
                          className="hidden"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            files.forEach(file => handleFileUpload(file, 'image', 'article'));
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
                      <VideoIcon className="w-3 h-3" /> Video Upload
                    </label>
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
                          {preview.status === 'error' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                              <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                          )}
                          <button 
                            type="button"
                            onClick={() => removeFile(preview.remoteUrl || preview.localUrl, 'video', 'article')}
                            className="absolute -top-2 -right-2 bg-bbc-red text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <label className="w-20 h-20 border-2 border-dashed border-gray-200 rounded flex flex-col items-center justify-center hover:border-bbc-red transition-colors cursor-pointer bg-white">
                        <VideoIcon className="w-6 h-6 text-gray-300" />
                        <span className="text-[8px] font-bold uppercase text-gray-400 mt-1">Upload</span>
                        <input 
                          type="file"
                          className="hidden"
                          accept="video/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            files.forEach(file => handleFileUpload(file, 'video', 'article'));
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
                  <label className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2">
                    <Zap className="w-3 h-3 text-bbc-red" /> Alternative: Add by URL
                  </label>
                  <div className="flex gap-2">
                    <select 
                      value={urlType}
                      onChange={e => setUrlType(e.target.value as 'image' | 'video')}
                      className="p-2 text-xs border border-gray-200 rounded bg-white outline-none"
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                    <input 
                      placeholder="Paste image or video link here..."
                      className="flex-1 p-2 text-xs border border-gray-200 rounded outline-none focus:ring-1 focus:ring-bbc-red"
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => handleAddByUrl('article')}
                      className="bg-bbc-dark text-white px-4 py-2 text-xs font-bold rounded hover:bg-black transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={article.isBreaking}
                  onChange={e => setArticle({...article, isBreaking: e.target.checked})}
                  className="w-4 h-4 accent-bbc-red"
                />
                <span className="text-sm font-bold uppercase text-bbc-red">Mark as Breaking News</span>
              </label>
              <div className="flex gap-4">
                {editingId && (
                  <button 
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex-1 bg-gray-100 text-gray-600 py-4 font-bold uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete
                  </button>
                )}
                <button 
                  disabled={loading}
                  className="flex-[2] bg-bbc-red text-white py-4 font-bold uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {uploading ? 'Uploading Media...' : 'Sending to Reader Feed...'}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {editingId ? 'Save Changes' : 'Publish Article'}
                    </>
                  )}
                </button>
              </div>
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
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
                <label className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2">
                  <Zap className="w-3 h-3 text-bbc-red" /> Add Media by URL
                </label>
                <div className="flex gap-2">
                  <select 
                    value={urlType}
                    onChange={e => setUrlType(e.target.value as 'image' | 'video')}
                    className="p-2 text-xs border border-gray-200 rounded bg-white outline-none"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                  <input 
                    placeholder="Paste link here..."
                    className="flex-1 p-2 text-xs border border-gray-200 rounded outline-none focus:ring-1 focus:ring-bbc-red"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => handleAddByUrl('update')}
                    className="bg-bbc-dark text-white px-4 py-2 text-xs font-bold rounded hover:bg-black transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

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
                        <>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin text-bbc-red" />
                          </div>
                        </>
                      )}
                      {preview.status === 'error' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                          <AlertCircle className="w-5 h-5 text-red-600" />
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
                  <label className="w-16 h-16 border-2 border-dashed border-gray-200 rounded flex items-center justify-center hover:border-bbc-red transition-colors cursor-pointer">
                    <ImageIcon className="w-5 h-5 text-gray-300" />
                    <input 
                      type="file"
                      className="hidden"
                      accept="image/*,video/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach(file => {
                          const type = file.type.startsWith('image/') ? 'image' : 'video';
                          handleFileUpload(file, type, 'update');
                        });
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={update.isBreaking}
                  onChange={e => setUpdate({...update, isBreaking: e.target.checked})}
                  className="w-4 h-4 accent-bbc-red"
                />
                <span className="text-sm font-bold uppercase text-bbc-red">Major Breaking Update</span>
              </label>
              <div className="flex gap-4">
                {editingId && (
                  <button 
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex-1 bg-gray-100 text-gray-600 py-4 font-bold uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete
                  </button>
                )}
                <button 
                  disabled={loading}
                  className="flex-[2] bg-bbc-dark text-white py-4 font-bold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {uploading ? 'Uploading Media...' : 'Sending to Reader Feed...'}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {editingId ? 'Save Changes' : 'Post Update'}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
