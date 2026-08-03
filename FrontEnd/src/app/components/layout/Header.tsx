import {
  User,
  ArrowLeft,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  UserCircle2,
  Settings,
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
import { useLocation, useNavigate } from "react-router";
import type { Location } from "react-router";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { NotificationDropdown } from "./NotificationDropdown";

type PageMetaEntry = { title: string; subtitle: string; back?: string };

const PAGE_META: Record<string, PageMetaEntry> = {
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
    title: "Audit Logs",
    subtitle: "Track changes and activity across the system",
  },
  "/pending-ai-reviews": {
    title: "Pending AI Reviews",
    subtitle:
      "Retry AI requests that were saved while the AI service was unavailable",
  },
  "/reports": {
    title: "Reports",
    subtitle: "Generate and review quality reports",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Manage your application preferences",
  },
  "/profile": {
    title: "Profile",
    subtitle: "Your account details and permissions",
    back: "/",
  },
  "/approvals": {
    title: "Approvals",
    subtitle: "Review and approve pending requests",
  },
};

export function Header() {
  const location = useLocation() as Location<unknown>;
  const navigate = useNavigate();
  const meta = PAGE_META[location.pathname];
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

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
            <div className="flex flex-col">
              <h1 className="text-lg font-medium text-foreground">
                {meta.title}
              </h1>

              <p className="text-xs text-muted-foreground">
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
        <div className="flex items-center gap-3">
          {/* 1. Notifications Dropdown — backed by the real /api/notifications
               feed (case submissions, due dates), not mock data. */}
          <NotificationDropdown />
          <div className="mx-0 h-8 w-px bg-border" />

          {/* 2. User Profile Dropdown */}
          <div className="mr-0">

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-11 px-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-sm">
                      {user?.username
                        ?.split(" ")
                        .map((word) => word[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase() ?? "AD"}
                    </div>

                    <div className="hidden md:flex items-center max-w-[140px]">
                      <span
                        className="truncate text-base font-semibold text-foreground capitalize"
                        title={user?.username}
                      >
                        {user?.username}
                      </span>
                    </div>

                    <ChevronDown className="ml-4 h-4 w-4 text-muted-foreground" />  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-72 rounded-xl border shadow-xl p-2"
              >             <DropdownMenuLabel className="p-0">
                  <div className="flex items-center gap-4 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4 py-4">
                    {/* Avatar */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-base font-semibold text-white shadow-md">
                      {user?.username
                        ?.split(" ")
                        .map((word) => word[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase() ?? "AD"}
                    </div>

                    {/* User Info */}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[15px] font-semibold text-foreground capitalize">
                        {user?.username}
                      </h3>

                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {user?.role}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Profile navigates to the dedicated profile page */}
                <DropdownMenuItem
                  onSelect={() => navigate("/profile")}
                  className="
    group
    flex items-center gap-3
    rounded-lg
    py-2.5 px-3
    cursor-pointer
    hover:bg-blue-50 dark:hover:bg-blue-950/40
    transition-all duration-200
  "
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                    <UserCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>

                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Profile</span>
                    {/* <span className="text-xs text-muted-foreground">
      View your account information
    </span> */}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => navigate("/settings")}
                  className="
    group
    flex items-center gap-3
    rounded-lg
    py-2.5 px-3
    cursor-pointer
    hover:bg-blue-50 dark:hover:bg-blue-950/40
    transition-all duration-200
  "
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                    <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>

                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Settings</span>
                    {/* <span className="text-xs text-muted-foreground">
      Manage application preferences
    </span> */}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                {/* Dark mode toggle */}
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    toggleTheme();
                  }}
                  className="
    flex items-center justify-between
    rounded-lg
    cursor-pointer
    py-2.5 px-3
    hover:bg-blue-50 dark:hover:bg-blue-950/40
    transition-all duration-200
    group
  "
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                      {theme === "dark" ? (
                        <Moon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Sun className="h-4 w-4 text-amber-500" />
                      )}
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {theme === "dark" ? "Dark Mode" : "Light Mode"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {theme === "dark"
                          ? "Dark appearance enabled"
                          : "Light appearance enabled"}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${theme === "dark"
                        ? "bg-blue-600"
                        : "bg-slate-300 dark:bg-slate-600"
                      }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${theme === "dark" ? "translate-x-5" : "translate-x-0.5"
                        }`}
                    />
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={handleLogout}
                  className="
    flex items-center justify-center gap-2
    rounded-lg
    cursor-pointer
    py-2.5 px-3
    text-red-600 dark:text-red-400
    hover:bg-red-50 hover:text-red-700
    dark:hover:bg-red-950/50 dark:hover:text-red-300
    focus:bg-red-50 focus:text-red-700
    dark:focus:bg-red-950/50 dark:focus:text-red-300
    transition-all duration-200
  "
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-medium">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
}