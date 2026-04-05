import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CustomCardType, InsertCustomCardType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { localDb, ensureDefaultCardTypes } from "@/lib/local-db";
import { useStorageMode } from "@/lib/storage-mode";
import { useAuth } from "@/context/AuthContext";

const CARD_TYPES_QUERY_KEY = ["cardTypes"] as const;

export function useCardTypes() {
  const { mode } = useStorageMode();
  const { user } = useAuth();

  return useQuery<CustomCardType[]>({
    queryKey: [...CARD_TYPES_QUERY_KEY, mode, user?.id],
    enabled: mode === "server" || !!user,
    queryFn: async () => {
      if (mode === "local") {
        if (!user?.id) {
          return [];
        }

        await ensureDefaultCardTypes(user.id);
        const types = await localDb.cardTypes.where("userId").equals(user.id).toArray();
        return types as CustomCardType[];
      }

      const res = await fetch("/api/card-types", { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch types");
      }
      return res.json();
    },
  });
}

export function useCreateCardType() {
  const { mode } = useStorageMode();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: InsertCustomCardType) => {
      if (mode === "local") {
        if (!user?.id) {
          throw new Error("Please unlock the vault first");
        }

        await ensureDefaultCardTypes(user.id);
        const existing = await localDb.cardTypes
          .where("[userId+slug]")
          .equals([user.id, values.slug])
          .first();

        if (existing) {
          throw new Error("Type already exists");
        }

        const id = await localDb.cardTypes.add({
          ...values,
          userId: user.id,
        });

        return {
          id,
          ...values,
          userId: user.id,
        } as CustomCardType;
      }

      const res = await fetch("/api/card-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create type");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CARD_TYPES_QUERY_KEY });
      toast({ title: "Success", description: "Card type created" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCardType() {
  const { mode } = useStorageMode();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      if (mode === "local") {
        await localDb.cardTypes.delete(id);
        return;
      }

      const res = await fetch(`/api/card-types/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to delete type");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CARD_TYPES_QUERY_KEY });
      toast({ title: "Deleted", description: "Card type removed successfully." });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
