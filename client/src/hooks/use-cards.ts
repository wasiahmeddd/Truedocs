import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type Card, type InsertCard } from "@shared/schema";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { localDb } from "@/lib/local-db";
import { encryptBlob } from "@/lib/local-crypto";
import { useStorageMode } from "@/lib/storage-mode";

async function getLocalPeopleWithType(userId: number, type: string) {
  const people = await localDb.people.where("userId").equals(userId).toArray();
  const personIds = people.map((person) => person.id).filter((id): id is number => id != null);

  if (personIds.length === 0) {
    return [];
  }

  const cards = await localDb.cards.where("personId").anyOf(personIds).toArray();
  return people
    .map((person) => ({
      ...person,
      cards: cards
        .filter((card) => card.personId === person.id && card.type === type)
        .map((card) => ({
          ...card,
          id: card.id ?? 0,
          originalName: card.originalName ?? null,
          title: card.title ?? null,
          documentNumber: card.documentNumber ?? null,
          documentName: card.documentName ?? null,
        })) as Card[],
    }))
    .filter((person) => person.cards.length > 0);
}

export function useCardsByType(type: string) {
  const { mode } = useStorageMode();
  const { user } = useAuth();

  return useQuery({
    queryKey: [api.cards.listByType.path, type, mode, user?.id],
    enabled: !!type && (mode === "server" || !!user),
    queryFn: async () => {
      if (mode === "local") {
        if (!user?.id) {
          return [];
        }

        return getLocalPeopleWithType(user.id, type);
      }

      const url = buildUrl(api.cards.listByType.path, { type });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch cards");
      }
      return api.cards.listByType.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { mode } = useStorageMode();
  const { user, encryptionKey } = useAuth();

  return useMutation({
    mutationFn: async (data: InsertCard | FormData) => {
      if (mode === "local") {
        if (!user?.id || !encryptionKey) {
          throw new Error("Please unlock the vault first");
        }
        if (!(data instanceof FormData)) {
          throw new Error("Offline uploads require a file");
        }

        const personId = Number(data.get("personId"));
        const type = String(data.get("type") || "");
        const file = data.get("file");

        if (!personId || !type || !(file instanceof File)) {
          throw new Error("Invalid upload data");
        }

        const person = await localDb.people.get(personId);
        if (!person || person.userId !== user.id) {
          throw new Error("Person not found");
        }

        const encryptedFile = await encryptBlob(file, encryptionKey);
        const filename = `${crypto.randomUUID()}.local`;

        const cardId = await localDb.transaction("rw", localDb.cards, localDb.files, async () => {
          const nextCardId = await localDb.cards.add({
            personId,
            type,
            title: (data.get("title") as string | null) || undefined,
            filename,
            originalName: file.name,
            documentNumber: (data.get("documentNumber") as string | null) || undefined,
            documentName: (data.get("documentName") as string | null) || undefined,
          });

          await localDb.files.add({
            cardId: nextCardId,
            originalName: file.name,
            mimeType: encryptedFile.mimeType,
            size: encryptedFile.size,
            encryptedData: encryptedFile.encryptedData,
            iv: encryptedFile.iv,
          });

          return nextCardId;
        });

        const createdCard = await localDb.cards.get(cardId);
        if (!createdCard) {
          throw new Error("Failed to store card");
        }

        return {
          ...createdCard,
          id: createdCard.id ?? 0,
          originalName: createdCard.originalName ?? null,
          title: createdCard.title ?? null,
          documentNumber: createdCard.documentNumber ?? null,
          documentName: createdCard.documentName ?? null,
        };
      }

      const isFormData = data instanceof FormData;
      const headers: Record<string, string> = {};
      if (!isFormData) {
        headers["Content-Type"] = "application/json";
      }

      const res = await fetch(api.cards.create.path, {
        method: api.cards.create.method,
        headers,
        credentials: "include",
        body: isFormData ? data : JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to add card");
      }
      return api.cards.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      const personId = variables instanceof FormData
        ? Number(variables.get("personId"))
        : variables.personId;

      queryClient.invalidateQueries({ queryKey: [api.people.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.people.get.path, personId] });
      queryClient.invalidateQueries({ queryKey: [api.cards.listByType.path] });
      toast({ title: "Success", description: "Card added successfully" });
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

export function useDeleteCard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { mode } = useStorageMode();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, personId }: { id: number; personId: number }) => {
      if (mode === "local") {
        if (!user?.id) {
          throw new Error("Please unlock the vault first");
        }

        const person = await localDb.people.get(personId);
        const card = await localDb.cards.get(id);
        if (!person || person.userId !== user.id || !card) {
          throw new Error("Card not found");
        }

        await localDb.transaction("rw", localDb.cards, localDb.files, async () => {
          await localDb.files.where("cardId").equals(id).delete();
          await localDb.cards.delete(id);
        });

        return { personId };
      }

      const url = buildUrl(api.cards.delete.path, { id });
      const res = await fetch(url, {
        method: api.cards.delete.method,
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to delete card");
      }
      return { personId };
    },
    onSuccess: ({ personId }) => {
      queryClient.invalidateQueries({ queryKey: [api.people.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.people.get.path, personId] });
      queryClient.invalidateQueries({ queryKey: [api.cards.listByType.path] });
      toast({ title: "Deleted", description: "Card removed successfully" });
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
