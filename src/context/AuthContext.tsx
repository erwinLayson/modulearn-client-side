import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { UserRole } from "../constant/users";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  school_id?: number;
  school_name?: string;
}

function getStoredUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem("modulearn_user");
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<AuthUser> | null;
    if (!parsed || typeof parsed !== "object") return null;
    // Guard against stale/corrupt entries (e.g. missing name) from older versions
    if (!parsed.id || !parsed.role) return null;
    return {
      id: parsed.id,
      name: parsed.name ?? parsed.email ?? "User",
      email: parsed.email ?? "",
      role: parsed.role,
      school_id: parsed.school_id,
      school_name: parsed.school_name,
    };
  } catch {
    return null;
  }
}

interface AuthContextType {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  const login = useCallback((userData: AuthUser) => {
    setUser(userData);
    localStorage.setItem("modulearn_user", JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("modulearn_user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
