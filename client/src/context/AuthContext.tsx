import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import bcrypt from "bcryptjs";
import type { User as SelectUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { deriveKey, generateSaltHex } from "@/lib/local-crypto";
import { localDb, ensureDefaultCardTypes } from "@/lib/local-db";
import { useStorageMode } from "@/lib/storage-mode";

type LoginData = Pick<SelectUser, "username" | "password">;
type AuthResult = { success: boolean; user: SelectUser | null };

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<AuthResult, Error, LoginData>;
  registerMutation: UseMutationResult<AuthResult, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  logout: () => void;
  isAuthenticated: boolean;
  encryptionKey: CryptoKey | null;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { mode, isReady } = useStorageMode();
  const [user, setUser] = useState<SelectUser | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    let cancelled = false;

    async function loadUser() {
      setIsLoading(true);
      setError(null);

      if (mode === "local") {
        setUser(null);
        setEncryptionKey(null);
        queryClient.setQueryData(["/api/user"], null);
        if (!cancelled) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await fetch("/api/user", { credentials: "include" });
        if (cancelled) {
          return;
        }

        if (res.status === 401) {
          setUser(null);
          queryClient.setQueryData(["/api/user"], null);
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to fetch user");
        }

        const nextUser = (await res.json()) as SelectUser;
        setUser(nextUser);
        queryClient.setQueryData(["/api/user"], nextUser);
      } catch (nextError) {
        if (!cancelled) {
          setUser(null);
          setError(nextError as Error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [isReady, mode]);

  const loginMutation = useMutation<AuthResult, Error, LoginData>({
    mutationFn: async (credentials) => {
      if (mode === "local") {
        const existingUser = await localDb.users.where("username").equals(credentials.username).first();
        if (!existingUser) {
          throw new Error("User not found");
        }

        if (existingUser.isBanned) {
          throw new Error("This account is banned");
        }

        const isValid = await bcrypt.compare(credentials.password, existingUser.password);
        if (!isValid) {
          throw new Error("Invalid password");
        }

        const nextKey = await deriveKey(credentials.password, existingUser.salt);
        const nextUser = {
          ...existingUser,
          lastActive: new Date(),
        } as SelectUser;

        if (existingUser.id) {
          await localDb.users.update(existingUser.id, { lastActive: nextUser.lastActive });
          await ensureDefaultCardTypes(existingUser.id);
        }

        setEncryptionKey(nextKey);
        setUser(nextUser);
        queryClient.clear();
        queryClient.setQueryData(["/api/user"], nextUser);
        return { success: true, user: nextUser };
      }

      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return res.json();
    },
    onSuccess: (data) => {
      if (mode === "server") {
        setUser(data.user);
        queryClient.setQueryData(["/api/user"], data.user);
      }

      toast({
        title: "Welcome back",
        description: "Vault unlocked successfully",
      });
    },
    onError: (nextError: Error) => {
      if (nextError.message.includes("User not found")) {
        return;
      }

      toast({
        title: "Login failed",
        description: nextError.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation<AuthResult, Error, LoginData>({
    mutationFn: async (credentials) => {
      if (mode === "local") {
        const existingUser = await localDb.users.where("username").equals(credentials.username).first();
        if (existingUser) {
          throw new Error("Username already exists");
        }

        const salt = generateSaltHex();
        const hashedPassword = await bcrypt.hash(credentials.password, 10);
        const createdAt = new Date();
        const userId = await localDb.users.add({
          username: credentials.username,
          password: hashedPassword,
          salt,
          isAdmin: false,
          isBanned: false,
          createdAt,
          lastActive: createdAt,
        });

        await ensureDefaultCardTypes(userId);

        const nextKey = await deriveKey(credentials.password, salt);
        const nextUser = {
          id: userId,
          username: credentials.username,
          password: hashedPassword,
          salt,
          isAdmin: false,
          isBanned: false,
          createdAt,
          lastActive: createdAt,
        } as SelectUser;

        setEncryptionKey(nextKey);
        setUser(nextUser);
        queryClient.clear();
        queryClient.setQueryData(["/api/user"], nextUser);
        return { success: true, user: nextUser };
      }

      const res = await apiRequest("POST", "/api/register", credentials);
      return res.json();
    },
    onSuccess: (data) => {
      if (mode === "server") {
        setUser(data.user);
        queryClient.setQueryData(["/api/user"], data.user);
      }

      toast({
        title: "Welcome aboard!",
        description: "Your secure vault has been created.",
      });
    },
    onError: (nextError: Error) => {
      toast({
        title: "Registration failed",
        description: nextError.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      if (mode === "local") {
        return;
      }

      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      setUser(null);
      setEncryptionKey(null);
      queryClient.clear();
      queryClient.setQueryData(["/api/user"], null);

      toast({
        title: "Logged out",
        description: "See you next time",
      });
    },
    onError: (nextError: Error) => {
      toast({
        title: "Logout failed",
        description: nextError.message,
        variant: "destructive",
      });
    },
  });

  const value = useMemo(
    () => ({
      user,
      isLoading: !isReady || isLoading,
      error,
      loginMutation,
      registerMutation,
      logoutMutation,
      logout: () => logoutMutation.mutate(),
      isAuthenticated: !!user,
      encryptionKey,
    }),
    [
      encryptionKey,
      error,
      isLoading,
      isReady,
      loginMutation,
      logoutMutation,
      registerMutation,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
