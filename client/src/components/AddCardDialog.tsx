import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCardSchema, type InsertCard } from "@shared/schema";
import { CARD_TYPES } from "@shared/routes";
import { useCreateCard } from "@/hooks/use-cards";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, FileBadge } from "lucide-react";
import { CARD_CONFIG } from "@/lib/card-config";

interface AddCardDialogProps {
  personId: number;
}

export function AddCardDialog({ personId }: AddCardDialogProps) {
  const [open, setOpen] = useState(false);
  const createCard = useCreateCard();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentName, setDocumentName] = useState("");

  const resetFormState = () => {
    form.reset({ personId, type: "aadhaar", filename: "placeholder" });
    setSelectedFile(null);
    setDocumentNumber("");
    setDocumentName("");
  };

  const form = useForm<InsertCard>({
    resolver: zodResolver(insertCardSchema.omit({ filename: true })), // Omit filename validation since handle it manually
    defaultValues: {
      personId,
      type: "aadhaar",
      // filename is optional in form, handled via state
      filename: "placeholder",
    },
  });

  const onSubmit = (data: InsertCard) => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("personId", data.personId.toString());
    formData.append("type", data.type);
    if (documentNumber.trim()) formData.append("documentNumber", documentNumber.trim());
    if (documentName.trim()) formData.append("documentName", documentName.trim());
    formData.append("file", selectedFile);

    createCard.mutate(formData as any, {
      onSuccess: () => {
        setOpen(false);
        resetFormState();
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetFormState();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-dashed">
          <Plus className="h-4 w-4" /> Add Card
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Card</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-auto p-3">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CARD_TYPES.map(type => {
                        const config = CARD_CONFIG[type] || { icon: FileBadge, label: type, desc: "", color: "text-primary" };
                        const Icon = config.icon;
                        return (
                          <SelectItem key={type} value={type} className="cursor-pointer py-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${config.color}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="font-semibold">{config.label}</span>
                                <span className="text-xs text-muted-foreground">{config.desc}</span>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Card Number <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
              <Input
                placeholder="e.g. 1234 5678 9012"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
              />
            </FormItem>

            <FormItem>
              <FormLabel>Name on Card <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
              <Input
                placeholder="e.g. Wasi Ahmed"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
              />
            </FormItem>

            <FormItem>
              <FormLabel>Upload File</FormLabel>
              <div className="border-2 border-dashed rounded-lg p-6 hover:bg-accent/5 transition-colors text-center cursor-pointer relative">
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept=".pdf,image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  {selectedFile ? (
                    <div className="text-primary font-medium flex items-center gap-2">
                      <FileBadge className="w-4 h-4" />
                      {selectedFile.name}
                    </div>
                  ) : (
                    <>
                      <Plus className="w-8 h-8 opacity-50" />
                      <span className="text-sm">Click to browse or drag file here</span>
                      <span className="text-xs opacity-50">(PDF or Images)</span>
                    </>
                  )}
                </div>
              </div>
            </FormItem>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={createCard.isPending || !selectedFile} className="w-full">
                {createCard.isPending ? "Encrypting & Uploading..." : "Securely Add Card"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
