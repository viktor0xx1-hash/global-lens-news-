import { useState, useRef, useEffect } from 'react';
import { db, storage, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, limit, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { X, Send, FileText, Zap, ShieldAlert, Image as ImageIcon, Video as VideoIcon, Loader2, AlertCircle, CheckCircle2, User as UserIcon, Database, Edit3, Trash2, Settings, List } from 'lucide-react';

export default function AdminDashboard({ onClose, editItem }: { onClose: () => void, editItem?: any }) {
  const [activeTab, setActiveTab] = useState<'article' | 'update' | 'manage' | 'settings'>('article');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [version] = useState('v3.0-CLOUDINARY-STORAGE'); 
  const [editingId, setEditingId] = useState<string | null>(null);
  const [user, setUser] = useState(auth.currentUser);
  const [articlesList, setArticlesList] = useState<any[]>([]);
  const [updatesList, setUpdatesList] = useState<any[]>([]);
  
  // Cloudinary Settings
  const [cloudName, setCloudName] = useState(localStorage.getItem('cloudinary_name') || '');
  const [uploadPreset, setUploadPreset] = useState(localStorage.getItem('cloudinary_preset') || '');
  const [showSettings, setShowSettings] = useState(!localStorage.getItem('cloudinary_name'));

  const saveSettings = () => {
    localStorage.setItem('cloudinary_name', cloudName);
    localStorage.setItem('cloudinary_preset', uploadPreset);
    setShowSettings(false);
    alert("Storage settings saved! You can now use the Gallery Upload.");
  };
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
      setUpdatesList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, err => {
      console.error("[Admin] Updates stats error:", err);
    });

    // Also fetch articles for the manage tab
    const unsubArticlesList = onSnapshot(collection(db, 'articles'), snap => {
      setArticlesList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      unsubArticles();
      unsubUpdates();
      unsubArticlesList();
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
          category: editItem.category || 'World News/Geopolitics',
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
  const handleDeleteDoc = async (id: string, type: 'articles' | 'live-updates') => {
    if (!window.confirm(`Are you sure you want to delete this ${type === 'articles' ? 'article' : 'update'}? This action cannot be undone.`)) return;
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, type, id));
      alert("Successfully deleted.");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab: typeof activeTab) => {
    if (editingId && tab !== activeTab) {
      if (window.confirm("Switching tabs will discard your current edits. Continue?")) {
        setEditingId(null);
        setArticle({
          title: '',
          summary: '',
          content: '',
          author: '',
          category: 'World News/Geopolitics',
          imageUrls: [],
          videoUrls: [],
          isBreaking: false
        });
        setUpdate({
          title: '',
          summary: '',
          content: '',
          isBreaking: false,
          imageUrls: [],
          videoUrls: []
        });
        setPreviews([]);
        setActiveTab(tab);
      }
    } else {
      setActiveTab(tab);
    }
  };
  const [article, setArticle] = useState({
    title: '',
    summary: '',
    content: '',
    author: '',
    category: 'World News/Geopolitics',
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
    if (!cloudName || !uploadPreset) {
      alert("Please configure your Cloudinary settings first! Click the Settings icon at the top.");
      setActiveTab('settings');
      return;
    }

    const id = Math.random().toString(36).substring(7);
    const localUrl = URL.createObjectURL(file);

    setPreviews(prev => [...prev, { id, localUrl, type, progress: 0, status: 'uploading' }]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error("Cloudinary upload failed");
      
      const data = await response.json();
      const url = data.secure_url;
      
      if (target === 'article') {
        if (type === 'image') setArticle(prev => ({ ...prev, imageUrls: [...prev.imageUrls, url] }));
        else setArticle(prev => ({ ...prev, videoUrls: [...prev.videoUrls, url] }));
      } else {
        if (type === 'image') setUpdate(prev => ({ ...prev, imageUrls: [...prev.imageUrls, url] }));
        else setUpdate(prev => ({ ...prev, videoUrls: [...prev.videoUrls, url] }));
      }

      setPreviews(prev => prev.map(p => p.id === id ? { ...p, status: 'done', remoteUrl: url, progress: 100 } : p));
    } catch (error: any) {
      console.error("Cloudinary upload failed:", error);
      alert(`Upload failed: ${error.message}. Check your Cloud Name and Preset.`);
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
          category: 'World News/Geopolitics',
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
        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-bbc-dark text-white gap-4">
          <div className="flex flex-col min-w-0 w-full">
            <h2 className="text-lg md:text-xl font-bold uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-bbc-red" /> {editingId ? 'Edit Content' : 'Editor Control'}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 opacity-80">
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-[9px] text-gray-300 font-mono truncate max-w-[120px]">
                  {user ? user.email : 'OFFLINE'}
                </span>
              </div>
              <div className="hidden md:block w-px h-3 bg-gray-700" />
              <div className="flex items-center gap-1.5">
                <Database className={`w-3 h-3 ${dbStatus === 'connected' ? 'text-green-500' : 'text-gray-500'}`} />
                <span className="text-[9px] font-mono uppercase tracking-wider">
                  {dbStatus === 'connected' ? 'DB Active' : 'Checking...'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex gap-2">
              <button onClick={() => copyToClipboard(`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    function isAdmin() { return request.auth != null && (request.auth.token.email.matches("(?i)viktor0xx1@gmail\\\\.com") || request.auth.uid == "${user?.uid}"); }\n    match /{collection=**} { allow read: if true; allow write: if isAdmin(); }\n  }\n}`, 'rules')} className="text-[9px] px-2 py-1 bg-bbc-red/20 text-bbc-red border border-bbc-red/30 rounded uppercase font-bold">
                {copyStatus === 'rules' ? 'Rules Copied' : 'Rules'}
              </button>
            </div>
            <button onClick={onClose} className="hover:text-bbc-red transition-colors p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => switchTab('article')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${activeTab === 'article' ? 'bg-bbc-red text-white' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <FileText className="w-4 h-4" /> {editingId ? 'Edit Article' : 'New Article'}
          </button>
          <button 
            onClick={() => switchTab('update')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${activeTab === 'update' ? 'bg-bbc-dark text-white' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Zap className="w-4 h-4" /> {editingId ? 'Edit Update' : 'Live Update'}
          </button>
          <button 
            onClick={() => switchTab('manage')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${activeTab === 'manage' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <List className="w-4 h-4" /> Manage
          </button>
          <button 
            onClick={() => switchTab('settings')}
            className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${activeTab === 'settings' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 relative">
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

          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-blue-800 font-bold mb-2 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Storage Configuration
                </h3>
                <p className="text-sm text-blue-700 mb-4">
                  Since Firebase Storage requires a credit card, we use <strong>Cloudinary</strong> for free permanent storage.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-blue-600 mb-1">Cloud Name</label>
                    <input 
                      value={cloudName}
                      onChange={e => setCloudName(e.target.value)}
                      placeholder="e.g. dxy123abc"
                      className="w-full p-2 border border-blue-200 rounded outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-blue-600 mb-1">Unsigned Upload Preset</label>
                    <input 
                      value={uploadPreset}
                      onChange={e => setUploadPreset(e.target.value)}
                      placeholder="e.g. ml_default"
                      className="w-full p-2 border border-blue-200 rounded outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <button 
                    onClick={saveSettings}
                    className="w-full bg-blue-600 text-white py-2 rounded font-bold uppercase tracking-widest text-xs hover:bg-blue-700 transition-colors"
                  >
                    Save Storage Settings
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500 space-y-2">
                <p className="font-bold">How to get these for free:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Create a free account at <strong>Cloudinary.com</strong></li>
                  <li>Copy your <strong>Cloud Name</strong> from the dashboard</li>
                  <li>Go to Settings &gt; Upload &gt; Add Upload Preset</li>
                  <li>Set "Signing Mode" to <strong>Unsigned</strong> and copy the preset name</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 border-b pb-2">Recent Articles</h3>
                {articlesList.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No articles found.</p>
                ) : (
                  <div className="space-y-2">
                    {articlesList.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100 hover:bg-white transition-colors group">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate">{item.title}</h4>
                          <div className="flex items-center gap-3">
                            <p className="text-[10px] text-gray-400 uppercase">{item.category} • {new Date(item.publishedAt?.seconds * 1000).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingId(item.id);
                              setArticle(item);
                              setPreviews((item.imageUrls || []).map((url: string) => ({ id: Math.random().toString(), localUrl: url, remoteUrl: url, type: 'image', status: 'done', progress: 100 })));
                              setActiveTab('article');
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteDoc(item.id, 'articles')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 border-b pb-2">Live Updates</h3>
                {updatesList.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No updates found.</p>
                ) : (
                  <div className="space-y-2">
                    {updatesList.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100 hover:bg-white transition-colors group">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate">{item.title || item.content.substring(0, 50)}</h4>
                          <div className="flex items-center gap-3">
                            <p className="text-[10px] text-gray-400 uppercase">{new Date(item.timestamp?.seconds * 1000).toLocaleTimeString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingId(item.id);
                              setUpdate(item);
                              setPreviews((item.imageUrls || []).map((url: string) => ({ id: Math.random().toString(), localUrl: url, remoteUrl: url, type: 'image', status: 'done', progress: 100 })));
                              setActiveTab('update');
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteDoc(item.id, 'live-updates')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {(activeTab === 'article' || activeTab === 'update') && !showSettings && (
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
          )}

          {activeTab === 'article' && !showSettings && (
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
                  <option>World News/Geopolitics</option>
                  <option>Economy</option>
                  <option>Diplomacy</option>
                  <option>Africa</option>
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
          )}

          {activeTab === 'update' && !showSettings && (
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
