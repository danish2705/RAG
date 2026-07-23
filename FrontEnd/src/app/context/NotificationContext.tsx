import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AlertTriangle, Clock, FileCheck, ShieldAlert, X, Bell, ExternalLink } from "lucide-react";

export interface QMSNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "critical" | "warning" | "info" | "success";
  read: boolean;
}

interface ToastAlert {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "critical" | "warning" | "info" | "success" | "welcome";
}

interface NotificationContextType {
  notifications: QMSNotification[];
  unreadCount: number;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  triggerNewNotification: (title: string, message: string, type: "critical" | "warning" | "info" | "success") => void;
}

const INITIAL_NOTIFICATIONS: QMSNotification[] = [
  {
    id: "notif-1",
    title: "Critical Deviation Triggered",
    message: "DEV-2026-089 (Cold Storage B). AI confidence dropped below 70%. Human review required.",
    time: "10 mins ago",
    type: "critical",
    read: false,
  },
  {
    id: "notif-2",
    title: "CAPA Due Date Approaching",
    message: "CAPA-2026-042 effectiveness check is due in 48 hours. QA sign-off pending.",
    time: "1 hour ago",
    type: "warning",
    read: false,
  },
  {
    id: "notif-3",
    title: "Impact Assessment Completed",
    message: "CC-2026-015 evaluated by AI with Minor severity across all risk parameters.",
    time: "3 hours ago",
    type: "info",
    read: false,
  },
  {
    id: "notif-4",
    title: "Audit Trail Exported",
    message: "Global QMS activity logs for Q2 were successfully archived to secure storage.",
    time: "Yesterday",
    type: "success",
    read: true,
  },
];

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<QMSNotification[]>(INITIAL_NOTIFICATIONS);
  const [activeToasts, setActiveToasts] = useState<ToastAlert[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // 1. Trigger Initial Bottom-Right Pop-up on Dashboard Load
  useEffect(() => {
    const unread = INITIAL_NOTIFICATIONS.filter((n) => !n.read).length;
    if (unread > 0) {
      const welcomeToast: ToastAlert = {
        id: "welcome-popup",
        title: "Unread QMS Notifications",
        message: `You have ${unread} unread quality alerts waiting for your review in the notification center.`,
        time: "Just now",
        type: "welcome",
      };
      
      // Slight delay for smooth entrance after page load
      const timer = setTimeout(() => {
        setActiveToasts((prev) => [...prev, welcomeToast]);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  // 2. Function to add new live notification (updates list, count badge, AND pops up bottom-right toast)
  const triggerNewNotification = (
    title: string,
    message: string,
    type: "critical" | "warning" | "info" | "success"
  ) => {
    const newId = `notif-${Date.now()}`;
    const newNotif: QMSNotification = {
      id: newId,
      title,
      message,
      time: "Just now",
      type,
      read: false,
    };

    // Push to top of notifications list -> immediately increments top badge count!
    setNotifications((prev) => [newNotif, ...prev]);

    // Trigger bottom-right content toast
    const newToast: ToastAlert = {
      id: newId,
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
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
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