import { useState } from "react";
import { NavLink } from "react-router";
import {
  LayoutDashboard,
  AlertTriangle,
  FileText,
  BarChart3,
  Settings,
  Database,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Quality Event Intake", href: "/deviation", icon: AlertTriangle },
  { name: "DB Log", href: "/db-log", icon: Database },
  { name: "Audit Trail", href: "/audit-trail", icon: FileText },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{ width: collapsed ? "5rem" : "16rem", transition: "width 300ms" }}
      className="bg-gray-900 dark:bg-gray-950 text-white flex flex-col shrink-0 overflow-hidden"
    >
      {/* Header / toggle */}
      <div
        style={{ height: "4rem" }}
        className={`border-b border-gray-800 flex items-center ${
          collapsed ? "justify-center" : "px-4"
        }`}
      >
        <div
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="h-8 w-8 bg-blue-500 rounded flex items-center justify-center shrink-0">
            <span className="font-bold text-white">D</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm whitespace-nowrap">
              Deviation & Change Control
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                end={item.href === "/"}
                title={collapsed ? item.name : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-lg transition-colors ${
                    collapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-2.5"
                  } ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <span className="whitespace-nowrap">{item.name}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}