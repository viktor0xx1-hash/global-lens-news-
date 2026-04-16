import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, limit, updateDoc, increment } from 'firebase/firestore';
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
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Auth listener
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
    });
  }, []);

  // Load bookmarks
  useEffect(() => {
    if (userId) {
      const unsub = onSnapshot(doc(db, 'users', userId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBookmarks(data.bookmarks || []);
        }
      });
      return () => unsub();
    } else {
      const localBookmarks = localStorage.getItem('bookmarks');
      if (localBookmarks) setBookmarks(JSON.parse(localBookmarks));
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
