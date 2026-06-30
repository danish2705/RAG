import { useState, useEffect } from "react";
import { NavLink } from "react-router";
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  FolderOpen,
  ClipboardPlus,
  ScrollText,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Quality Event Intake", href: "/deviation", icon: ClipboardPlus },
  { name: "Records", href: "/db-log", icon: FolderOpen },
  { name: "Audit Trail", href: "/audit-trail", icon: ScrollText },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

function useDarkMode() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const isDark = useDarkMode();

  // Theme tokens
  const bg        = isDark ? "#04060b" : "#ffffff";
  const border    = isDark ? "#1e293b" : "#e2e8f0";
  const textMain  = isDark ? "#e2e8f0" : "#1e293b";
  const textMuted = isDark ? "#94a3b8" : "#475569";
  const hoverBg   = isDark ? "#1e293b" : "#eff6ff";
  const hoverText = isDark ? "#e2e8f0" : "#2563eb";

  return (
    <aside
      style={{
        width: collapsed ? "5rem" : "16rem",
        transition: "width 300ms",
        backgroundColor: bg,
        color: textMain,
        borderRight: `1px solid ${border}`,
      }}
      className="flex flex-col shrink-0 overflow-hidden"
    >
      {/* Header / toggle */}
      <div
        style={{ height: "4rem", borderBottom: `1px solid ${border}` }}
        className={`flex items-center ${collapsed ? "justify-center" : "px-4"}`}
      >
        <div
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div
            style={{ backgroundColor: "#2563eb", borderRadius: "6px" }}
            className="h-10 w-12 flex items-center justify-center shrink-0"
          >
            <span className="font-bold text-white">D&C</span>
          </div>
          {!collapsed && (
            <span
              style={{ color: textMain }}
              className="font-semibold text-sm whitespace-nowrap"
            >
              Deviation & Change Control
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                end={item.href === "/"}
                title={collapsed ? item.name : undefined}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "0.5rem",
                  transition: "background-color 150ms, color 150ms",
                  textDecoration: "none",
                  padding: collapsed ? "0.75rem 0.5rem" : "0.625rem 1rem",
                  justifyContent: collapsed ? "center" : undefined,
                  gap: collapsed ? undefined : "0.75rem",
                  backgroundColor: isActive ? "#2563eb" : "transparent",
                  color: isActive ? "#ffffff" : textMuted,
                  fontWeight: isActive ? 600 : 400,
                })}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  const isActive = el.style.backgroundColor === "rgb(37, 99, 235)";
                  if (!isActive) {
                    el.style.backgroundColor = hoverBg;
                    el.style.color = hoverText;
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  const isActive = el.style.backgroundColor === "rgb(37, 99, 235)";
                  if (!isActive) {
                    el.style.backgroundColor = "transparent";
                    el.style.color = textMuted;
                  }
                }}
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