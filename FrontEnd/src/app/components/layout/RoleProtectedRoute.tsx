import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext";

interface RoleProtectedRouteProps {
  /** Roles (case-insensitive) allowed to access the nested routes. */
  allowedRoles: string[];
  /** Where to send users who are authenticated but not permitted. */
  redirectTo?: string;
}

/**
 * Guards a set of nested routes based on the logged-in user's role.
 * Must be used *inside* <ProtectedRoute /> so `user` is guaranteed to exist
 * once we get here; if it doesn't (edge case), we fall back to /login.
 */
export function RoleProtectedRoute({
  allowedRoles,
  redirectTo,
}: RoleProtectedRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role?.toLowerCase();
  const isAllowed = allowedRoles.some((r) => r.toLowerCase() === role);

  if (!isAllowed) {
    // Guests are scoped to the intake flow; everyone else falls back home.
    const fallback = redirectTo ?? (role === "guest" ? "/deviation" : "/");
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}