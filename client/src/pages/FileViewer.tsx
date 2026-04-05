import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FileX, Loader2, Share2, Download, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { shareContent } from "@/lib/share-util";
import { useToast } from "@/hooks/use-toast";
import { useStorageMode } from "@/lib/storage-mode";
import { useAuth } from "@/context/AuthContext";
import { localDb } from "@/lib/local-db";
import { decryptBlob } from "@/lib/local-crypto";

export default function FileViewer() {
    const [, params] = useRoute("/view/:id");
    const id = params ? parseInt(params.id) : 0;
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [fileBlob, setFileBlob] = useState<Blob | null>(null);
    const [filename, setFilename] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { mode } = useStorageMode();
    const { user, encryptionKey } = useAuth();

    const externalHref = useMemo(() => {
        if (!id) {
            return "#";
        }

        return mode === "local" ? blobUrl || "#" : `/api/file/${id}`;
    }, [blobUrl, id, mode]);

    const handleShare = async () => {
        if (!id) return;

        const target = mode === "local"
            ? fileBlob
            : `/api/file/${id}`;

        if (!target) {
            return;
        }

        const result = await shareContent(target, filename || `document_${id}.pdf`, "Share Document");
        if (result.status === "copied") {
            toast({ title: "Link copied", description: "Share link copied to clipboard." });
        } else if (result.status === "unsupported") {
            toast({
                title: "Sharing not available",
                description: mode === "local"
                    ? "Your device does not support native sharing for this file."
                    : "Native sharing on mobile requires HTTPS. Open the app over https:// and try again.",
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

    useEffect(() => {
        let active = true;
        let createdUrl: string | null = null;

        async function loadFile() {
            if (!id) {
                setError("Invalid file ID");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                let blob: Blob;
                let nextFilename = `document_${id}.pdf`;

                if (mode === "local") {
                    if (!user?.id || !encryptionKey) {
                        throw new Error("Please unlock the vault again to decrypt this file");
                    }

                    const card = await localDb.cards.get(id);
                    if (!card) {
                        throw new Error("Card not found");
                    }

                    const person = await localDb.people.get(card.personId);
                    if (!person || person.userId !== user.id) {
                        throw new Error("Access denied");
                    }

                    const storedFile = await localDb.files.where("cardId").equals(id).first();
                    if (!storedFile) {
                        throw new Error("Encrypted file not found");
                    }

                    blob = await decryptBlob(
                        storedFile.encryptedData,
                        storedFile.iv,
                        encryptionKey,
                        storedFile.mimeType,
                    );
                    nextFilename = storedFile.originalName || card.originalName || card.filename;
                } else {
                    const res = await fetch(`/api/file/${id}`, { credentials: "include" });
                    if (!res.ok) {
                        const text = await res.text();
                        throw new Error(text || "Failed to load file");
                    }

                    blob = await res.blob();
                }

                createdUrl = URL.createObjectURL(blob);
                if (!active) {
                    URL.revokeObjectURL(createdUrl);
                    return;
                }

                setBlobUrl(createdUrl);
                setFileBlob(blob);
                setFilename(nextFilename);
            } catch (nextError) {
                if (active) {
                    setError((nextError as Error).message);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadFile();

        return () => {
            active = false;
            if (createdUrl) {
                URL.revokeObjectURL(createdUrl);
            }
        };
    }, [encryptionKey, id, mode, user?.id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Decrypting and loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                    <FileX className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-bold">Unable to open file</h2>
                <p className="text-muted-foreground max-w-md">{error}</p>
                <Link href="/">
                    <Button>Go Home</Button>
                </Link>
            </div>
        );
    }

    return (
        <>
        <div className="hidden md:flex h-screen w-full flex-col bg-background">
            <div className="h-16 border-b border-border flex items-center px-4 md:px-6 bg-card shrink-0 gap-4">
                <Button variant="ghost" className="gap-2" onClick={() => window.history.back()}>
                    <ChevronLeft className="h-5 w-5" /> Back
                </Button>
                <div className="h-6 w-px bg-border mx-2" />
                <span className="font-semibold text-lg hidden md:block">Document Viewer</span>

                <div className="ml-auto flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleShare}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                    </Button>
                    <a href={blobUrl || "#"} download={filename || `document_${id}.pdf`} className={!blobUrl ? "pointer-events-none opacity-50" : ""}>
                        <Button variant="default" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download / Open
                        </Button>
                    </a>
                </div>
            </div>

            <div className="flex-1 bg-muted/20 relative flex flex-col">
                <div className="md:hidden p-4 bg-background border-b text-center">
                    <p className="text-sm text-muted-foreground mb-2">Having trouble viewing?</p>
                    <a href={externalHref} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full gap-2">
                            <ExternalLink className="h-4 w-4" /> Open in New Tab
                        </Button>
                    </a>
                </div>

                {blobUrl && (
                    <iframe
                        src={blobUrl}
                        className="w-full h-full border-none flex-grow"
                        title="Document Viewer"
                    />
                )}
            </div>
        </div>

        <div className="md:hidden flex flex-col h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden pb-24">
            <header className="fixed top-0 left-0 w-full z-50 flex items-center px-4 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 transition-all duration-200">
               <button onClick={() => window.history.back()} className="text-slate-200 active:scale-95 hover:opacity-80 p-2 -ml-2 mr-2 z-10 relative">
                 <ChevronLeft className="h-6 w-6" />
               </button>
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <h1 className="font-bold tracking-[-0.02em] text-slate-100 text-base uppercase">Document</h1>
               </div>
               <div className="flex items-center gap-3 ml-auto z-10 relative border-l border-slate-800 pl-4">
                 <button onClick={handleShare} className="text-slate-400 p-1 hover:text-white active:scale-95 transition-transform">
                    <Share2 className="h-5 w-5" />
                 </button>
                 <a href={blobUrl || "#"} download={filename || `document_${id}.pdf`} className={`text-cyan-400 p-1 hover:text-cyan-300 active:scale-95 transition-transform ${!blobUrl ? "pointer-events-none opacity-50" : ""}`}>
                    <Download className="h-5 w-5" />
                 </a>
               </div>
            </header>

            <main className="pt-16 flex-1 relative flex flex-col items-center p-4">
               <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-xl z-20 mb-4 shrink-0">
                  <div className="h-16 w-16 bg-blue-500/10 rounded-2xl mx-auto flex items-center justify-center border border-blue-500/20">
                     <ExternalLink className="h-8 w-8 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-slate-200 font-semibold text-lg">Secure Document</h3>
                    <p className="text-slate-400 text-xs mt-1">This document has been decrypted locally. Tap below to view using your device's native viewer.</p>
                  </div>
                  <a href={externalHref} target="_blank" rel="noopener noreferrer" className="block w-full">
                      <button type="button" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl active:scale-[0.98] transition-all shadow-md">
                          Open in External Viewer
                      </button>
                  </a>
               </div>

               <div className="flex-1 w-full rounded-2xl overflow-hidden border border-slate-800/50 relative bg-slate-900/50 backdrop-blur-sm z-10">
                  {blobUrl && (
                      <iframe
                          src={blobUrl}
                          className="absolute inset-0 w-full h-full border-none"
                          title="Document Viewer"
                      />
                  )}
               </div>
            </main>
        </div>
        </>
    );
}
