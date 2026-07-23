import React, { useState } from "react";
import { Bell, Check, AlertTriangle, Clock, FileCheck, ShieldAlert } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case "critical": return <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case "warning": return <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case "success": return <FileCheck className="h-4 w-4 text-green-600 dark:text-green-400" />;
      default: return <ShieldAlert className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case "critical": return "border-l-red-600";
      case "warning": return "border-l-amber-500";
      case "success": return "border-l-green-600";
      default: return "border-l-blue-500";
    }
  };

  return (
    <div className="relative inline-block text-left">
      {/* BELL ICON WITH LIVE UNREAD BADGE */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
        aria-label="View notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-background animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <>
          {/* Backdrop to close dropdown on outside click */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-card border border-border shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">QMS Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-semibold text-[11px]">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Check className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-border/60">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  No notifications in your queue.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer border-l-4 ${getBorderColor(
                      notif.type
                    )} ${notif.read ? "bg-card hover:bg-muted/30 opacity-70" : "bg-muted/20 hover:bg-muted/50 font-medium"}`}
                  >
                    <div className="mt-0.5 shrink-0">{getIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs truncate ${notif.read ? "text-muted-foreground font-normal" : "text-foreground font-bold"}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{notif.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug line-clamp-2 font-normal">
                        {notif.message}
                      </p>
                    </div>
                    {!notif.read && (
                      <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-muted/40 border-t border-border text-center">
              <span className="text-[11px] text-muted-foreground">
                Showing real-time domain events from global audit logs
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};