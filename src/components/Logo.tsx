import { motion } from 'motion/react';

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-16 h-16 flex items-center justify-center group"
      >
        {/* Outer Lens Barrel */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#444] to-[#111] rounded-full shadow-2xl border-[1px] border-black/50" />
        
        {/* Inner Grip/Texture Ring */}
        <div className="absolute inset-[2px] rounded-full border-[1px] border-white/10 bg-[#222]" />
        
        {/* Markings Ring */}
        <div className="absolute inset-[6px] rounded-full bg-[#1a1a1a] border-[1px] border-black flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-spin-slow opacity-80">
            <defs>
              <path id="textPath" d="M 50, 50 m -38, 0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
            </defs>
            <text className="text-[4px] font-bold fill-gray-300 tracking-[0.2em] uppercase">
              <textPath href="#textPath" startOffset="0%">
                GLOBAL LENS • GLOBAL LENS • GLOBAL LENS • GLOBAL LENS • 
              </textPath>
            </text>
          </svg>
        </div>

        {/* Inner Lens Glass Area */}
        <div className="absolute inset-[14px] rounded-full bg-black shadow-inner overflow-hidden flex items-center justify-center border-[2px] border-[#333]">
          {/* Globe Background (Silver/Gray) */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#888] via-[#ccc] to-[#444]" />
          
          {/* Globe Grid (Latitude & Longitude) */}
          <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="0.15" className="absolute inset-0 w-full h-full opacity-40 z-10">
            <circle cx="12" cy="12" r="11.5" />
            {/* Longitude lines */}
            <path d="M12 0.5v23" />
            <path d="M12 0.5a16 16 0 0 1 0 23" />
            <path d="M12 0.5a16 16 0 0 0 0 23" />
            <path d="M12 0.5a10 10 0 0 1 0 23" />
            <path d="M12 0.5a10 10 0 0 0 0 23" />
            <path d="M12 0.5a5 5 0 0 1 0 23" />
            <path d="M12 0.5a5 5 0 0 0 0 23" />
            {/* Latitude lines */}
            <path d="M0.5 12h23" />
            <path d="M1.5 8h21" />
            <path d="M1.5 16h21" />
            <path d="M4 5h16" />
            <path d="M4 19h16" />
          </svg>

          {/* Continents (More accurate representation) */}
          <svg viewBox="0 0 24 24" fill="black" className="w-full h-full relative z-0 opacity-90 scale-110">
            <path d="M3.5 6.5c.5-.5 1.5-.5 2.5 0s1.5 1 2.5 1.5 2-.5 3-.5 2 .5 3 1.5-1 2-2 3-2 1.5-3 2.5-2 .5-3-.5-2-1.5-3-2.5-1-2.5-1-3.5z" /> {/* North America */}
            <path d="M12.5 13.5c1 1 2 3 1 4.5s-2 2.5-3.5 2.5-2.5-1-2.5-2.5 1-2.5 2.5-3.5 1.5-1 2.5-1z" /> {/* South America */}
            <path d="M11 3.5c2.5 0 5 1.5 6.5 3s1.5 2.5 2.5 4-1 2.5-2.5 4-2.5 0-4-1.5-2.5-2.5-2.5-4 0-5.5 0-5.5z" /> {/* Eurasia */}
            <path d="M13 9.5c1 1 2 2.5 1.5 4s-2.5 2.5-4 2.5-2.5-1.5-2.5-2.5 1.5-2.5 2.5-4 1.5-1 2.5-1z" /> {/* Africa */}
            <path d="M18 14c.5.5 1 1.5.5 2s-1.5 1-2 1-.5-1-.5-1.5 1-1.5 2-1.5z" /> {/* Australia */}
          </svg>

          {/* Glass Reflection/Sheen */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30 z-20 pointer-events-none" />
          <div className="absolute top-1 left-2 w-4 h-2 bg-white/20 rounded-full blur-[2px] rotate-[-30deg] z-30" />
        </div>
      </motion.div>
      
      <div className="flex flex-col leading-none">
        <span className="text-xl md:text-2xl font-black tracking-tighter uppercase font-sans text-bbc-dark">Global</span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] md:text-sm font-bold tracking-[0.3em] uppercase font-sans text-bbc-red">Lens</span>
          <div className="h-[2px] flex-1 bg-bbc-red/30" />
        </div>
      </div>
    </div>
  );
}
