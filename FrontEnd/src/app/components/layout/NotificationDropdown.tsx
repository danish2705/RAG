import React, { useState, useRef, useEffect } from "react";
import { Bell, CheckCircle, AlertTriangle, FileText, ShieldAlert, X } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { mockNotifications, type QMSNotification } from "../../mocks/mockNotifications";

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<QMSNotification[]>(mockNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Handle outside clicks to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getDomainIcon = (domain: QMSNotification["domain"]) => {
    switch (domain) {
      case "deviation":
        return <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />;
      case "capa":
        return <CheckCircle className="h-4 w-4 text-yellow-500 shrink-0" />;
      case "change_control":
        return <FileText className="h-4 w-4 text-blue-500 shrink-0" />;
      default:
        return <ShieldAlert className="h-4 w-4 text-purple-500 shrink-0" />;
    }
  };

  const getBorderColor = (domain: QMSNotification["domain"]) => {
    switch (domain) {
      case "deviation":
        return "border-l-red-500";
      case "capa":
        return "border-l-yellow-500";
      case "change_control":
        return "border-l-blue-500";
      default:
        return "border-l-purple-500";
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="View notifications"
      >
        <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-card border border-border shadow-lg ring-1 ring-black/5 z-50 overflow-hidden animate-in fade-in-80 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground">QMS Notifications</span>
              {unreadCount > 0 && (
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-xs px-1.5 py-0">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs h-7 px-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Mark all read
                </Button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No notifications to display.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 transition-colors hover:bg-muted/40 border-l-4 ${getBorderColor(
                    n.domain
                  )} ${!n.read ? "bg-blue-50/40 dark:bg-blue-950/10" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getDomainIcon(n.domain)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-semibold ${!n.read ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                          {n.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 bg-muted/30 border-t border-border text-center">
            <span className="text-[11px] text-muted-foreground">
              Showing real-time domain events from global audit logs
            </span>
          </div>
        </div>
      )}
    </div>
  );
};