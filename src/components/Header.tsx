import { useState, useEffect } from 'react';
import { auth, signIn, signInPopup, logOut, db } from '../firebase';
import { onAuthStateChanged, User, getRedirectResult } from 'firebase/auth';
import Logo from './Logo';
import { LayoutDashboard, Globe, TrendingUp, ShieldAlert, Search, Bookmark, LogOut, Info } from 'lucide-react';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { motion, AnimatePresence } from 'motion/react';
import { formatTime, slugify } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';

export default function Header({ onAdminClick, onBookmarksClick, onSearchClick }: { 
  onAdminClick: () => void, 
  onBookmarksClick: () => void,
  onSearchClick: () => void 
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for redirect result
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        console.log("Successfully signed in via redirect:", result.user.email);
      }
    }).catch((error) => {
      console.error("Auth redirect error:", error);
      // If redirect fails, we might want to alert the user or log it
      if (error.code === 'auth/redirect-uri-mismatch') {
        alert("Security Error: The redirect URL is not authorized. Please check Google Cloud settings.");
      }
    });

    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const adminEmails = ["viktor0xx1@gmail.com"];
  const isAdmin = user?.email && adminEmails.includes(user.email.toLowerCase());

  return (
    <header className="border-b border-gray-200 sticky top-0 bg-white z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          <div className="flex items-center gap-8">
            <Link to="/">
              <Logo />
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
              <Link to="/category/geopolitics" className="hover:text-bbc-red transition-colors flex items-center gap-1.5 py-2 border-b-2 border-transparent hover:border-bbc-red">
                World News/ Geopolitics
              </Link>
              <Link to="/category/economy" className="hover:text-bbc-red transition-colors flex items-center gap-1.5 py-2 border-b-2 border-transparent hover:border-bbc-red">
                Economy
              </Link>
              <Link to="/category/diplomacy" className="hover:text-bbc-red transition-colors flex items-center gap-1.5 py-2 border-b-2 border-transparent hover:border-bbc-red">
                Diplomacy
              </Link>
              <Link to="/category/africa" className="hover:text-bbc-red transition-colors flex items-center gap-1.5 py-2 border-b-2 border-transparent hover:border-bbc-red">
                Africa
              </Link>
              <Link to="/about" className="hover:text-bbc-red transition-colors flex items-center gap-1.5 py-2 border-b-2 border-transparent hover:border-bbc-red">
                About
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Trigger */}
            <button 
              onClick={onSearchClick}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
              title="Search Intelligence"
            >
              <Search className="w-5 h-5 text-gray-600 group-hover:text-bbc-red transition-colors" />
            </button>

            {/* Bookmarks Link */}
            <button 
              onClick={onBookmarksClick}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Bookmark className="w-5 h-5 text-gray-600" />
            </button>

            {loading ? (
              <div className="w-5 h-5 border-2 border-bbc-red border-t-transparent rounded-full animate-spin" />
            ) : user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <button 
                    onClick={onAdminClick}
                    className="flex items-center gap-2 px-3 py-1.5 bg-bbc-dark text-white text-[10px] font-bold uppercase tracking-widest rounded hover:bg-black transition-all"
                  >
                    <LayoutDashboard className="w-3 h-3" /> Dashboard
                  </button>
                )}
                <button 
                  onClick={logOut}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-bbc-red transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation - Two Row Layout */}
      <div className="md:hidden border-t border-gray-100 px-4 py-4 bg-white/95 backdrop-blur-sm">
        <nav className="flex flex-col gap-4">
          {/* Top Row: Primary Category */}
          <div className="flex justify-center">
            <Link 
              to="/category/geopolitics" 
              className="text-bbc-red text-[11px] font-black uppercase tracking-[0.3em] border-b-2 border-bbc-red pb-1"
            >
              World News / Geopolitics
            </Link>
          </div>
          {/* Bottom Row: Secondary Categories */}
          <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-gray-500 px-1">
            <Link to="/category/economy" className="hover:text-bbc-red transition-colors">Economy</Link>
            <Link to="/category/diplomacy" className="hover:text-bbc-red transition-colors">Diplomacy</Link>
            <Link to="/category/africa" className="hover:text-bbc-red transition-colors">Africa</Link>
            <Link to="/about" className="hover:text-bbc-red transition-colors flex items-center gap-1">
              About
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
