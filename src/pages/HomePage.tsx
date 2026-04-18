import { NewsFeed, LiveUpdateFeed } from '../components';

export default function HomePage({ isAdmin, handleEdit }: { isAdmin: boolean, handleEdit: (item: any) => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      <div className="lg:col-span-8">
        <NewsFeed 
          onEdit={isAdmin ? handleEdit : undefined} 
        />
      </div>
      <aside className="lg:col-span-4 space-y-8">
        <LiveUpdateFeed onEdit={isAdmin ? handleEdit : undefined} />
      </aside>
    </div>
  );
}
