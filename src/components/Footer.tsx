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
    <footer className="bg-white border-t border-gray-100 pt-12 pb-8 mt-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Logo className="scale-75 md:scale-100 origin-left" />
            </div>
            <p className="text-sm text-black font-serif leading-relaxed max-w-md font-medium">
              Global Lens is dedicated to countering disinformation and providing balanced perspectives on geopolitical events. Our mission is to bring clarity and truth to the forces shaping our world.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-1 gap-8 md:gap-0">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-bbc-dark mb-6">Information</h4>
              <ul className="space-y-3 text-xs font-bold uppercase tracking-widest text-gray-700">
                <li><Link to="/about" className="hover:text-bbc-red transition-colors">About intelligence</Link></li>
                <li><Link to="/category/all" className="hover:text-bbc-red transition-colors">Archive</Link></li>
                <li><button onClick={() => onPolicyClick('Privacy Policy', POLICIES.PRIVACY)} className="hover:text-bbc-red transition-colors">Privacy</button></li>
                <li><button onClick={() => onPolicyClick('Terms of Service', POLICIES.TERMS)} className="hover:text-bbc-red transition-colors">Terms</button></li>
                <li className="pt-2">
                  {loading ? (
                    <span className="text-gray-300 italic lowercase font-normal">loading...</span>
                  ) : user ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-gray-400 lowercase italic font-normal truncate max-w-[150px]">{user.email}</span>
                      <button onClick={logOut} className="text-gray-400 hover:text-bbc-red transition-colors lowercase italic font-normal underline text-left">Sign Out</button>
                    </div>
                  ) : (
                    <button onClick={signInPopup} className="text-gray-300 hover:text-gray-500 transition-colors lowercase italic font-normal text-left">Staff Login</button>
                  )}
                </li>
              </ul>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border border-gray-100 rounded">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-bbc-dark mb-4">Support Truth</h4>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed mb-6">
              Help us maintain independent deep reporting.
            </p>
            <button 
              onClick={copyToClipboard}
              className="w-full flex items-center justify-center gap-2 py-3 bg-bbc-dark text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-sm"
            >
              {copied ? <Check className="w-3 h-3" /> : <Heart className="w-3 h-3 fill-current" />}
              {copied ? 'Address Copied' : 'Donate BTC'}
            </button>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 text-center md:text-left">
            © 2026 Global Lens Intelligence. <br className="md:hidden" /> All Rights Reserved.
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">
            <a href="mailto:Globallens0247@gmail.com" className="hover:text-bbc-red flex items-center gap-2 group">
              <Mail className="w-4 h-4 text-gray-400 group-hover:text-bbc-red transition-colors" />
              <span className="truncate max-w-[180px] sm:max-w-none">Reach via Gmail</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
