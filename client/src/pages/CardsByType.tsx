import { useRoute, Link } from "wouter";
import { useCardsByType } from "@/hooks/use-cards";
import { shareContent } from "@/lib/share-util";
import { CardItem } from "@/components/CardItem";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, FileText, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { GlobalAddCardDialog } from "@/components/GlobalAddCardDialog";
import { CARD_CONFIG } from "@/lib/card-config";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2 } from "lucide-react";

export default function CardsByType() {
  const [, params] = useRoute("/cards/:type");
  const type = params?.type || "";
  const { data: people, isLoading, error } = useCardsByType(type);

  // New Logic for Deletion - HOOKS MOVED UP
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);

  const { data: cardTypes } = useQuery<any[]>({
    queryKey: ['cardTypes'],
    queryFn: async () => {
      const res = await fetch('/api/card-types');
      if (!res.ok) throw new Error('Failed to fetch types');
      return res.json();
    }
  });

  const config = CARD_CONFIG[type] || { icon: FileText, label: type, desc: "", color: "text-primary bg-primary/10" };
  const Icon = config.icon;

  const currentType = cardTypes?.find(t => t.slug === type);

  const handleShareAll = async () => {
    if (!type) return;
    const result = await shareContent(
      `/api/cards/type/${type}/export`,
      `${type}_cards.zip`,
      "Export Cards",
      `Sharing all ${type} records`
    );
    if (result.status === "copied") {
      toast({ title: "Link copied", description: "Share link copied to clipboard." });
    } else if (result.status === "unsupported") {
      toast({
        title: "Sharing not available",
        description: "Native sharing on mobile requires HTTPS. Open the app over https:// and try again.",
        variant: "destructive",
      });
    } else if (result.status === "error") {
      toast({
        title: "Share failed",
        description: "Unable to open the share sheet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!currentType) return;
      await fetch(`/api/card-types/${currentType.id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Card type removed successfully." });
      setLocation('/cards');
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete card type.", variant: "destructive" });
    }
  });

  const handleDeleteClick = () => {
    if (people && people.length > 0) {
      const totalCards = people.reduce((acc, p) => acc + p.cards.length, 0);
      setDeleteWarning(`CRITICAL WARNING: There are ${totalCards} cards of this type. Deleting this type will hide these cards from view. Are you sure?`);
    } else {
      setDeleteWarning(null);
    }
    setShowDeleteAlert(true);
  };

  if (isLoading) return <CardsSkeleton />;
  if (error) return <div className="p-8 text-center text-destructive">Failed to load cards.</div>;

  // Flatten the data to list cards but grouped by person context visually
  const hasCards = people && people.length > 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/cards">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight capitalize flex flex-wrap items-center gap-3">
              <div className={`p-2 rounded-lg ${config.color} shrink-0`}>
                <Icon className="h-6 w-6" />
              </div>
              <span className="truncate max-w-[200px] md:max-w-none">{config.label} Records</span>
              <Badge variant="secondary" className="text-sm md:text-base px-2 md:px-3 py-1 font-normal whitespace-nowrap">
                {people?.reduce((acc, p) => acc + p.cards.length, 0)} Total
              </Badge>
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <Button variant="outline" onClick={handleShareAll} className="gap-2 flex-grow md:flex-grow-0 hidden md:flex">
            <Share2 className="h-4 w-4" />
            Share All
          </Button>

          {/* Mobile/Compact Menu */}
          <div className="flex gap-2 w-full md:w-auto">
            <div className="flex-grow">
              <GlobalAddCardDialog preselectedType={type} />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleShareAll}>
                  <Share2 className="mr-2 h-4 w-4" /> Share All
                </DropdownMenuItem>
                {currentType && (
                  <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Type
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {!hasCards ? (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-muted-foreground/20">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No {config.label} found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2">
            Go to a person's profile to add their {config.label}.
          </p>
          <Link href="/people" className="mt-6 inline-block">
            <Button>Go to People</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {people.map((person) => (
            <div
              key={person.id}
              className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/40">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                  {person.name.charAt(0).toUpperCase()}
                </div>
                <Link href={`/people/${person.id}`} className="hover:underline decoration-primary decoration-2 underline-offset-4">
                  <h3 className="font-semibold text-lg">{person.name}</h3>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {person.cards.map((card) => (
                  <CardItem key={card.id} card={card} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Card Type?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteWarning || "Are you sure you want to delete this card type? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteWarning ? "Yes, Delete Everything" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className="min-h-screen bg-background p-8 max-w-5xl mx-auto space-y-8">
      <Skeleton className="h-10 w-64" />
      {[1, 2].map((i) => (
        <div key={i} className="border rounded-2xl p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
