import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, limit, updateDoc } from 'firebase/firestore';
import { toDate } from '../lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: any;
  read: boolean;
  type: 'article' | 'update';
  linkId: string;
}

interface UserPreferencesContextType {
  bookmarks: string[];
  toggleBookmark: (articleId: string) => void;
  isBookmarked: (articleId: string) => boolean;
  likes: string[];
  dislikes: string[];
  toggleLike: (articleId: string, collectionName: 'articles' | 'live-updates') => Promise<void>;
  toggleDislike: (articleId: string, collectionName: 'articles' | 'live-updates') => Promise<void>;
  getVote: (articleId: string) => 'like' | 'dislike' | null;
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [likes, setLikes] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Auth listener
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
    });
  }, []);

  // Load bookmarks and votes
  useEffect(() => {
    if (userId) {
      const unsub = onSnapshot(doc(db, 'users', userId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBookmarks(data.bookmarks || []);
          setLikes(data.likes || []);
          setDislikes(data.dislikes || []);
        }
      });
      return () => unsub();
    } else {
      const localBookmarks = localStorage.getItem('bookmarks');
      if (localBookmarks) setBookmarks(JSON.parse(localBookmarks));
      
      const localLikes = localStorage.getItem('likes');
      if (localLikes) setLikes(JSON.parse(localLikes));
      
      const localDislikes = localStorage.getItem('dislikes');
      if (localDislikes) setDislikes(JSON.parse(localDislikes));
    }
  }, [userId]);

  // Listen for new articles/updates to create local notifications
  useEffect(() => {
    // This is a simple client-side notification simulator
    // In a real app, this would be handled by Firebase Cloud Messaging or a backend
    const qArticles = query(collection(db, 'articles'), orderBy('publishedAt', 'desc'), limit(1));
    const unsubArticles = onSnapshot(qArticles, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          // Only notify if it's not the initial load (approximate check)
          const publishedAt = toDate(data.publishedAt);
          if (Date.now() - publishedAt.getTime() < 60000) {
            addNotification({
              id: change.doc.id,
              title: 'New Article',
              message: data.title,
              timestamp: data.publishedAt,
              read: false,
              type: 'article',
              linkId: change.doc.id
            });
          }
        }
      });
    });

    const qUpdates = query(collection(db, 'live-updates'), orderBy('timestamp', 'desc'), limit(1));
    const unsubUpdates = onSnapshot(qUpdates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const timestamp = toDate(data.timestamp);
          if (Date.now() - timestamp.getTime() < 60000) {
            addNotification({
              id: change.doc.id,
              title: 'Live Update',
              message: data.content,
              timestamp: data.timestamp,
              read: false,
              type: 'update',
              linkId: change.doc.id
            });
          }
        }
      });
    });

    return () => {
      unsubArticles();
      unsubUpdates();
    };
  }, []);

  const addNotification = (notif: Notification) => {
    setNotifications(prev => {
      if (prev.find(n => n.id === notif.id)) return prev;
      const newNotifs = [notif, ...prev].slice(0, 20); // Keep last 20
      localStorage.setItem('notifications', JSON.stringify(newNotifs));
      return newNotifs;
    });
  };

  // Load notifications from local storage on mount
  useEffect(() => {
    const localNotifs = localStorage.getItem('notifications');
    if (localNotifs) {
      setNotifications(JSON.parse(localNotifs));
    }
  }, []);

  const toggleBookmark = async (articleId: string) => {
    const newBookmarks = bookmarks.includes(articleId)
      ? bookmarks.filter(id => id !== articleId)
      : [...bookmarks, articleId];
    
    setBookmarks(newBookmarks);
    
    if (userId) {
      await setDoc(doc(db, 'users', userId), { bookmarks: newBookmarks }, { merge: true });
    } else {
      localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
    }
  };

  const isBookmarked = (articleId: string) => bookmarks.includes(articleId);

  const toggleLike = async (id: string, collectionName: 'articles' | 'live-updates') => {
    const isLiked = likes.includes(id);
    const isDisliked = dislikes.includes(id);
    
    let newLikes = [...likes];
    let newDislikes = [...dislikes];
    
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;
    const data = docSnap.data();
    
    const updates: any = {};
    
    if (isLiked) {
      newLikes = newLikes.filter(l => l !== id);
      updates.likes = (data.likes || 1) - 1;
    } else {
      newLikes.push(id);
      updates.likes = (data.likes || 0) + 1;
      if (isDisliked) {
        newDislikes = newDislikes.filter(d => d !== id);
        updates.dislikes = (data.dislikes || 1) - 1;
      }
    }
    
    setLikes(newLikes);
    setDislikes(newDislikes);
    
    try {
      await updateDoc(docRef, updates);
      if (userId) {
        await setDoc(doc(db, 'users', userId), { likes: newLikes, dislikes: newDislikes }, { merge: true });
      } else {
        localStorage.setItem('likes', JSON.stringify(newLikes));
        localStorage.setItem('dislikes', JSON.stringify(newDislikes));
      }
    } catch (error) {
      // Revert local state on failure
      setLikes(likes);
      setDislikes(dislikes);
      console.error("Vote failed:", error);
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${id}`);
    }
  };

  const toggleDislike = async (id: string, collectionName: 'articles' | 'live-updates') => {
    const isLiked = likes.includes(id);
    const isDisliked = dislikes.includes(id);
    
    let newLikes = [...likes];
    let newDislikes = [...dislikes];
    
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;
    const data = docSnap.data();
    
    const updates: any = {};
    
    if (isDisliked) {
      newDislikes = newDislikes.filter(d => d !== id);
      updates.dislikes = (data.dislikes || 1) - 1;
    } else {
      newDislikes.push(id);
      updates.dislikes = (data.dislikes || 0) + 1;
      if (isLiked) {
        newLikes = newLikes.filter(l => l !== id);
        updates.likes = (data.likes || 1) - 1;
      }
    }
    
    setLikes(newLikes);
    setDislikes(newDislikes);
    
    try {
      await updateDoc(docRef, updates);
      if (userId) {
        await setDoc(doc(db, 'users', userId), { likes: newLikes, dislikes: newDislikes }, { merge: true });
      } else {
        localStorage.setItem('likes', JSON.stringify(newLikes));
        localStorage.setItem('dislikes', JSON.stringify(newDislikes));
      }
    } catch (error) {
      // Revert local state on failure
      setLikes(likes);
      setDislikes(dislikes);
      console.error("Vote failed:", error);
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${id}`);
    }
  };

  const getVote = (id: string) => {
    if (likes.includes(id)) return 'like';
    if (dislikes.includes(id)) return 'dislike';
    return null;
  };

  const markAsRead = (notificationId: string) => {
    const newNotifs = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(newNotifs);
    localStorage.setItem('notifications', JSON.stringify(newNotifs));
  };

  const markAllAsRead = () => {
    const newNotifs = notifications.map(n => ({ ...n, read: true }));
    setNotifications(newNotifs);
    localStorage.setItem('notifications', JSON.stringify(newNotifs));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <UserPreferencesContext.Provider value={{ 
      bookmarks, 
      toggleBookmark, 
      isBookmarked,
      likes,
      dislikes,
      toggleLike,
      toggleDislike,
      getVote,
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
}
