import Dexie from "dexie";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CryptoWallet } from "@shared/schema";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { localDb, type LocalWallet } from "@/lib/local-db";
import { decryptText, encryptText } from "@/lib/local-crypto";
import { useStorageMode } from "@/lib/storage-mode";
import { apiRequest } from "@/lib/queryClient";

const ACTIVE_WALLETS_QUERY_KEY = ["/api/wallets"] as const;
const DELETED_WALLETS_QUERY_KEY = ["/api/wallets/deleted"] as const;

async function mapLocalWallets(
  wallets: LocalWallet[],
  encryptionKey: CryptoKey,
): Promise<CryptoWallet[]> {
  return Promise.all(
    wallets.map(async (wallet) => ({
      id: wallet.id ?? 0,
      userId: wallet.userId,
      walletName: wallet.walletName,
      wordCount: wallet.wordCount,
      seedPhrase: await decryptText(wallet.encryptedSeedPhrase, wallet.iv, encryptionKey),
      createdAt: wallet.createdAt,
      deletedAt: wallet.deletedAt ?? null,
    })),
  );
}

export function useWallets(deleted = false) {
  const { mode } = useStorageMode();
  const { user, encryptionKey } = useAuth();

  return useQuery<CryptoWallet[]>({
    queryKey: deleted
      ? [...DELETED_WALLETS_QUERY_KEY, mode, user?.id]
      : [...ACTIVE_WALLETS_QUERY_KEY, mode, user?.id],
    enabled: mode === "server" || (!!user && !!encryptionKey),
    queryFn: async () => {
      if (mode === "local") {
        if (!user?.id || !encryptionKey) {
          return [];
        }

        const collection = deleted
          ? localDb.cryptoWallets
              .where("[userId+deletedAt]")
              .between([user.id, Dexie.minKey], [user.id, Dexie.maxKey])
              .filter((wallet) => wallet.deletedAt != null)
          : localDb.cryptoWallets
              .where("[userId+deletedAt]")
              .between([user.id, Dexie.minKey], [user.id, Dexie.maxKey])
              .filter((wallet) => wallet.deletedAt == null);

        const wallets = await collection.toArray();
        return mapLocalWallets(wallets, encryptionKey);
      }

      const res = await fetch(deleted ? "/api/wallets/deleted" : "/api/wallets", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch wallets");
      }
      return res.json();
    },
  });
}

export function useCreateWallet() {
  const { mode } = useStorageMode();
  const { user, encryptionKey } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { walletName: string; seedPhrase: string; wordCount: number }) => {
      if (mode === "local") {
        if (!user?.id || !encryptionKey) {
          throw new Error("Please unlock the vault first");
        }

        const { encryptedData, iv } = await encryptText(data.seedPhrase, encryptionKey);
        const id = await localDb.cryptoWallets.add({
          userId: user.id,
          walletName: data.walletName,
          wordCount: data.wordCount,
          encryptedSeedPhrase: encryptedData,
          iv,
          createdAt: new Date(),
          deletedAt: null,
        });

        return {
          id,
          userId: user.id,
          walletName: data.walletName,
          wordCount: data.wordCount,
          seedPhrase: data.seedPhrase,
          createdAt: new Date(),
          deletedAt: null,
        } as CryptoWallet;
      }

      const res = await apiRequest("POST", "/api/wallets", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVE_WALLETS_QUERY_KEY });
      toast({ title: "Wallet Protected", description: "Your seed phrase has been encrypted and stored." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteWallet() {
  const { mode } = useStorageMode();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      if (mode === "local") {
        await localDb.cryptoWallets.update(id, { deletedAt: new Date() });
        return;
      }

      await apiRequest("DELETE", `/api/wallets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVE_WALLETS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DELETED_WALLETS_QUERY_KEY });
    },
  });
}

export function useRestoreWallet() {
  const { mode } = useStorageMode();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      if (mode === "local") {
        await localDb.cryptoWallets.update(id, { deletedAt: null });
        return;
      }

      await apiRequest("POST", `/api/wallets/${id}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVE_WALLETS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DELETED_WALLETS_QUERY_KEY });
    },
  });
}

export function usePermanentDeleteWallet() {
  const { mode } = useStorageMode();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      if (mode === "local") {
        await localDb.cryptoWallets.delete(id);
        return;
      }

      await apiRequest("DELETE", `/api/wallets/${id}/permanent`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DELETED_WALLETS_QUERY_KEY });
    },
  });
}
