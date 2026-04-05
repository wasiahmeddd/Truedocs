import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCardSchema, type InsertCard } from "@shared/schema";
// import { CARD_TYPES } from "@shared/routes"; // Unused now
import { useCreateCard } from "@/hooks/use-cards";
import { usePeople } from "@/hooks/use-people";
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
import { Plus, FileBadge, Lock, CheckCircle } from "lucide-react";
// import { CARD_CONFIG } from "@/lib/card-config"; // Unused now
import { getIcon } from "@/lib/icon-map"; // Added
import { motion } from "framer-motion";
import { useCardTypes } from "@/hooks/use-card-types";

interface GlobalAddCardDialogProps {
    preselectedType?: string;
}

export function GlobalAddCardDialog({ preselectedType }: GlobalAddCardDialogProps) {
    const [open, setOpen] = useState(false);
    const [uploadStep, setUploadStep] = useState<'idle' | 'encrypting' | 'uploading' | 'success'>('idle');
    const createCard = useCreateCard();
    const { data: people } = usePeople();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [documentNumber, setDocumentNumber] = useState("");
    const [documentName, setDocumentName] = useState("");

    const { data: cardTypes } = useCardTypes();

    const form = useForm<InsertCard>({
        resolver: zodResolver(insertCardSchema.omit({ filename: true })),
        defaultValues: {
            personId: 0,
            type: preselectedType || "aadhaar",
            filename: "placeholder",
        },
    });

    const resetFormState = () => {
        setUploadStep('idle');
        form.reset({ personId: 0, type: preselectedType || "aadhaar", filename: "placeholder" });
        setSelectedFile(null);
        setDocumentNumber("");
        setDocumentName("");
    };

    const onSubmit = async (data: InsertCard) => {
        if (!selectedFile || !data.personId) return;

        // Start "Encryption" Phase
        setUploadStep('encrypting');

        // Simulate client-side encryption time (1.5s)
        await new Promise(resolve => setTimeout(resolve, 1500));

        setUploadStep('uploading');

        const formData = new FormData();
        formData.append("personId", data.personId.toString());
        formData.append("type", data.type);
        if (data.title) formData.append("title", data.title);
        if (documentNumber.trim()) formData.append("documentNumber", documentNumber.trim());
        if (documentName.trim()) formData.append("documentName", documentName.trim());
        formData.append("file", selectedFile);

        createCard.mutate(formData as any, {
            onSuccess: () => {
                setUploadStep('success');
                setTimeout(() => {
                    setOpen(false);
                    resetFormState();
                }, 1000);
            },
            onError: () => {
                setUploadStep('idle');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => {
            if (!v && uploadStep !== 'idle') return; // Prevent closing during upload
            setOpen(v);
            if (!v) {
                resetFormState();
            }
        }}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20">
                    <Plus className="h-4 w-4" /> Add {preselectedType ? "Card" : "New Card"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>
                        {uploadStep === 'idle' ? "Add New Document" :
                            uploadStep === 'encrypting' ? "Encrypting on Device" :
                                uploadStep === 'uploading' ? "Secure Upload" : "Success"}
                    </DialogTitle>
                </DialogHeader>

                {uploadStep !== 'idle' ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-6">
                        {uploadStep === 'encrypting' && (
                            <div className="relative">
                                <motion.div
                                    initial={{ scale: 1.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500"
                                >
                                    <Lock className="w-10 h-10" />
                                </motion.div>
                                <motion.div
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1.5, ease: "easeInOut" }}
                                    className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"
                                />
                            </div>
                        )}

                        {uploadStep === 'uploading' && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="w-full max-w-[80%] space-y-2"
                            >
                                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 1 }}
                                        className="h-full bg-blue-500"
                                    />
                                </div>
                                <p className="text-center text-sm text-slate-500">Sending encrypted data...</p>
                            </motion.div>
                        )}

                        {uploadStep === 'success' && (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center text-green-600"
                            >
                                <CheckCircle className="w-10 h-10" />
                            </motion.div>
                        )}

                        <p className="text-center text-slate-600 font-medium">
                            {uploadStep === 'encrypting' && "Locking with your personal key..."}
                            {uploadStep === 'uploading' && "Uploading to Secure Vault..."}
                            {uploadStep === 'success' && "Document Secured!"}
                        </p>
                    </div>
                ) : (
                    <Form {...form}>
                        {/* Existing Form Content */}
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                            <FormField
                                control={form.control}
                                name="personId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Select Person</FormLabel>
                                        <Select
                                            onValueChange={(val) => field.onChange(parseInt(val))}
                                            defaultValue={field.value ? field.value.toString() : undefined}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a person" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {people?.map(person => (
                                                    <SelectItem key={person.id} value={person.id.toString()}>
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] uppercase font-bold text-primary">
                                                                {person.name.charAt(0)}
                                                            </span>
                                                            {person.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Card Title (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. SSLC, Diploma" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {!preselectedType && (
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
                                                    <div className="max-h-[300px] overflow-y-auto">
                                                        {cardTypes?.map(type => {
                                                            const Icon = getIcon(type.icon);
                                                            return (
                                                                <SelectItem key={type.slug} value={type.slug} className="cursor-pointer py-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`p-2 rounded-lg ${type.color}`}>
                                                                            <Icon className="h-5 w-5" />
                                                                        </div>
                                                                        <div className="flex flex-col text-left">
                                                                            <span className="font-semibold">{type.label}</span>
                                                                            <span className="text-xs text-muted-foreground">{type.description}</span>
                                                                        </div>
                                                                    </div>
                                                                </SelectItem>
                                                            );
                                                        })}
                                                    </div>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

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
                                <Button type="submit" disabled={createCard.isPending || !selectedFile || !form.getValues('personId')} className="w-full bg-emerald-600 hover:bg-emerald-700">
                                    Securely Add Card
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
