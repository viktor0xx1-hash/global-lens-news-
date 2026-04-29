import { useEffect } from 'react';
import { NewsFeed, SupportCard, NewsReel } from '../components';
import { updateMeta } from '../lib/utils';

export default function HomePage({ isAdmin, handleEdit }: { isAdmin: boolean, handleEdit: (item: any) => void }) {
  useEffect(() => {
    updateMeta(
      'Global Lens | Elite Intelligence & Geopolitical Reporting',
      'Global Lens provides deep-dive intelligence reports, breaking geopolitical news, and strategic analysis from around the globe.',
      '/'
    );
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <NewsFeed 
        onEdit={isAdmin ? handleEdit : undefined} 
        limitCount={6}
      />

      <NewsReel />
      
      <div className="mt-16 pt-16 border-t border-gray-100">
        <SupportCard variant="footer" />
        
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-serif font-bold text-bbc-dark mb-4 italic">Expansive Intelligence Deep Dives</h2>
          <p className="text-gray-500 mb-16 max-w-lg mx-auto text-sm leading-relaxed uppercase tracking-widest font-bold opacity-80">
            Access our full spectrum of geopolitical, economic, and diplomatic reporting by selecting a sector above.
          </p>
        </div>
      </div>
    </div>
  );
}
