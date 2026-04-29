import { collection, query, orderBy, limit, onSnapshot, where, getDocs, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// Simple in-memory cache
const cache: Record<string, { data: any[], lastDoc: any, timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export const getCachedArticles = (key: string) => {
  const cached = cache[key];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached;
  }
  return null;
};

export const setCachedArticles = (key: string, data: any[], lastDoc: any) => {
  cache[key] = { data, lastDoc, timestamp: Date.now() };
};

export const clearCache = (key?: string) => {
  if (key) {
    delete cache[key];
  } else {
    Object.keys(cache).forEach(k => delete cache[k]);
  }
};
