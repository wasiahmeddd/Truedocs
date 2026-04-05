import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type Card, type InsertPerson, type PersonWithCards } from "@shared/schema";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { localDb } from "@/lib/local-db";
import { useStorageMode } from "@/lib/storage-mode";

async function getLocalPeopleWithCards(userId: number): Promise<PersonWithCards[]> {
  const people = await localDb.people.where("userId").equals(userId).toArray();
  const personIds = people.map((person) => person.id).filter((id): id is number => id != null);
  const cards = personIds.length === 0
    ? []
    : await localDb.cards.where("personId").anyOf(personIds).toArray();

  return people.map((person) => ({
    ...person,
    cards: cards
      .filter((card) => card.personId === person.id)
      .map((card) => ({
        ...card,
        id: card.id ?? 0,
        originalName: card.originalName ?? null,
        title: card.title ?? null,
        documentNumber: card.documentNumber ?? null,
        documentName: card.documentName ?? null,
      })) as Card[],
  })) as PersonWithCards[];
}

export function usePeople() {
  const { mode } = useStorageMode();
  const { user } = useAuth();

  return useQuery<PersonWithCards[]>({
    queryKey: [api.people.list.path, mode, user?.id],
    enabled: mode === "server" || !!user,
    queryFn: async () => {
      if (mode === "local") {
        if (!user?.id) {
          return [];
        }
        return getLocalPeopleWithCards(user.id);
      }

      const res = await fetch(api.people.list.path, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch people");
      }
      return api.people.list.responses[200].parse(await res.json());
    },
  });
}

export function usePerson(id: number) {
  const { mode } = useStorageMode();
  const { user } = useAuth();

  return useQuery<PersonWithCards | null>({
    queryKey: [api.people.get.path, id, mode, user?.id],
    enabled: !!id && (mode === "server" || !!user),
    queryFn: async () => {
      if (mode === "local") {
        if (!user?.id) {
          return null;
        }

        const person = await localDb.people.get(id);
        if (!person || person.userId !== user.id) {
          return null;
        }

        const cards = await localDb.cards.where("personId").equals(id).toArray();
        return {
          ...person,
          cards: cards.map((card) => ({
            ...card,
            id: card.id ?? 0,
            originalName: card.originalName ?? null,
            title: card.title ?? null,
            documentNumber: card.documentNumber ?? null,
            documentName: card.documentName ?? null,
          })) as Card[],
        } as PersonWithCards;
      }

      const url = buildUrl(api.people.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) {
        return null;
      }
      if (!res.ok) {
        throw new Error("Failed to fetch person");
      }
      return api.people.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreatePerson() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { mode } = useStorageMode();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: InsertPerson) => {
      if (mode === "local") {
        if (!user?.id) {
          throw new Error("Please unlock the vault first");
        }

        const id = await localDb.people.add({
          ...data,
          userId: user.id,
        });

        return {
          id,
          ...data,
          userId: user.id,
        };
      }

      const res = await fetch(api.people.create.path, {
        method: api.people.create.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const nextError = await res.json();
          throw new Error(nextError.message || "Validation failed");
        }
        throw new Error("Failed to create person");
      }
      return api.people.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.people.list.path] });
      toast({ title: "Success", description: "Person added successfully" });
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

export function useUpdatePerson() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { mode } = useStorageMode();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertPerson }) => {
      if (mode === "local") {
        if (!user?.id) {
          throw new Error("Please unlock the vault first");
        }

        const existing = await localDb.people.get(id);
        if (!existing || existing.userId !== user.id) {
          throw new Error("Person not found");
        }

        await localDb.people.update(id, { name: data.name });
        return {
          ...existing,
          ...data,
          id,
        };
      }

      const url = buildUrl(api.people.update.path, { id });
      const res = await fetch(url, {
        method: api.people.update.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to update person");
      }
      return api.people.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.people.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.people.get.path, data.id] });
      toast({ title: "Updated", description: "Person updated successfully" });
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

export function useDeletePerson() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { mode } = useStorageMode();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: number) => {
      if (mode === "local") {
        if (!user?.id) {
          throw new Error("Please unlock the vault first");
        }

        const existing = await localDb.people.get(id);
        if (!existing || existing.userId !== user.id) {
          throw new Error("Person not found");
        }

        await localDb.transaction("rw", localDb.people, localDb.cards, localDb.files, async () => {
          const cards = await localDb.cards.where("personId").equals(id).toArray();
          const cardIds = cards.map((card) => card.id).filter((cardId): cardId is number => cardId != null);
          if (cardIds.length > 0) {
            await localDb.files.where("cardId").anyOf(cardIds).delete();
          }
          await localDb.cards.where("personId").equals(id).delete();
          await localDb.people.delete(id);
        });
        return;
      }

      const url = buildUrl(api.people.delete.path, { id });
      const res = await fetch(url, {
        method: api.people.delete.method,
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to delete person");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.people.list.path] });
      toast({ title: "Deleted", description: "Person removed successfully" });
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
