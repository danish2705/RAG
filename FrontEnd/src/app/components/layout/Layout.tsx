import { Outlet } from 'react-router';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="h-screen flex overflow-hidden bg-muted/30">
      {/* Sidebar */}
      <Sidebar />

      {/* Single scroll container */}
      <div className="flex-1 overflow-y-auto">
        <Header />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}