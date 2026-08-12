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
import type { AuthUser } from "@/types/entities";
import { isSuperAdmin as checkIsSuperAdmin } from "./super-admin";

export type { AuthUser };

export type LoginOutcome =
  | { mfaRequired: true; mfaToken: string; mfaSetupRequired?: boolean }
  | { mfaRequired: false };

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginOutcome>;
  verifyMfa: (mfaToken: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (...permissions: string[]) => boolean;
  isSuperAdmin: boolean;
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

  const login = async (email: string, password: string): Promise<LoginOutcome> => {
    try {
      const response = await apiClient.auth.login(email, password);
      const data = response.data;
      if (!data) {
        throw new Error("Empty login response");
      }
      if (data.mfaRequired) {
        return {
          mfaRequired: true,
          mfaToken: data.mfaToken,
          mfaSetupRequired: data.mfaSetupRequired,
        };
      }
      await fetchUser();
      router.push("/dashboard");
      return { mfaRequired: false };
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw new Error(error.message);
      }
      throw error;
    }
  };

  const verifyMfa = async (mfaToken: string, code: string) => {
    try {
      await apiClient.auth.mfa.verify(mfaToken, code);
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

  const isSuperAdmin = checkIsSuperAdmin(user);

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
        verifyMfa,
        logout,
        refetch,
        hasPermission,
        hasAnyPermission,
        isSuperAdmin,
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
