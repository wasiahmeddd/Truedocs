import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FileX, Loader2, Share2, Download, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { shareContent } from "@/lib/share-util";
import { useToast } from "@/hooks/use-toast";

export default function FileViewer() {
    const [, params] = useRoute("/view/:id");
    const id = params ? parseInt(params.id) : 0;
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const handleShare = async () => {
        if (!id) return;
        const result = await shareContent(`/api/file/${id}`, `document_${id}.pdf`, "Share Document");
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

    useEffect(() => {
        if (!id) return;

        setLoading(true);
        fetch(`/api/file/${id}`)
            .then(async (res) => {
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || "Failed to load file");
                }
                return res.blob();
            })
            .then((blob) => {
                const url = URL.createObjectURL(blob);
                setBlobUrl(url);
                setLoading(false);
            })
            .catch((e) => {
                setError(e.message);
                setLoading(false);
            });

        return () => {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [id]);

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
        <div className="h-screen w-full flex flex-col bg-background">
            {/* Header */}
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
                    <a href={blobUrl || '#'} download={`document_${id}.pdf`} className={!blobUrl ? 'pointer-events-none opacity-50' : ''}>
                        <Button variant="default" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download / Open
                        </Button>
                    </a>
                </div>
            </div>

            {/* Viewer Content */}
            <div className="flex-1 bg-muted/20 relative flex flex-col">
                {/* Mobile PDF Fallback/Action */}
                <div className="md:hidden p-4 bg-background border-b text-center">
                    <p className="text-sm text-muted-foreground mb-2">Having trouble viewing?</p>
                    <a href={`/api/file/${id}`} target="_blank" rel="noopener noreferrer">
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
    );
}
