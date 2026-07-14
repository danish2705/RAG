import { createContext, useContext, useState } from "react";

export interface AuthUser {
  username: string;
  role: string;
  department: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AUTH_STORAGE_KEY = "dc_auth_user";

// Demo credentials — both username and password are "admin"
const VALID_USERNAME = "admin";
const VALID_PASSWORD = "admin";

const DEMO_USER: AuthUser = {
  username: "admin",
  role: "Quality Manager & Lead",
  department: "Quality Assurance & Compliance",
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as AuthUser) : null;
  });

  const login = (username: string, password: string) => {
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      setUser(DEMO_USER);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEMO_USER));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}