import { NavLink } from 'react-router';
import {
  LayoutDashboard,
  AlertTriangle,
  GitBranch,
  FileText,
  BarChart3,
  Settings,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Quality Event Intake', href: '/deviation', icon: AlertTriangle },
  { name: 'Audit Trail', href: '/audit-trail', icon: FileText },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-blue-500 rounded flex items-center justify-center">
            <span className="font-bold">D</span>
          </div>
          <span className="font-semibold text-lg">Deviation & Change Control</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-400">
          <div>Version 2.4.1</div>
          <div className="mt-1">© 2026 Deviation & Change Control</div>
        </div>
      </div>
    </aside>
  );
}
