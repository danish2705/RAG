import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  User,
  Shield,
  Building,
  Key,
  Award,
  Mail,
  Fingerprint,
  CalendarDays,
  CalendarClock,
  ClipboardCheck,
  History,
  TrendingUp,
  CheckCircle2,
  FileEdit,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

type ProfileRole = "Admin" | "User" | "Guest";

interface ActivityItem {
  icon: typeof CheckCircle2;
  iconColor: string;
  text: string;
  time: string;
}

interface RoleProfile {
  badgeLabel: string;
  badgeClassName: string;
  roleTitle: string;
  email: string;
  employeeId: string;
  memberSince: string;
  lastLogin: string;
  location: string;
  privileges: string;
  privilegesColor: string;
  gateways: string[];
  stats: { label: string; value: string; sub: string; icon: typeof ClipboardCheck }[];
  activity: ActivityItem[];
}

const ROLE_PROFILES: Record<ProfileRole, RoleProfile> = {
  Admin: {
    badgeLabel: "Global Admin",
    badgeClassName:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800",
    roleTitle: "Quality Manager & Lead",
    email: "admin@company.com",
    employeeId: "EMP-QA-1042",
    memberSince: "Jan 14, 2023",
    lastLogin: "Today, 9:12 AM",
    location: "Building A — Site 1",
    privileges: "Read / Write / Override Authority",
    privilegesColor: "text-green-600 dark:text-green-400",
    gateways: ["21 CFR Part 11", "EU Annex 11", "AI Severity Override", "CAPA Sign-off"],
    stats: [
      { label: "Cases Reviewed", value: "128", sub: "All time", icon: ClipboardCheck },
      { label: "Approvals Given", value: "94", sub: "Last 12 months", icon: CheckCircle2 },
      { label: "Avg. Response Time", value: "6.4 hrs", sub: "Across all cases", icon: TrendingUp },
    ],
    activity: [
      {
        icon: CheckCircle2,
        iconColor: "text-green-600",
        text: "Approved CAPA-2026-042 effectiveness check",
        time: "2 hours ago",
      },
      {
        icon: FileEdit,
        iconColor: "text-blue-600",
        text: "Updated root cause analysis on DEV-2026-089",
        time: "Yesterday",
      },
      {
        icon: ShieldCheck,
        iconColor: "text-purple-600",
        text: "Overrode AI severity classification on CC-2026-015",
        time: "3 days ago",
      },
      {
        icon: ClipboardCheck,
        iconColor: "text-blue-600",
        text: "Submitted new deviation for Cold Storage Unit 3",
        time: "5 days ago",
      },
    ],
  },
  User: {
    badgeLabel: "Standard User",
    badgeClassName:
      "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800",
    roleTitle: "Manufacturing Associate",
    email: "user@company.com",
    employeeId: "EMP-MFG-2087",
    memberSince: "Mar 3, 2024",
    lastLogin: "Today, 8:47 AM",
    location: "Building B — Site 2",
    privileges: "Read / Write",
    privilegesColor: "text-blue-600 dark:text-blue-400",
    gateways: ["21 CFR Part 11", "CAPA Submission"],
    stats: [
      { label: "Cases Submitted", value: "16", sub: "All time", icon: ClipboardCheck },
      { label: "Cases In Review", value: "3", sub: "Currently open", icon: CheckCircle2 },
      { label: "Avg. Response Time", value: "9.1 hrs", sub: "Across all cases", icon: TrendingUp },
    ],
    activity: [
      {
        icon: ClipboardCheck,
        iconColor: "text-blue-600",
        text: "Submitted new deviation for Line 4 Filler",
        time: "1 hour ago",
      },
      {
        icon: FileEdit,
        iconColor: "text-blue-600",
        text: "Updated change control CC-2026-021",
        time: "Yesterday",
      },
      {
        icon: ClipboardCheck,
        iconColor: "text-blue-600",
        text: "Submitted new deviation for Cold Storage Unit 1",
        time: "4 days ago",
      },
    ],
  },
  Guest: {
    badgeLabel: "Guest",
    badgeClassName:
      "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/60 dark:text-gray-300 dark:border-gray-700",
    roleTitle: "Visitor",
    email: "guest@company.com",
    employeeId: "GUEST-0001",
    memberSince: "—",
    lastLogin: "Today, 10:03 AM",
    location: "Building A — Lobby Kiosk",
    privileges: "Read Only",
    privilegesColor: "text-muted-foreground",
    gateways: ["View Only Access"],
    stats: [
      { label: "Cases Viewed", value: "5", sub: "This session", icon: Eye },
      { label: "Reports Viewed", value: "2", sub: "This session", icon: ClipboardCheck },
      { label: "Session Length", value: "18 min", sub: "So far", icon: TrendingUp },
    ],
    activity: [
      {
        icon: Eye,
        iconColor: "text-gray-500",
        text: "Viewed dashboard summary",
        time: "10 minutes ago",
      },
      {
        icon: Eye,
        iconColor: "text-gray-500",
        text: "Viewed record DEV-2026-089",
        time: "15 minutes ago",
      },
    ],
  },
};

