import { useState } from "react";
import {
  Bell,
  User,
  ArrowLeft,
  Sun,
  Moon,
  Shield,
  Building,
  Key,
  Award,
  AlertTriangle,
  CheckCircle,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { useLocation, useNavigate } from "react-router";
import type { Location } from "react-router";
import { useTheme } from "../../context/ThemeContext";

const PAGE_META: Record<
  string,
  { title: string; subtitle: string; back?: string }
> = {
  "/deviation": {
    title: "Quality Event Intake",
    subtitle: "AI will classify and route your quality event automatically",
  },
  "/deviation/ai-recommendation": {
    title: "AI Classification",
    subtitle: "Review AI-generated classification and severity",
    back: "/deviation",
  },
  "/deviation/immediate-correction": {
    title: "Immediate Correction",
    subtitle: "Record immediate actions taken to contain the event",
    back: "/deviation/ai-recommendation",
  },
  "/deviation/impact-assessment": {
    title: "Impact Assessment",
    subtitle: "Evaluate the impact of the quality event",
    back: "/deviation/ai-recommendation",
  },
  "/deviation/root-cause": {
    title: "Root Cause Analysis",
    subtitle: "Identify the root cause of the quality event",
    back: "/deviation/impact-assessment",
  },
  "/deviation/capa": {
    title: "CAPA",
    subtitle: "Define corrective and preventive actions",
    back: "/deviation/root-cause",
  },
  "/deviation/summary": {
    title: "Summary",
    subtitle: "Review and save the complete quality event record",
    back: "/deviation/capa",
  },
  "/change-control/change-impact-assessment": {
    title: "Impact Assessment",
    subtitle: "Evaluate the impact of the change control event",
    back: "/deviation/ai-recommendation",
  },
  "/change-control/risk-criticality": {
    title: "Risk & Criticality Evaluation",
    subtitle: "Assess the risk and criticality of the change control event",
    back: "/change-control/change-impact-assessment",
  },
  "/change-control/validation-testing": {
    title: "Validation & Testing Strategy",
    subtitle: "Define the validation and testing strategy for the change control event",
    back: "/change-control/risk-criticality",
  },
  "/change-control/implementation": {
    title: "Implementation & Control Actions",
    subtitle: "Plan the implementation and control actions for the change control event",
    back: "/change-control/validation-testing",
  },
  "/change-control/summary": {
    title: "Summary",
    subtitle: "Review and save the complete change control record",
    back: "/change-control/implementation",
  },
  "/": {
    title: "Dashboard",
    subtitle: "Overview of quality events and metrics",
  },
  "/records": {
    title: "Records",
    subtitle: "All saved deviation and change control cases",
  },
  "/audit-trail": {
    title: "Audit Trail",
    subtitle: "Track changes and activity across the system",
  },
  "/reports": {
    title: "Reports",
    subtitle: "Generate and review quality reports",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Manage your application preferences",
  },
};

// Realistic domain-specific QMS notifications
const QMS_NOTIFICATIONS = [
  {
    id: "notif-1",
    domain: "Deviation",
    title: "Critical Deviation Triggered",
    message: "DEV-2026-089 (Cold Storage B). AI confidence dropped below 70%. Human review required.",
    time: "10 mins ago",
    unread: true,
    icon: AlertTriangle,
    iconColor: "text-red-500",
    border: "border-l-red-500",
  },
  {
    id: "notif-2",
    domain: "CAPA",
    title: "CAPA Due Date Approaching",
    message: "CAPA-2026-042 effectiveness check is due in 48 hours. QA sign-off pending.",
    time: "1 hour ago",
    unread: true,
    icon: CheckCircle,
    iconColor: "text-yellow-500",
    border: "border-l-yellow-500",
  },
  {
    id: "notif-3",
    domain: "Change Control",
    title: "Impact Assessment Completed",
    message: "CC-2026-015 evaluated by AI with Minor severity across all risk parameters.",
    time: "3 hours ago",
    unread: true,
    icon: FileText,
    iconColor: "text-blue-500",
    border: "border-l-blue-500",
  },
  {
    id: "notif-4",
    domain: "System",
    title: "Audit Trail Exported",
    message: "Global QMS activity logs for Q2 were successfully archived by system admin.",
    time: "Yesterday",
    unread: false,
    icon: ShieldAlert,
    iconColor: "text-purple-500",
    border: "border-l-purple-500",
  },
  {
    id: "notif-5",
    domain: "Deviation",
    title: "Root Cause Overridden",
    message: "DEV-2026-071 root cause analysis was manually overridden. Audit log updated.",
    time: "2 days ago",
    unread: false,
    icon: AlertTriangle,
    iconColor: "text-orange-500",
    border: "border-l-orange-500",
  },
];

export function Header() {
  const location = useLocation() as Location<unknown>;
  const navigate = useNavigate();
  const meta = PAGE_META[location.pathname];
  const { theme, toggleTheme } = useTheme();

  // State to control the Admin Profile Modal
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const fallbackTitle = (() => {
    const segment = location.pathname.split("/").filter(Boolean).pop();
    if (!segment) return "QMS";
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  })();

  const handleBack = () => {
    if (!meta?.back) return;
    navigate(meta.back, { state: location.state });
  };

  const unreadCount = QMS_NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <>
      <header className="h-16 border-b bg-background flex items-center justify-between px-6 sticky top-0 z-10">
        {/* Left: back button + page title + subtitle */}
        <div className="flex items-center gap-3">
          {meta?.back && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          {meta ? (
            <div className="flex flex-col justify-center">
              <h1 className="text-base font-semibold text-foreground leading-tight">
                {meta.title}
              </h1>
              <p className="text-xs text-muted-foreground leading-tight">
                {meta.subtitle}
              </p>
            </div>
          ) : (
            <span className="text-base font-semibold text-foreground">
              {fallbackTitle}
            </span>
          )}
        </div>

        {/* Right: bell + user dropdowns */}
        <div className="flex items-center gap-4">
          {/* 1. Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600 font-bold animate-pulse">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 overflow-hidden shadow-lg">
              <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
                <span className="font-semibold text-sm text-foreground">QMS Notifications</span>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-xs">
                  {unreadCount} new
                </Badge>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
                {QMS_NOTIFICATIONS.map((notif) => {
                  const IconComponent = notif.icon;
                  return (
                    <DropdownMenuItem
                      key={notif.id}
                      className={`flex items-start gap-3 p-3.5 cursor-pointer rounded-none border-l-4 ${notif.border} ${
                        notif.unread ? "bg-blue-50/40 dark:bg-blue-950/10 font-medium" : ""
                      }`}
                    >
                      <IconComponent className={`h-4 w-4 mt-0.5 shrink-0 ${notif.iconColor}`} />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs ${notif.unread ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                            {notif.time}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                      {notif.unread && (
                        <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </div>
              <div className="p-2 bg-muted/30 border-t border-border text-center">
                <span className="text-[11px] text-muted-foreground">
                  Showing real-time domain events from global audit logs
                </span>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 2. User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>admin</div>
                <div className="text-xs font-normal text-muted-foreground">
                  Quality Manager & Lead
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Profile click triggers modal */}
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setIsProfileOpen(true);
                }}
                className="cursor-pointer font-medium"
              >
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
              <DropdownMenuSeparator />

              {/* Dark mode toggle */}
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  toggleTheme();
                }}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {theme === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                  <span>Dark Mode</span>
                </div>
                <div
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    theme === "dark" ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      theme === "dark" ? "translate-x-4" : "translate-x-1"
                    }`}
                  />
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* 3. Streamlined Domain-Specific Administrative Profile Modal */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Administrative Profile
            </DialogTitle>
            <DialogDescription>
              Active QMS domain permissions and system authorizations.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-4">
            {/* User Identity Card */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-lg bg-muted/60 border border-border">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                <User className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base text-foreground font-mono">
                    Admin
                  </h3>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800 text-xs">
                    Global Admin
                  </Badge>
                </div>
              </div>
            </div>

            {/* Concise Domain Credentials */}
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center justify-between p-2 rounded-md bg-card border border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Building className="h-4 w-4 text-blue-500" /> Department:
                </span>
                <span className="font-medium text-foreground text-xs">
                  Quality Assurance & Compliance
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-md bg-card border border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Key className="h-4 w-4 text-blue-500" /> Privileges:
                </span>
                <span className="font-medium text-green-600 dark:text-green-400 font-semibold text-xs">
                  Read / Write / Override Authority
                </span>
              </div>
            </div>

            {/* Essential QMS Gateways Only */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-blue-500" /> Regulatory Authorizations
              </span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                <Badge variant="outline" className="text-xs font-normal">21 CFR Part 11</Badge>
                <Badge variant="outline" className="text-xs font-normal">EU Annex 11 Compliance</Badge>
                <Badge variant="outline" className="text-xs font-normal">AI Severity Override</Badge>
                <Badge variant="outline" className="text-xs font-normal">CAPA Final Sign-off</Badge>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="default"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-xs h-9"
              onClick={() => setIsProfileOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}