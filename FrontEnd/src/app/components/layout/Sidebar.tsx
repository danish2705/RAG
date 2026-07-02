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
  { name: "Records", href: "/records", icon: FolderOpen },
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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const isDark = useDarkMode();

  // Theme tokens
  const bg        = isDark ? "#000000" : "#ffffff";
  const border    = isDark ? "#1e232a" : "#e2e8f0";
  const textMain  = isDark ? "#e2e8f0" : "#1e293b";
  const textMuted = isDark ? "#94a3b8" : "#475569";
  const hoverBg   = isDark ? "#1e293b" : "#eff6ff";
  const hoverText = isDark ? "#e2e8f0" : "#2563eb";

  // Tooltip tokens
  const tooltipBg     = isDark ? "#1e232a" : "#ffffff";
  const tooltipText   = "#2563eb";

  return (
    <aside
      style={{
        width: collapsed ? "5rem" : "16rem",
        transition: "width 300ms",
        backgroundColor: bg,
        color: textMain,
        borderRight: `1px solid ${border}`,
      }}
      className="flex flex-col shrink-0"
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
            <li key={item.name} style={{ position: "relative" }}>
              <NavLink
                to={item.href}
                end={item.href === "/"}
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
                  setHoveredItem(item.name);
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  const isActive = el.style.backgroundColor === "rgb(37, 99, 235)";
                  if (!isActive) {
                    el.style.backgroundColor = "transparent";
                    el.style.color = textMuted;
                  }
                  setHoveredItem(null);
                }}
              >
                <item.icon
                  className="h-5 w-5 shrink-0"
                  style={{
                    transform: hoveredItem === item.name ? "scale(1.2)" : "scale(1)",
                    transition: "transform 150ms ease",
                  }}
                />
                {!collapsed && (
                  <span
                    className="whitespace-nowrap"
                    style={{
                      display: "inline-block",
                      transform: hoveredItem === item.name ? "scale(1.1)" : "scale(1)",
                      transformOrigin: "left center",
                      transition: "transform 150ms ease",
                    }}
                  >
                    {item.name}
                  </span>
                )}
              </NavLink>

              {/* Custom animated tooltip (collapsed mode only) */}
              {collapsed && (
                <span
                  style={{
                    position: "absolute",
                    left: "calc(100% + 0.75rem)",
                    top: "50%",
                    transform:
                      hoveredItem === item.name
                        ? "translateY(-50%) scale(1)"
                        : "translateY(-50%) scale(0.8)",
                    transformOrigin: "left center",
                    opacity: hoveredItem === item.name ? 1 : 0,
                    visibility: hoveredItem === item.name ? "visible" : "hidden",
                    transition: "transform 150ms ease, opacity 150ms ease, visibility 150ms",
                    backgroundColor: tooltipBg,
                    color: tooltipText,
                    borderRadius: "0.375rem",
                    padding: "0.375rem 0.75rem",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    fontStyle: "italic",
                    whiteSpace: "nowrap",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    zIndex: 50,
                    pointerEvents: "none",
                  }}
                >
                  {item.name}
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}