function resolveRole(role?: string): ProfileRole {
  if (role === "Admin" || role === "User" || role === "Guest") return role;
  return "Guest";
}

export function Profile() {
  const { user } = useAuth();
  const role = resolveRole(user?.role);
  const profile = ROLE_PROFILES[role];

  return (
    <div className="p-4 sm:p-5 w-full space-y-3.5 max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col justify-between">
      {/* 1. Compact Identity Header */}
      <Card className="shrink-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                <User className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-bold text-lg text-foreground font-mono capitalize leading-none">
                    {user?.username ?? "guest"}
                  </h1>
                  <Badge className={`${profile.badgeClassName} text-[11px] px-2 py-0`}>
                    {profile.badgeLabel}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {profile.roleTitle} · {user?.department ?? profile.roleTitle}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Ultra-Compact KPI Boxes (Reduced Height) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
        {profile.stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-3 shadow-sm border-border/80">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground leading-none">
                    {stat.label}
                  </p>
                  <div className="flex items-baseline gap-1.5 pt-1">
                    <span className="text-xl font-bold text-foreground leading-none">
                      {stat.value}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {stat.sub}
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 shrink-0">
                  <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 3. Middle Row: Account Details & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-stretch flex-1 min-h-0">
        <div className="lg:col-span-2 flex">
          <Card className="w-full flex flex-col justify-between shadow-sm">
            <CardHeader className="py-3 px-4 border-b border-border/40 shrink-0">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4 text-blue-600" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-1.5 flex-1 flex flex-col justify-around">
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded-md bg-muted/40 border border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Mail className="h-3.5 w-3.5 text-blue-500" /> Email
                </span>
                <span className="font-medium text-foreground text-xs">
                  {profile.email}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded-md bg-muted/40 border border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Fingerprint className="h-3.5 w-3.5 text-blue-500" /> Employee ID
                </span>
                <span className="font-medium text-foreground text-xs">
                  {profile.employeeId}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded-md bg-muted/40 border border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Building className="h-3.5 w-3.5 text-blue-500" /> Department
                </span>
                <span className="font-medium text-foreground text-xs truncate max-w-[200px] sm:max-w-none">
                  {user?.department ?? profile.roleTitle}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded-md bg-muted/40 border border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Key className="h-3.5 w-3.5 text-blue-500" /> Privileges
                </span>
                <span className={`font-semibold text-xs ${profile.privilegesColor}`}>
                  {profile.privileges}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded-md bg-muted/40 border border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground text-xs">
                  <CalendarDays className="h-3.5 w-3.5 text-blue-500" /> Member Since
                </span>
                <span className="font-medium text-foreground text-xs">
                  {profile.memberSince}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded-md bg-muted/40 border border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground text-xs">
                  <CalendarClock className="h-3.5 w-3.5 text-blue-500" /> Last Login
                </span>
                <span className="font-medium text-foreground text-xs">
                  {profile.lastLogin}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex">
          <Card className="w-full flex flex-col justify-between shadow-sm">
            <CardHeader className="py-3 px-4 border-b border-border/40 shrink-0">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <History className="h-4 w-4 text-blue-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col justify-around">
              <div className="divide-y divide-border/60">
                {profile.activity.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-2.5 py-2.5 px-3.5">
                      <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${item.iconColor}`} />
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <p className="text-xs text-foreground leading-snug truncate">
                          {item.text}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. Bottom Row: Perfectly Aligned Authorizations & Session */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-stretch shrink-0">
        <div className="lg:col-span-2 flex">
          <Card className="w-full flex flex-col justify-center shadow-sm p-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 shrink-0">
                <Award className="h-4 w-4 text-blue-600" />
                Regulatory Gateways
              </span>
              <div className="flex flex-wrap gap-1">
                {profile.gateways.map((gateway) => (
                  <Badge
                    key={gateway}
                    variant="outline"
                    className="text-[11px] px-2 py-0 font-normal"
                  >
                    {gateway}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="flex">
          <Card className="w-full flex flex-col justify-center shadow-sm p-3.5">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600 shrink-0" />
              <p className="text-xs text-muted-foreground leading-tight truncate">
                Active session: <span className="font-medium text-foreground">{profile.location}</span>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}