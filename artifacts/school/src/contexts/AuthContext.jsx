import { createContext, useContext, useState, ReactNode } from "react";
import { useLogin } from "@workspace/api-client-react";
import { useLocation } from "wouter";

const AuthContext = createContext(undefined);

const STORAGE_KEY = "school_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const loginMutation = useLogin();

  const login = async (rut, password) => {
    setIsLoading(true);
    try {
      const response = await loginMutation.mutateAsync({ data: { rut, password } });
      setUser(response.user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(response.user));
    } finally {
      setIsLoading(false);
    }
  };

  const loginAs = (u) => {
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginAs, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
