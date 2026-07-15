import { createContext, useContext, useState } from "react";
import { apiFetch } from "../utils/api";

export interface AuthUser {
  username: string;
  role: string;
  department: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  loginWithSSO: () => Promise<void>;
  logout: () => void;
}

const AUTH_STORAGE_KEY = "dc_auth_user";

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => false,
  loginWithSSO: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as AuthUser) : null;
  });

  const login = async (username: string, password: string) => {
    try {
      const { user: loggedInUser } = await apiFetch<{ user: AuthUser }>(
        "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        },
      );
      setUser(loggedInUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedInUser));
      return true;
    } catch {
      return false;
    }
  };

  // Simulated SSO — in a real app this would redirect to an identity
  // provider and come back with a token. Here it calls the backend, which
  // signs the demo user in directly, so the click still goes straight to
  // the dashboard just like before.
  const loginWithSSO = async () => {
    const { user: ssoUser } = await apiFetch<{ user: AuthUser }>(
      "/api/auth/sso",
      { method: "POST" },
    );
    setUser(ssoUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(ssoUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, loginWithSSO, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
