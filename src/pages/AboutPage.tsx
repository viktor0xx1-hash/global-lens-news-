import { motion } from 'motion/react';
import { Globe, Shield, Zap, Target, BookOpen, Users } from 'lucide-react';
import { NewsReel, SupportCard } from '../components';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="inline-block px-3 py-1 bg-bbc-red text-white text-[10px] font-bold uppercase tracking-widest mb-4">
          The Mission
        </div>
        <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 text-bbc-dark">
          Intelligence for a <span className="text-bbc-red italic">Borderless</span> World
        </h1>
        <p className="text-xl text-gray-600 font-serif max-w-2xl mx-auto leading-relaxed">
          Access geopolitical intelligence and Africa updates, 
          bridging the gap between raw data and informed decision making.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
        {[
          {
            icon: <Globe className="w-8 h-8 text-bbc-red" />,
            title: "Global Reach",
            desc: "Monitoring events from the corridors of power to emerging markets."
          },
          {
            icon: <Shield className="w-8 h-8 text-bbc-red" />,
            title: "Verified Sources",
            desc: "Prioritizing ground-truth reports and verified intelligence."
          },
          {
            icon: <Target className="w-8 h-8 text-bbc-red" />,
            title: "Focused Analysis",
            desc: "Coverage on World News, Geopolitics, Africa, and Global Economics."
          },
          {
            icon: <Zap className="w-8 h-8 text-bbc-red" />,
            title: "Real-time Flow",
            desc: "Live updates that keep you ahead of the narrative curves."
          }
        ].map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex gap-6 p-6 bg-gray-50 border border-gray-100 rounded shadow-sm"
          >
            <div className="flex-shrink-0">{item.icon}</div>
            <div>
              <h3 className="font-serif font-bold text-xl mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="space-y-12">
        <section className="prose prose-red max-w-none">
          <h2 className="font-serif font-bold text-3xl mb-6">Our DNA</h2>
          <p className="text-gray-700 leading-relaxed font-serif text-lg italic border-l-4 border-bbc-red pl-6 py-2">
            "Clarity is the new currency. The most important 
            stories are often the ones happening just below the surface."
          </p>
          <div className="h-0.5 w-24 bg-bbc-red my-12" />
          <div className="space-y-6 text-gray-700 leading-relaxed text-lg">
            <p>
              <strong>Global Lens News</strong> is a comprehensive digital 
              platform highlighting the critical intersections of economy, 
              war, and diplomacy on a global scale.
            </p>
            <p>
              We provide a specialized voice for <strong>Africa Updates</strong> 
              and <strong>Geopolitical World Events</strong>, delivering 
              ground-truth reports from emerging markets to established powers.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 py-16 border-t border-gray-100">
          <div className="text-center">
            <div className="text-4xl font-bold font-serif text-bbc-red mb-1">24/7</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Monitoring</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold font-serif text-bbc-red mb-1">100%</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Independent</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold font-serif text-bbc-red mb-1">5+</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Key Geozones</div>
          </div>
        </section>
      </div>

      <div className="mt-20 -mx-4 md:-mx-12">
        <NewsReel />
      </div>

      <div className="mt-12">
        <SupportCard variant="footer" />
      </div>
    </div>
  );
}
