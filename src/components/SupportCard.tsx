import { useState } from 'react';
import { Copy, Check, Heart } from 'lucide-react';
import { DONATION_CONFIG } from '../constants';

export default function SupportCard({ variant = 'sidebar' }: { variant?: 'sidebar' | 'article' | 'footer' }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(DONATION_CONFIG.BTC_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (variant === 'footer') {
    return (
      <div className="p-8 bg-gray-50 border border-gray-100 rounded-xl max-w-2xl mx-auto shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-bbc-dark mb-4">Support Truth</h4>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
              Help us maintain independent deep reporting and countering disinformation worldwide.
            </p>
          </div>
          <div className="w-full md:w-auto shrink-0">
            <button 
              onClick={copyToClipboard}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-bbc-dark text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95"
            >
              {copied ? <Check className="w-4 h-4" /> : <Heart className="w-4 h-4 fill-current" />}
              {copied ? 'Address Copied' : 'Donate BTC'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'article') {
    return (
      <div className="my-12 p-8 bg-gray-50 border-l-4 border-bbc-red">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-white rounded-full shadow-sm">
            <Heart className="w-5 h-5 text-bbc-red fill-current" />
          </div>
          <div>
            <h4 className="text-lg font-serif font-bold text-bbc-dark mb-2 italic">Support Independent Truth</h4>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              {DONATION_CONFIG.MESSAGE}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full bg-white border border-gray-200 px-4 py-3 rounded font-mono text-[10px] sm:text-xs text-gray-500 break-all flex items-center justify-between gap-2">
                {DONATION_CONFIG.BTC_ADDRESS}
              </div>
              <button 
                onClick={copyToClipboard}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-bbc-dark text-white text-xs font-bold uppercase tracking-widest hover:bg-black transition-all whitespace-nowrap"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy BTC Address'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4 text-bbc-red">
        <Heart className="w-4 h-4 fill-current" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Support Global Lens</span>
      </div>
      <h4 className="text-xl font-serif font-bold mb-3 italic leading-tight text-bbc-dark">Help us sustain our mission</h4>
      <p className="text-xs text-gray-500 leading-relaxed mb-6">
        {DONATION_CONFIG.MESSAGE}
      </p>
      
      <div className="space-y-3">
        <div className="bg-gray-50 p-3 rounded font-mono text-[10px] text-gray-400 break-all border border-gray-100">
          {DONATION_CONFIG.BTC_ADDRESS}
        </div>
        <button 
          onClick={copyToClipboard}
          className="w-full flex items-center justify-center gap-2 py-3 bg-bbc-dark text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy BTC Address'}
        </button>
      </div>
    </div>
  );
}
