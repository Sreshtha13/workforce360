"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "./api-client";

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: { id: string; name: string; code?: string }[];
  permissions: string[];
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (...permissions: string[]) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = async () => {
    try {
      const response = await apiClient.auth.getMe();
      setUser(response?.data ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await apiClient.auth.login(email, password);
      await fetchUser();
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw new Error(error.message);
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.auth.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  const hasPermission = (permission: string) =>
    user?.permissions.includes(permission) ?? false;

  const hasAnyPermission = (...permissions: string[]) =>
    permissions.some((p) => hasPermission(p));

  const refetch = async () => {
    setLoading(true);
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refetch,
        hasPermission,
        hasAnyPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
