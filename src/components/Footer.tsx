import { POLICIES, DONATION_CONFIG } from '../constants';
import Logo from './Logo';
import { auth, signIn, signInPopup, logOut } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { Heart, Copy, Check, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer({ onPolicyClick, onAdminClick }: { onPolicyClick: (title: string, content: string) => void, onAdminClick: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8 mt-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-8">
              <Logo className="scale-75 md:scale-100 origin-left" />
            </div>
            <p className="text-base text-black font-serif leading-relaxed max-w-2xl font-medium">
              Global Lens is dedicated to countering disinformation and providing balanced perspectives on geopolitical events. Our mission is to bring clarity and truth to the forces shaping our world through independent, high-stakes reporting.
            </p>
          </div>
          
          <div className="flex flex-col md:items-end">
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-8">Information Menu</h2>
              <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-bbc-dark">
                <li><Link to="/about" className="hover:text-bbc-red transition-all hover:pl-2">About intelligence</Link></li>
                <li><Link to="/category/all" className="hover:text-bbc-red transition-all hover:pl-2">The Archive</Link></li>
                <li><button onClick={() => onPolicyClick('Privacy Policy', POLICIES.PRIVACY)} className="hover:text-bbc-red transition-all hover:pl-2">Privacy Policy</button></li>
                <li><button onClick={() => onPolicyClick('Terms of Service', POLICIES.TERMS)} className="hover:text-bbc-red transition-all hover:pl-2">Terms of Use</button></li>
                <li className="pt-4 border-t border-gray-50">
                  {loading ? (
                    <span className="text-gray-300 italic lowercase font-normal">authenticating...</span>
                  ) : user ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-gray-300 lowercase italic font-normal truncate max-w-[150px]">{user.email}</span>
                      <div className="flex gap-3">
                        {isAdmin && (
                          <button onClick={onAdminClick} className="text-bbc-dark hover:text-bbc-red transition-colors lowercase italic font-bold underline text-left">Dashboard</button>
                        )}
                        <button onClick={logOut} className="text-gray-400 hover:text-bbc-red transition-colors lowercase italic font-normal underline text-left">Sign Out</button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        signInPopup().then(() => {
                          // Note: the auth observer in App.tsx will handle the state update
                          // but the user might expect the modal to open immediately
                          onAdminClick();
                        });
                      }} 
                      className="text-gray-300 hover:text-gray-500 transition-colors lowercase italic font-normal text-left"
                    >
                      Staff Login
                    </button>
                  )}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 text-center md:text-left">
            © 2026 Global Lens Intelligence. <br className="md:hidden" /> All Rights Reserved.
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">
            <a href="mailto:Globallens0247@gmail.com" className="hover:text-bbc-red flex items-center gap-2 group" aria-label="Send an email to Global Lens Intelligence">
              <Mail className="w-4 h-4 text-gray-400 group-hover:text-bbc-red transition-colors" />
              <span className="truncate max-w-[180px] sm:max-w-none">Reach via Gmail</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
