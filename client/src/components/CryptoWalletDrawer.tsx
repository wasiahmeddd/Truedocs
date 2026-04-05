import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Plus, Wallet, Trash2, Eye, EyeOff, Key, ShieldCheck, Copy, Check, RotateCcw, AlertTriangle, MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { BIP39_WORDS } from "@/lib/bip39Dict";
import type { CryptoWallet } from "@shared/schema";
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
import {
    useCreateWallet,
    useDeleteWallet,
    usePermanentDeleteWallet,
    useRestoreWallet,
    useWallets,
} from "@/hooks/use-wallets";

export function CryptoWalletDrawer({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<"list" | "create">("list");

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                        Crypto Vault
                    </SheetTitle>
                    <SheetDescription>
                        Securely store your seed phrases using military-grade encryption.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6">
                    <AnimatePresence mode="wait">
                        {view === "list" ? (
                            <WalletManager key="list" onViewChange={setView} />
                        ) : (
                            <CreateWalletForm key="create" onCancel={() => setView("list")} onSuccess={() => setView("list")} />
                        )}
                    </AnimatePresence>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function WalletManager({ onViewChange }: { onViewChange: (v: "list" | "create") => void }) {
    const { data: deletedWallets } = useWallets(true);
    const [showExpirationAlert, setShowExpirationAlert] = useState(false);
    const [expiringWallet, setExpiringWallet] = useState<CryptoWallet | null>(null);

    useEffect(() => {
        if (deletedWallets) {
            const now = new Date();
            const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

            const expiring = deletedWallets.find(w => {
                if (!w.deletedAt) return false;
                return new Date(w.deletedAt) < thirtyDaysAgo;
            });

            if (expiring) {
                setExpiringWallet(expiring);
                setShowExpirationAlert(true);
            }
        }
    }, [deletedWallets]);

    return (
        <>
            <Tabs defaultValue="active" className="w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 sm:gap-0">
                    <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex">
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="trash" className="gap-2">
                            <Trash2 className="w-4 h-4" /> Bin
                        </TabsTrigger>
                    </TabsList>
                    <Button onClick={() => onViewChange("create")} size="sm" className="w-full sm:w-auto gap-2">
                        <Plus className="w-4 h-4" /> Add Wallet
                    </Button>
                </div>

                <TabsContent value="active" className="mt-0">
                    <ActiveWalletList />
                </TabsContent>

                <TabsContent value="trash" className="mt-0">
                    <RecycleBinList />
                </TabsContent>
            </Tabs>

            <AlertDialog open={showExpirationAlert} onOpenChange={setShowExpirationAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" /> Wallet Expiring
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            The wallet "{expiringWallet?.walletName}" has been in the recycle bin for over 30 days.
                            Do you want to restore it or permanently delete it?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <div className="flex w-full justify-between sm:justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowExpirationAlert(false)}>Decide Later</Button>
                            <Button variant="default" onClick={() => {
                                // Trigger restore logic here? 
                                // Ideally we would reuse the mutation but context is tricky.
                                // For now let's just close and let user handle it in UI
                                setShowExpirationAlert(false);
                                // Switch tab to trash maybe?
                            }}>Go to Recycle Bin</Button>
                        </div>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function ActiveWalletList() {
    const { data: wallets, isLoading } = useWallets(false);
    const deleteMutation = useDeleteWallet();

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            {wallets?.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed rounded-xl space-y-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <p className="text-muted-foreground">No active wallets.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {wallets?.map(wallet => (
                        <WalletItem
                            key={wallet.id}
                            wallet={wallet}
                            onDelete={() => deleteMutation.mutate(wallet.id)}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
}

function RecycleBinList() {
    const { data: wallets, isLoading } = useWallets(true);

    // State for tracking which wallet is being permanently deleted
    const [walletToDelete, setWalletToDelete] = useState<number | null>(null);

    const restoreMutation = useRestoreWallet();
    const permanentDeleteMutation = usePermanentDeleteWallet();

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
            >
                {wallets?.length === 0 ? (
                    <div className="text-center p-8 border-2 border-dashed rounded-xl space-y-4">
                        <p className="text-muted-foreground">Recycle bin is empty.</p>
                    </div>
                ) : (
                    wallets?.map(wallet => (
                        <div key={wallet.id} className="bg-muted/30 border rounded-xl p-4 flex justify-between items-center opacity-75 hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-semibold line-through decoration-muted-foreground truncate max-w-[120px] sm:max-w-none">{wallet.walletName}</h4>
                                    <span className="text-xs text-muted-foreground">Deleted</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => restoreMutation.mutate(wallet.id)} title="Restore">
                                    <RotateCcw className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => setWalletToDelete(wallet.id)} title="Delete Forever">
                                    <AlertTriangle className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </motion.div>

            <AlertDialog open={!!walletToDelete} onOpenChange={(open) => !open && setWalletToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Permanently Delete?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the wallet and its seed phrase from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (!walletToDelete) return;
                                permanentDeleteMutation.mutate(walletToDelete, {
                                    onSuccess: () => setWalletToDelete(null),
                                });
                            }}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Delete Forever
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function WalletItem({ wallet, onDelete }: { wallet: CryptoWallet, onDelete: () => void }) {
    const [showSeed, setShowSeed] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(wallet.seedPhrase);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <div className="bg-card border rounded-xl p-4 space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Key className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-semibold truncate max-w-[150px] sm:max-w-none">{wallet.walletName}</h4>
                            <span className="text-xs text-muted-foreground">{wallet.wordCount}-word phrase</span>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="relative">
                    <div className={`p-4 bg-muted/50 rounded-lg text-sm font-mono break-all ${!showSeed ? 'blur-sm select-none' : ''}`}>
                        {showSeed ? wallet.seedPhrase : "• ".repeat(wallet.wordCount * 3)}
                    </div>
                    {!showSeed && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Button variant="secondary" size="sm" onClick={() => setShowSeed(true)} className="gap-2">
                                <Eye className="w-4 h-4" /> Reveal Seed
                            </Button>
                        </div>
                    )}
                </div>

                {showSeed && (
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setShowSeed(false)}>
                            <EyeOff className="w-4 h-4 mr-2" /> Hide
                        </Button>
                        <Button variant="outline" size="sm" onClick={copyToClipboard}>
                            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                            {copied ? "Copied" : "Copy"}
                        </Button>
                    </div>
                )}
            </div>

            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Move to Recycle Bin?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This wallet will be moved to the recycle bin. You can restore it or permanently delete it from there.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { onDelete(); setShowDeleteConfirm(false); }} className="bg-destructive hover:bg-destructive/90">
                            Move to Bin
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function CreateWalletForm({ onCancel, onSuccess }: { onCancel: () => void, onSuccess: () => void }) {
    const [name, setName] = useState("");
    const [wordCount, setWordCount] = useState<12 | 24>(12);
    const [seedWords, setSeedWords] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const { toast } = useToast();
    const inputRef = useRef<HTMLInputElement>(null);

    const createMutation = useCreateWallet();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);

        // Check for paste (space separated words)
        if (value.includes(" ")) {
            const words = value.split(/[\s,]+/).filter(w => w.length > 0);

            const validWords = words.filter(w => BIP39_WORDS.includes(w.toLowerCase()));

            if (validWords.length > 0) {
                const newWords = [...seedWords, ...validWords].slice(0, wordCount);
                setSeedWords(newWords);
                setInputValue("");
                setSuggestions([]);
                return;
            }
        }

        if (value.trim()) {
            const matches = BIP39_WORDS.filter(w => w.startsWith(value.toLowerCase())).slice(0, 5);
            setSuggestions(matches);
        } else {
            setSuggestions([]);
        }
    };

    const addWord = (word: string) => {
        if (seedWords.length >= wordCount) return;
        setSeedWords([...seedWords, word]);
        setInputValue("");
        setSuggestions([]);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === "Tab" || e.key === "Enter" || e.key === " ") && inputValue.trim()) {
            e.preventDefault();
            // If exact match or single suggestion, use it
            const exactMatch = BIP39_WORDS.includes(inputValue.toLowerCase());
            if (exactMatch) {
                addWord(inputValue.toLowerCase());
            } else if (suggestions.length > 0) {
                addWord(suggestions[0]);
            }
        } else if (e.key === "Backspace" && !inputValue && seedWords.length > 0) {
            setSeedWords(seedWords.slice(0, -1));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (seedWords.length !== wordCount) {
            toast({ title: "Incomplete Phrase", description: `Please enter all ${wordCount} words.`, variant: "destructive" });
            return;
        }
        createMutation.mutate({
            walletName: name,
            wordCount,
            seedPhrase: seedWords.join(" ")
        }, {
            onSuccess: () => {
                onSuccess();
            }
        });
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text');
        const words = text.split(/[\s,]+/).filter(w => w.length > 0 && BIP39_WORDS.includes(w.toLowerCase()));
        if (words.length > 0) {
            const newWords = [...seedWords, ...words].slice(0, wordCount);
            setSeedWords(newWords);
            setInputValue("");
        }
    };

    return (
        <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={handleSubmit}
            className="space-y-6"
        >
            <div className="space-y-2">
                <Label>Wallet Name</Label>
                <Input
                    placeholder="e.g. Ledger Main, Meta Mask 1"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label>Phrase Length</Label>
                <Tabs value={wordCount.toString()} onValueChange={v => {
                    setWordCount(parseInt(v) as 12 | 24);
                    setSeedWords([]); // Reset words on change safety
                }}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="12">12 Words</TabsTrigger>
                        <TabsTrigger value="24">24 Words</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="space-y-2">
                <Label>Seed Phrase ({seedWords.length}/{wordCount})</Label>
                <div className="min-h-[120px] p-3 border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring ring-offset-background" onClick={() => inputRef.current?.focus()}>
                    <div className="flex flex-wrap gap-2">
                        {seedWords.map((word, i) => (
                            <Badge key={i} variant="secondary" className="gap-1 animate-in zoom-in-50 duration-200">
                                <span className="text-muted-foreground mr-1">{i + 1}.</span>
                                {word}
                                <button type="button" onClick={() => setSeedWords(seedWords.filter((_, idx) => idx !== i))} className="ml-1 hover:text-destructive">×</button>
                            </Badge>
                        ))}
                        <div className="relative flex-1 min-w-[100px]">
                            <input
                                ref={inputRef}
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                onPaste={handlePaste}
                                className="w-full bg-transparent outline-none border-none placeholder:text-muted-foreground/50 h-6 text-sm"
                                placeholder={seedWords.length < wordCount ? "Type word or paste phrase..." : "Phrase complete"}
                                disabled={seedWords.length >= wordCount}
                            />
                            {suggestions.length > 0 && (
                                <div className="absolute top-full left-0 mt-1 w-full bg-popover text-popover-foreground border rounded-md shadow-md z-50 overflow-hidden">
                                    {suggestions.map(s => (
                                        <div
                                            key={s}
                                            className="px-2 py-1 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm"
                                            onClick={() => addWord(s)}
                                        >
                                            {s}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    Type or paste words directly. Suggestions appear from BIP39 list.
                </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || seedWords.length !== wordCount}>
                    {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save to Vault
                </Button>
            </div>
        </motion.form>
    );
}
