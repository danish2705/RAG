import { createContext, useContext, useState } from "react";
import { apiFetch } from "../utils/api";

export interface AuthUser {
  username: string;
  role: string;
  department: string;
  /** Friendly display name, collected once after a User-role login and
   *  used to attribute records instead of the raw username. */
  displayName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<AuthUser | null>;
  loginWithSSO: () => Promise<void>;
  setDisplayName: (name: string) => void;
  logout: () => void;
}

const AUTH_STORAGE_KEY = "dc_auth_user";

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => null,
  loginWithSSO: async () => {},
  setDisplayName: () => {},
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
      return loggedInUser;
    } catch {
      return null;
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

  // Called once, right after a User-role login, to attach the name they
  // typed in the post-login prompt. Persisted alongside the rest of the
  // session so it survives refreshes.
  const setDisplayName = (name: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, displayName: name };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        loginWithSSO,
        setDisplayName,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}