import { Bell, User, ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { useLocation, useNavigate } from "react-router";
import type { Location } from "react-router";

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
  "/deviation/historical-analysis": {
    title: "Historical Analysis",
    subtitle: "Review similar past events and trends",
    back: "/deviation/impact-assessment",
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
  "/": {
    title: "Dashboard",
    subtitle: "Overview of quality events and metrics",
  },
  "/db-log": {
    title: "DB Log",
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

export function Header() {
  const location = useLocation() as Location<unknown>;
  const navigate = useNavigate();
  const meta = PAGE_META[location.pathname];

  // Fallback for routes not yet in PAGE_META: derive a readable title
  // from the path segment (e.g. "/new-feature" -> "New Feature").
  const fallbackTitle = (() => {
    const segment = location.pathname.split("/").filter(Boolean).pop();
    if (!segment) return "QMS";
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  })();

  // Build back-navigation state: the previous page needs the same `result`
  // object that was passed to the current page so it can restore its data.
  const handleBack = () => {
    if (!meta?.back) return;
    navigate(meta.back, { state: location.state });
  };

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Left: back button + page title + subtitle */}
      <div className="flex items-center gap-3">
        {meta?.back && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:text-gray-900"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        {meta ? (
          <div className="flex flex-col justify-center">
            <h1 className="text-base font-semibold text-gray-900 leading-tight">
              {meta.title}
            </h1>
            <p className="text-xs text-gray-500 leading-tight">
              {meta.subtitle}
            </p>
          </div>
        ) : (
          <span className="text-base font-semibold text-gray-900">
            {fallbackTitle}
          </span>
        )}
      </div>

      {/* Right: bell + user */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-gray-600" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start py-3">
              <div className="font-medium">
                High severity deviation detected
              </div>
              <div className="text-sm text-gray-500">
                DEV-2024-091 • 2 hours ago
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start py-3">
              <div className="font-medium">CAPA due in 3 days</div>
              <div className="text-sm text-gray-500">
                DEV-2024-087 • 1 day ago
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start py-3">
              <div className="font-medium">Change control approval pending</div>
              <div className="text-sm text-gray-500">
                CC-2024-045 • 3 days ago
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div>John Smith</div>
              <div className="text-sm font-normal text-gray-500">
                Quality Manager
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}