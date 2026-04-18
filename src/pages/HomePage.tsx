import { NewsFeed } from '../components';

export default function HomePage({ isAdmin, handleEdit }: { isAdmin: boolean, handleEdit: (item: any) => void }) {
  return (
    <div className="max-w-7xl mx-auto">
      <NewsFeed 
        onEdit={isAdmin ? handleEdit : undefined} 
        limitCount={6}
      />
      <div className="mt-12 pt-8 border-t border-gray-100 text-center">
        <h3 className="text-xl font-serif font-bold text-bbc-dark mb-4 italic">Expansive Intelligence Deep Dives</h3>
        <p className="text-gray-500 mb-8 max-w-lg mx-auto text-sm leading-relaxed">
          Access our full spectrum of geopolitical, economic, and diplomatic reporting by selecting a sector above.
        </p>
      </div>
    </div>
  );
}
