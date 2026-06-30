import { Outlet } from 'react-router';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="h-screen flex overflow-hidden bg-muted/30">
      {/* Sidebar — outside the scroll container entirely, so it never scrolls */}
      <Sidebar />

      {/* Single scroll container for everything else: header + page content
          scroll together as one unit. Header uses `sticky top-0` (set in
          Header.tsx) so it still visually stays pinned to the top while
          this container scrolls. */}
      <div className="flex-1 overflow-y-auto">
        <Header />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}