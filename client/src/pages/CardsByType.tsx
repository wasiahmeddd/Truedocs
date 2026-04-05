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
import { useCardTypes, useDeleteCardType } from "@/hooks/use-card-types";
import { useStorageMode } from "@/lib/storage-mode";

export default function CardsByType() {
  const [, params] = useRoute("/cards/:type");
  const type = params?.type || "";
  const { data: people, isLoading, error } = useCardsByType(type);

  // New Logic for Deletion - HOOKS MOVED UP
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);
  const { mode } = useStorageMode();
  const { data: cardTypes } = useCardTypes();

  const config = CARD_CONFIG[type] || { icon: FileText, label: type, desc: "", color: "text-primary bg-primary/10" };
  const Icon = config.icon;

  const currentType = cardTypes?.find(t => t.slug === type);

  const handleShareAll = async () => {
    if (!type) return;
    if (mode === "local") {
      toast({
        title: "Offline mode",
        description: "Type export is only available in server mode right now.",
      });
      return;
    }

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

  const deleteMutation = useDeleteCardType();

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
    <>
    <div className="hidden md:block min-h-screen bg-background p-4 md:p-8 max-w-5xl mx-auto">
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

    </div>

    {/* MOBILE UI */}
    <div className="md:hidden flex flex-col min-h-screen bg-slate-950 text-slate-100 antialiased font-sans pb-24">
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 transition-all duration-200">
        <div className="flex items-center gap-3">
          <Link href="/cards">
            <button className="text-slate-200 active:scale-95 transition-transform duration-200 hover:opacity-80 p-2 -ml-2">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <h1 className="font-bold tracking-[-0.02em] text-slate-100 text-base uppercase truncate max-w-[200px]">{config.label} Records</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-slate-200 p-2 rounded-lg active:bg-slate-800 transition-colors">
              <MoreVertical className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
            <DropdownMenuItem onClick={handleShareAll}>
               <Share2 className="mr-2 h-4 w-4" /> Share All
            </DropdownMenuItem>
            {currentType && (
              <DropdownMenuItem onClick={handleDeleteClick} className="text-red-400 focus:bg-red-400/10 focus:text-red-400">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Type
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="pt-24 px-4 space-y-6 flex-1">
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-medium tracking-[0.05em] uppercase text-cyan-400 px-1">{people?.reduce((acc, p) => acc + p.cards.length, 0)} Total Found</p>
          <GlobalAddCardDialog preselectedType={type} />
        </div>

        {!hasCards ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 mt-8">
            <FileText className="h-12 w-12 mx-auto text-slate-500 mb-4" />
            <h3 className="text-lg font-medium text-slate-300">No {config.label} found</h3>
            <p className="text-slate-500 text-xs mt-2 max-w-[200px] mx-auto">Go to a person's profile to add their {config.label}.</p>
            <Link href="/people" className="mt-6 flex justify-center">
               <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800 text-slate-200">Go to People</Button>
            </Link>
          </div>
        ) : (
           <div className="space-y-6">
             {people.map((person) => (
               <div key={person.id} className="bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-800">
                 <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-800/60">
                   <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
                     {person.name.charAt(0).toUpperCase()}
                   </div>
                   <Link href={`/people/${person.id}`}>
                     <h3 className="font-semibold text-base text-slate-200">{person.name}</h3>
                   </Link>
                 </div>
                 
                 <div className="flex flex-col gap-3">
                   {person.cards.map((card) => (
                     <CardItem key={card.id} card={card} />
                   ))}
                 </div>
               </div>
             ))}
           </div>
        )}
      </main>

      {/* KEEP THE COMMON ALERTS MOUNTED IN ROOT */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">Delete Card Type?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {deleteWarning || "Are you sure you want to delete this card type? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!currentType) return;
                deleteMutation.mutate(currentType.id, {
                  onSuccess: () => setLocation("/cards"),
                });
              }}
              className="bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-600/30"
            >
              {deleteWarning ? "Yes, Delete Everything" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </>
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
