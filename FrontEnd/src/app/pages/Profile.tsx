import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { KpiCard } from "../components/dashboard/KpiCard";
import {
  User,
  Shield,
  Building,
  Key,
  Award,
  ArrowLeft,
  LogOut,
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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Extended demo profile details — in a real app this would come from the
// backend alongside the auth session.
const PROFILE_DETAILS = {
  email: "admin@company.com",
  employeeId: "EMP-QA-1042",
  memberSince: "Jan 14, 2023",
  lastLogin: "Today, 9:12 AM",
  location: "Building A — Site 1",
};

const STATS = [
  { label: "Cases Reviewed", value: "128", sub: "All time", icon: ClipboardCheck },
  { label: "Approvals Given", value: "94", sub: "Last 12 months", icon: CheckCircle2 },
  { label: "Avg. Response Time", value: "6.4 hrs", sub: "Across all cases", icon: TrendingUp },
];

const RECENT_ACTIVITY = [
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
];

export function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Identity header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                <User className="h-8 w-8 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-bold text-xl text-foreground font-mono capitalize">
                    {user?.username ?? "admin"}
                  </h1>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800 text-xs">
                    Global Admin
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {user?.role ?? "Quality Manager & Lead"} ·{" "}
                  {user?.department ?? "Quality Assurance & Compliance"}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-950/30 shrink-0"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STATS.map((stat) => (
          <KpiCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: account + permissions */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-blue-600" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/50 border border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Mail className="h-4 w-4 text-blue-500" /> Email
                </span>
                <span className="font-medium text-foreground text-xs">
                  {PROFILE_DETAILS.email}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/50 border border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Fingerprint className="h-4 w-4 text-blue-500" /> Employee ID
                </span>
                <span className="font-medium text-foreground text-xs">
                  {PROFILE_DETAILS.employeeId}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/50 border border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Building className="h-4 w-4 text-blue-500" /> Department
                </span>
                <span className="font-medium text-foreground text-xs">
                  {user?.department ?? "Quality Assurance & Compliance"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/50 border border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Key className="h-4 w-4 text-blue-500" /> Privileges
                </span>
                <span className="font-medium text-green-600 dark:text-green-400 font-semibold text-xs">
                  Read / Write / Override Authority
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/50 border border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground text-xs">
                  <CalendarDays className="h-4 w-4 text-blue-500" /> Member Since
                </span>
                <span className="font-medium text-foreground text-xs">
                  {PROFILE_DETAILS.memberSince}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/50 border border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground text-xs">
                  <CalendarClock className="h-4 w-4 text-blue-500" /> Last Login
                </span>
                <span className="font-medium text-foreground text-xs">
                  {PROFILE_DETAILS.lastLogin}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-4 w-4 text-blue-600" />
                Regulatory Authorizations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-xs font-normal">
                  21 CFR Part 11
                </Badge>
                <Badge variant="outline" className="text-xs font-normal">
                  EU Annex 11 Compliance
                </Badge>
                <Badge variant="outline" className="text-xs font-normal">
                  AI Severity Override
                </Badge>
                <Badge variant="outline" className="text-xs font-normal">
                  CAPA Final Sign-off
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: recent activity */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4 text-blue-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {RECENT_ACTIVITY.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 p-4">
                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${item.iconColor}`} />
                      <div className="space-y-0.5">
                        <p className="text-xs text-foreground leading-snug">
                          {item.text}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {item.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 text-blue-600" />
                Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You're signed in from {PROFILE_DETAILS.location}. Log out if
                this isn't you or if you're on a shared device.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}