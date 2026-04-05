import { Card as CardType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Trash2, ExternalLink, Info, Copy, Check } from "lucide-react";
import { useDeleteCard } from "@/hooks/use-cards";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { useState } from "react";

import { useLocation } from "wouter";

import { CARD_CONFIG } from "@/lib/card-config";

interface CardItemProps {
  card: CardType;
}

export function CardItem({ card }: CardItemProps) {
  const deleteCard = useDeleteCard();
  const [, setLocation] = useLocation();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = (value: string, field: string) => {
    if (!value || value === "N/A") return;
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast({
      title: "Copied!",
      description: `${field} copied to clipboard.`,
      duration: 2000,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleOpenPdf = () => {
    setLocation(`/view/${card.id}`);
  };

  const config = CARD_CONFIG[card.type] || {
    icon: FileText,
    label: card.type,
    desc: "",
    color: "text-primary bg-primary/10"
  };
  const Icon = config.icon;

  const hasMetadata = !!(card.documentNumber || card.documentName);

  return (
    <Card className="group overflow-hidden border-l-4 border-l-primary transition-all duration-300 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0 ${config.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold capitalize text-foreground truncate">
                  {card.title || config.label}
                </span>
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider shrink-0">{card.filename.split('.').pop()}</Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                {card.title ? config.label : card.filename}
              </p>
            </div>
          </div>

          {/* Desktop Actions (Hover) */}
          <div className="hidden md:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setShowMetadataDialog(true)} title="View Metadata">
              <Info className="h-4 w-4 text-primary" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleOpenPdf} title="View PDF">
              <ExternalLink className="h-4 w-4 text-primary" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={deleteCard.isPending}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Delete Card"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Card</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this card? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteCard.mutate({ id: card.id, personId: card.personId })}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Mobile Actions (Dropdown) */}
          <div className="md:hidden shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowMetadataDialog(true)}>
                  <Info className="mr-2 h-4 w-4 text-primary" />
                  Metadata
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenPdf}>
                  <ExternalLink className="mr-2 h-4 w-4 text-primary" />
                  Open PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={(e) => {
                    e.preventDefault();
                    setShowDeleteAlert(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Card</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this card? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteCard.mutate({ id: card.id, personId: card.personId })}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Quick-Copy Metadata Row — shown directly on card face */}
        {hasMetadata && (
          <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-2">
            {card.documentNumber && (
              <button
                type="button"
                onClick={() => handleCopy(card.documentNumber ?? "", "Card Number")}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 active:scale-95 transition-all text-xs text-blue-500 dark:text-blue-400 font-mono tracking-wide group/copy"
              >
                {copiedField === "Card Number" ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3 opacity-60 group-hover/copy:opacity-100" />
                )}
                <span className="truncate max-w-[160px]">{card.documentNumber}</span>
              </button>
            )}
            {card.documentName && (
              <button
                type="button"
                onClick={() => handleCopy(card.documentName ?? "", "Name on Card")}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 transition-all text-xs text-emerald-500 dark:text-emerald-400 group/copy"
              >
                {copiedField === "Name on Card" ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3 opacity-60 group-hover/copy:opacity-100" />
                )}
                <span className="truncate max-w-[140px]">{card.documentName}</span>
              </button>
            )}
          </div>
        )}

        {/* Metadata Dialog */}
        <Dialog open={showMetadataDialog} onOpenChange={setShowMetadataDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Document Metadata</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {[
                { label: "Title", value: card.title || "N/A" },
                { label: "Type", value: card.type },
                { label: "Card Number", value: card.documentNumber || "N/A" },
                { label: "Name on Card", value: card.documentName || "N/A" },
                { label: "Filename", value: card.filename },
                { label: "Original Name", value: card.originalName || "N/A" },
                { label: "Card ID", value: card.id.toString() },
                { label: "Person ID", value: card.personId.toString() },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 p-2 rounded-md bg-muted/50">
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-semibold text-muted-foreground">{item.label}</span>
                    <span className="text-sm truncate" title={item.value}>{item.value}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleCopy(item.value, item.label)}
                    disabled={item.value === "N/A"}
                    title={`Copy ${item.label}`}
                  >
                    {copiedField === item.label ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card >
  );
}
