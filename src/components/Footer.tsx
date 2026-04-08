import { POLICIES, DONATION_CONFIG } from '../constants';
import Logo from './Logo';
import { auth, signIn, logOut } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { Heart, Copy, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Footer({ onPolicyClick, onAdminClick }: { onPolicyClick: (title: string, content: string) => void, onAdminClick: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const adminEmails = ["viktor0xx1@gmail.com"];
  const isAdmin = user?.email && adminEmails.includes(user.email.toLowerCase());

  const copyToClipboard = () => {
    navigator.clipboard.writeText(DONATION_CONFIG.BTC_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showDebugInfo = () => {
    const info = {
      isLoggedIn: !!user,
      email: user?.email || 'none',
      isAdmin: isAdmin,
      authReady: !loading
    };
    alert(`DEBUG AUTH:\nLogged In: ${info.isLoggedIn}\nEmail: ${info.email}\nIs Admin: ${info.isAdmin}\nReady: ${info.authReady}`);
  };

  return (
    <footer className="bg-white border-t border-gray-100 pt-12 pb-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Logo />
            </div>
            <p className="text-sm text-black font-serif leading-relaxed max-w-md font-medium">
              {t('Global Lens is dedicated to countering disinformation and providing balanced perspectives on spiraling events across the globe. Our mission is to bring clarity and truth to the forces shaping our world.')}
            </p>
          </div>
          
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-bbc-dark mb-6">{t('Legal')}</h4>
            <ul className="space-y-3 text-xs font-bold uppercase tracking-widest text-gray-700">
              <li><button onClick={() => onPolicyClick('About Us', POLICIES.ABOUT)} className="hover:text-bbc-red transition-colors">{t('About Us')}</button></li>
              <li><button onClick={() => onPolicyClick('Privacy Policy', POLICIES.PRIVACY)} className="hover:text-bbc-red transition-colors">{t('Privacy Policy')}</button></li>
              <li><button onClick={() => onPolicyClick('Terms of Service', POLICIES.TERMS)} className="hover:text-bbc-red transition-colors">{t('Terms of Service')}</button></li>
              <li><button onClick={() => onPolicyClick('DMCA Policy', POLICIES.DMCA)} className="hover:text-bbc-red transition-colors">{t('DMCA')}</button></li>
              <li><button onClick={() => onPolicyClick('Cookie Policy', POLICIES.COOKIES)} className="hover:text-bbc-red transition-colors">{t('Cookies')}</button></li>
              <li className="pt-2 border-t border-gray-50">
                {loading ? (
                  <span className="text-gray-300 italic lowercase font-normal">{t('loading...')}</span>
                ) : user ? (
                  <div className="flex flex-col gap-2">
                    {isAdmin && (
                      <button onClick={onAdminClick} className="text-bbc-red hover:underline text-left font-bold">{t('Admin Dashboard')}</button>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 lowercase italic font-normal">{user.email}</span>
                      <button onClick={logOut} className="text-gray-400 hover:text-bbc-red transition-colors lowercase italic font-normal underline">{t('Sign Out')}</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={signIn} className="text-gray-400 hover:text-bbc-red transition-colors lowercase italic font-normal">{t('Staff')}</button>
                )}
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-bbc-dark mb-6">{t('Support Us')}</h4>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed mb-4">
              {t('Help us maintain our independent reporting.')}
            </p>
            <button 
              onClick={copyToClipboard}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-bbc-red hover:text-red-700 transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Heart className="w-3 h-3 fill-current" />}
              {copied ? t('Address Copied') : t('Donate BTC')}
            </button>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">
            © 2026 Global Lens. {t('All Rights Reserved.')}
          </div>
          <div className="flex gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">
            <a href="mailto:Globallens0247@gmail.com" className="hover:text-bbc-red flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M24 4.5v15c0 .85-.65 1.5-1.5 1.5H21V7.38l-9 5.65-9-5.65V21H2.5c-.85 0-1.5-.65-1.5-1.5v-15c0-.4.15-.75.45-1.05.3-.3.65-.45 1.05-.45H5l7 4.5 7-4.5h2.5c.4 0 .75.15 1.05.45.3.3.45.65.45 1.05z"/>
              </svg>
              {t('Gmail')}
            </a>
            <button onClick={showDebugInfo} className="text-gray-300 hover:text-gray-500 transition-colors">
              [debug auth]
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
