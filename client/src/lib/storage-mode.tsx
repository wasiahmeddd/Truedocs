import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type StorageMode = "server" | "local";

type StorageModeContextValue = {
  mode: StorageMode;
  isReady: boolean;
};

const StorageModeContext = createContext<StorageModeContextValue | null>(null);

function hasCapacitorRuntime(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean((window as Window & { Capacitor?: unknown }).Capacitor);
}

export function StorageModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<StorageMode>(hasCapacitorRuntime() ? "local" : "server");
  const [isReady, setIsReady] = useState(hasCapacitorRuntime());

  useEffect(() => {
    if (hasCapacitorRuntime()) {
      setMode("local");
      setIsReady(true);
      return;
    }

    const controller = new AbortController();

    async function detectMode() {
      try {
        await fetch("/api/user", {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });
        setMode("server");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setMode("local");
      } finally {
        if (!controller.signal.aborted) {
          setIsReady(true);
        }
      }
    }

    detectMode();

    return () => controller.abort();
  }, []);

  const value = useMemo(
    () => ({
      mode,
      isReady,
    }),
    [isReady, mode],
  );

  return (
    <StorageModeContext.Provider value={value}>
      {children}
    </StorageModeContext.Provider>
  );
}

export function useStorageMode() {
  const context = useContext(StorageModeContext);
  if (!context) {
    throw new Error("useStorageMode must be used within a StorageModeProvider");
  }

  return context;
}
