import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  User,
  Shield,
  Building,
  Key,
  Award,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Administrative Profile
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Active QMS domain permissions and system authorizations.
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* User identity */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-lg bg-muted/60 border border-border">
            <div className="h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
              <User className="h-7 w-7 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-foreground font-mono capitalize">
                  {user?.username ?? "admin"}
                </h3>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800 text-xs">
                  Global Admin
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {user?.role ?? "Quality Manager & Lead"}
              </p>
            </div>
          </div>

          {/* Credentials */}
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center justify-between p-2.5 rounded-md bg-card border border-border/40">
              <span className="flex items-center gap-2 text-muted-foreground text-xs">
                <Building className="h-4 w-4 text-blue-500" /> Department:
              </span>
              <span className="font-medium text-foreground text-xs">
                {user?.department ?? "Quality Assurance & Compliance"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-md bg-card border border-border/40">
              <span className="flex items-center gap-2 text-muted-foreground text-xs">
                <Key className="h-4 w-4 text-blue-500" /> Privileges:
              </span>
              <span className="font-medium text-green-600 dark:text-green-400 font-semibold text-xs">
                Read / Write / Override Authority
              </span>
            </div>
          </div>

          {/* Authorizations */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-blue-500" /> Regulatory
              Authorizations
            </span>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
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
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-950/30"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}