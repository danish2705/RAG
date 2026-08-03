import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { AlertTriangle, Clock, FileCheck, ShieldAlert, X, Bell } from "lucide-react";
import { useAuth } from "./AuthContext";
import {
  fetchNotifications,
  markNotificationRead as apiMarkNotificationRead,
  markAllNotificationsRead as apiMarkAllNotificationsRead,
  type NotificationRow,
} from "../services/notificationsApi";

export type QMSNotificationType = "critical" | "warning" | "info" | "success";

export interface QMSNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: QMSNotificationType;
  read: boolean;
  /** Present when this notification is about a case with a due date. */
  dueDate: string | null;
}

interface ToastAlert {
  id: string;
  title: string;
  message: string;
  time: string;
  type: QMSNotificationType | "welcome";
}

interface NotificationContextType {
  notifications: QMSNotification[];
  unreadCount: number;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  /** Ephemeral, local-only toast — not persisted server-side. Real,
   *  cross-user notifications (e.g. "case submitted to you") come from the
   *  backend via the poller below instead. */
  triggerNewNotification: (
    title: string,
    message: string,
    type: QMSNotificationType,
  ) => void;
}

// How often to poll the backend for new notifications while the tab is open.
// There's no websocket/push in this app, so this is the mechanism by which an
// approver "sees" a case that was just submitted to them.
const POLL_INTERVAL_MS = 20000;

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  return `${diffDay} days ago`;
}

function toQMSNotification(row: NotificationRow): QMSNotification {
  return {
    id: String(row.id),
    title: row.title,
    message: row.message,
    time: formatRelativeTime(row.created_at),
    type: row.type,
    read: row.is_read,
    dueDate: row.due_date,
  };
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  // Same identity rule the rest of the app uses for submitted_to/saved_by,
  // so notifications addressed to this display name actually match.
  const identity = (user?.displayName || user?.username || "").trim();

  const [notifications, setNotifications] = useState<QMSNotification[]>([]);
  const [activeToasts, setActiveToasts] = useState<ToastAlert[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const hasLoadedOnceRef = useRef(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const refresh = useCallback(async () => {
    if (!identity) return;
    try {
      const { data } = await fetchNotifications(identity);
      const mapped = data.map(toQMSNotification);

      // Pop a toast for anything new (and still unread) since the last
      // refresh. Skipped on the very first load so we don't toast every
      // historical notification at once when the app opens.
      if (hasLoadedOnceRef.current) {
        const fresh = mapped.filter(
          (n) => !seenIdsRef.current.has(n.id) && !n.read,
        );
        if (fresh.length) {
          setActiveToasts((prev) => [
            ...prev,
            ...fresh.map((n) => ({
              id: n.id,
              title: n.title,
              message: n.message,
              time: "Just now",
              type: n.type,
            })),
          ]);
        }
      }
      mapped.forEach((n) => seenIdsRef.current.add(n.id));
      hasLoadedOnceRef.current = true;

      setNotifications(mapped);
    } catch {
      // Best-effort — leave whatever was already loaded in place rather than
      // clearing the list on a transient network error.
    }
  }, [identity]);

  useEffect(() => {
    if (!isAuthenticated || !identity) {
      setNotifications([]);
      seenIdsRef.current = new Set();
      hasLoadedOnceRef.current = false;
      return;
    }

    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated, identity, refresh]);

  // Ephemeral, local-only alert — pops a toast immediately without waiting
  // for the next poll. Not persisted, not visible to any other user/session.
  const triggerNewNotification = (
    title: string,
    message: string,
    type: QMSNotificationType,
  ) => {
    const newToast: ToastAlert = {
      id: `local-${Date.now()}`,
      title,
      message,
      time: "Just now",
      type,
    };
    setActiveToasts((prev) => [...prev, newToast]);
  };

  // Auto-dismiss toasts after 6 seconds
  useEffect(() => {
    if (activeToasts.length > 0) {
      const timer = setTimeout(() => {
        setActiveToasts((prev) => prev.slice(1));
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activeToasts]);

  const removeToast = (id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (identity) apiMarkAllNotificationsRead(identity).catch(() => {});
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    if (identity) apiMarkNotificationRead(id, identity).catch(() => {});
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case "warning":
        return <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      case "success":
        return <FileCheck className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case "welcome":
        return <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      default:
        return <ShieldAlert className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case "critical": return "border-l-red-600 dark:border-l-red-500";
      case "warning": return "border-l-amber-500 dark:border-l-amber-400";
      case "success": return "border-l-green-600 dark:border-l-green-500";
      case "welcome": return "border-l-blue-600 dark:border-l-blue-500";
      default: return "border-l-blue-500 dark:border-l-blue-400";
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllAsRead,
        markAsRead,
        triggerNewNotification,
      }}
    >
      {children}

      {/* BOTTOM-RIGHT TOAST POP-UP CONTAINER */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {activeToasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg bg-card border border-border shadow-2xl border-l-4 ${getBorderColor(
              toast.type
            )} animate-in slide-in-from-right-5 duration-300 transition-all`}
          >
            <div className="p-2 rounded-full bg-muted/60 shrink-0 mt-0.5">
              {getIcon(toast.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-foreground truncate">{toast.title}</p>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{toast.time}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-3">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors shrink-0"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
