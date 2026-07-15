import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Card, CardContent } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  ShieldCheck,
  LogIn,
  Eye,
  EyeOff,
  AlertCircle,
  Building2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { login, loginWithSSO } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const success = await login(username.trim(), password);
      if (success) {
        navigate(location.state?.from || "/", { replace: true });
      } else {
        setError("Incorrect username or password. Please try again.");
      }
    } catch {
      setError("Something went wrong signing in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSSOLogin = async () => {
    // Backend signs the demo user in directly — clicking this goes
    // straight to the dashboard, same as before.
    await loginWithSSO();
    navigate(location.state?.from || "/", { replace: true });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Branding */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-sm">
              <span className="font-bold text-white text-lg">D&C</span>
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white dark:bg-background border border-border flex items-center justify-center">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Deviation &amp; Change Control
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Secure quality management platform
            </p>
          </div>
        </div>

        {/* Login card */}
        <Card>
          <CardContent className="pt-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-foreground">
                Welcome back
              </h2>
              <p className="text-sm text-muted-foreground">
                Enter your credentials to continue
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-500/10 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  autoFocus
                  autoComplete="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !username || !password}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                <LogIn className="h-4 w-4 mr-2" />
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] font-medium text-muted-foreground tracking-wide">
                OR CONTINUE WITH
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleSSOLogin}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Login with SSO
            </Button>
          </CardContent>
        </Card>

        {/* Demo credentials */}
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Demo Credentials
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Admin</span>
            <span className="font-mono text-foreground">admin / admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
