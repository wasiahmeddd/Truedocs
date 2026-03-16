/**
 * Shares content using the native sharing mechanism if available (mobile),
 * otherwise falls back to a direct download (desktop).
 *
 * @param urlOrBlob The URL (or blob) of the file to fetch and share/download
 * @param filename The name to use for the file
 * @param title Title for the share dialog
 * @param text Description for the share dialog
 */
export type ShareResult =
    | { status: "shared" }
    | { status: "downloaded" }
    | { status: "copied" }
    | { status: "unsupported" }
    | { status: "cancelled" }
    | { status: "error"; error: unknown };

export async function shareContent(
    urlOrBlob: string | Blob,
    filename: string,
    title?: string,
    text?: string
): Promise<ShareResult> {
    const isMobile =
        typeof navigator !== "undefined" &&
        /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
    const shareTitle = title || filename;
    const shareText = text || `Sharing ${filename}`;
    const isUrlString = typeof urlOrBlob === "string";
    const isBlobUrl = isUrlString && urlOrBlob.startsWith("blob:");
    const absoluteUrl = isUrlString
        ? new URL(urlOrBlob, window.location.origin).toString()
        : null;

    try {
        const blob = isUrlString
            ? await fetchBlob(urlOrBlob)
            : urlOrBlob;
        const file = new File([blob], filename, { type: blob.type || "application/octet-stream" });

        // Try native share first if available.
        if (navigator.share) {
            const canShareFiles =
                typeof navigator.canShare === "function"
                    ? navigator.canShare({ files: [file] })
                    : true;

            if (canShareFiles) {
                await navigator.share({
                    files: [file],
                    title: shareTitle,
                    text: shareText,
                });
                return { status: "shared" };
            }

            // If file sharing isn't supported, attempt URL sharing (if we have a real URL).
            if (absoluteUrl && !isBlobUrl) {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: absoluteUrl,
                });
                return { status: "shared" };
            }
        }

        // On mobile, avoid auto-downloading when share isn't supported.
        if (isMobile) {
            if (absoluteUrl && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(absoluteUrl);
                return { status: "copied" };
            }
            return { status: "unsupported" };
        }

        // Fallback to download (desktop)
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
        return { status: "downloaded" };
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            // User cancelled the share sheet; no fallback needed.
            return { status: "cancelled" };
        }
        console.error("Error sharing content:", error);
        if (!isMobile && absoluteUrl && !isBlobUrl) {
            window.location.href = absoluteUrl;
            return { status: "downloaded" };
        }
        return { status: "error", error };
    }
}

async function fetchBlob(url: string): Promise<Blob> {
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch content");
    return response.blob();
}
