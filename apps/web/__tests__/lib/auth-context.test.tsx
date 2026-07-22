import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { apiClient, ApiClientError } from "@/lib/api-client";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    auth: {
      getMe: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
    },
  },
  ApiClientError: class ApiClientError extends Error {
    constructor(
      message: string,
      public readonly status: number,
      public readonly code?: string,
    ) {
      super(message);
      this.name = "ApiClientError";
    }
  },
}));

const mockUser = {
  id: "user-1",
  email: "user@example.com",
  firstName: "Jane",
  lastName: "Doe",
  roles: [{ id: "role-1", name: "Admin" }],
  permissions: ["user.read", "user.create"],
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthProvider / useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.auth.getMe).mockResolvedValue({ data: mockUser, error: null, meta: null });
  });

  it("loads user on mount", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it("sets user to null when getMe returns null", async () => {
    vi.mocked(apiClient.auth.getMe).mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  it("login calls API, refetches user, and navigates to dashboard", async () => {
    vi.mocked(apiClient.auth.login).mockResolvedValue({
      data: { user: mockUser },
      error: null,
      meta: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login("user@example.com", "password");
    });

    expect(apiClient.auth.login).toHaveBeenCalledWith("user@example.com", "password");
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("login rethrows ApiClientError message", async () => {
    vi.mocked(apiClient.auth.login).mockRejectedValue(
      new ApiClientError("Invalid credentials", 401, "UNAUTHORIZED"),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(async () => {
        await result.current.login("user@example.com", "wrong");
      }),
    ).rejects.toThrow("Invalid credentials");
  });

  it("logout clears user and navigates to login even when API fails", async () => {
    vi.mocked(apiClient.auth.logout).mockRejectedValue(new Error("Network error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(mockPush).toHaveBeenCalledWith("/login");

    consoleSpy.mockRestore();
  });

  it("hasPermission returns false when user is null", async () => {
    vi.mocked(apiClient.auth.getMe).mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.hasPermission("user.read")).toBe(false);
  });

  it("hasPermission checks user permissions", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.hasPermission("user.read")).toBe(true);
    expect(result.current.hasPermission("user.delete")).toBe(false);
  });

  it("hasAnyPermission checks multiple permissions", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.hasAnyPermission("user.delete", "user.create")).toBe(true);
    expect(result.current.hasAnyPermission("user.delete", "role.delete")).toBe(false);
  });

  it("useAuth throws outside AuthProvider", () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth must be used within an AuthProvider",
    );
  });
});
