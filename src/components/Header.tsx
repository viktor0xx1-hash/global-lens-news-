import { useState, useEffect } from 'react';
import { auth, signIn, signInPopup, logOut } from '../firebase';
import { onAuthStateChanged, User, getRedirectResult } from 'firebase/auth';
import Logo from './Logo';
import { LayoutDashboard, Globe, TrendingUp, ShieldAlert, Bell, Bookmark, LogOut } from 'lucide-react';
import { useLanguage, languages } from '../contexts/LanguageContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Header({ onAdminClick, onBookmarksClick }: { onAdminClick: () => void, onBookmarksClick: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const { currentLanguage, setLanguage, t } = useLanguage();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useUserPreferences();

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
      console.log("Auth state changed:", u ? u.email : "Logged out");
      setUser(u);
      setLoading(false);
    });
  }, []);

  const adminEmails = ["viktor0xx1@gmail.com"];
  const isAdmin = user?.email && adminEmails.includes(user.email.toLowerCase());

  return (
    <header className="border-b border-gray-200 sticky top-0 bg-white z-50">
      {/* Top Language Bar */}
      <div className="bg-bbc-dark text-white py-1.5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest overflow-x-auto no-scrollbar pr-4">
            {languages.map((lang) => (
              <button 
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`transition-colors whitespace-nowrap ${currentLanguage.code === lang.code ? 'text-bbc-red' : 'hover:text-bbc-red'}`}
              >
                {lang.nativeName}
              </button>
            ))}
          </div>
          <div className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {new Date().toLocaleDateString(currentLanguage.code, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium uppercase tracking-wider text-gray-600">
              <a href="#" className="hover:text-bbc-red transition-colors flex items-center gap-1">
                <Globe className="w-4 h-4" /> {t('World')}
              </a>
              <a href="#" className="hover:text-bbc-red transition-colors flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> {t('Geopolitics')}
              </a>
              <a href="#" className="hover:text-bbc-red transition-colors flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" /> {t('Security')}
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-bbc-red text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 shadow-xl rounded-lg overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">{t('Notifications')}</h4>
                      <button 
                        onClick={markAllAsRead}
                        className="text-[10px] font-bold uppercase tracking-widest text-bbc-red hover:underline"
                      >
                        {t('Mark all as read')}
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-xs font-medium uppercase tracking-widest">
                          {t('No notifications')}
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id}
                            onClick={() => markAsRead(notif.id)}
                            className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer relative ${!notif.read ? 'bg-red-50/30' : ''}`}
                          >
                            {!notif.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-bbc-red" />}
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-bbc-red">{t(notif.title)}</span>
                              <span className="text-[8px] text-gray-400 uppercase font-bold">{new Date(notif.timestamp?.toMillis ? notif.timestamp.toMillis() : notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-xs font-medium text-gray-700 line-clamp-2">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bookmarks Link */}
            <button 
              onClick={onBookmarksClick}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Bookmark className="w-5 h-5 text-gray-600" />
            </button>

            {isAdmin && (
              <button 
                onClick={onAdminClick}
                className="flex items-center gap-2 px-4 py-2 bg-bbc-dark text-white text-sm font-medium rounded hover:bg-black transition-all"
              >
                <LayoutDashboard className="w-4 h-4" /> {t('Dashboard')}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
