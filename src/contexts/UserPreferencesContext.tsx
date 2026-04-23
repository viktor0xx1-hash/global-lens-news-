import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, limit, updateDoc, increment } from 'firebase/firestore';
import { toDate } from '../lib/utils';

interface UserPreferencesContextType {
  bookmarks: string[];
  toggleBookmark: (articleId: string) => void;
  isBookmarked: (articleId: string) => boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
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

  return (
    <UserPreferencesContext.Provider value={{ 
      bookmarks, 
      toggleBookmark, 
      isBookmarked
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
