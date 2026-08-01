"use client";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
/**
 * Primary monitor's logical (CSS-pixel) size, fetched once on mount via the
 * `primary_display_size` command from hit-regions-rs.
 *
 * Resolves asynchronously, so returns `null` until the first successful
 * response (and stays `null` outside a Tauri webview). Overlay UI can use it
 * to size itself against the display — e.g. an island that defaults to half
 * the display width — animating from a fallback once the value lands.
 */
export function useDisplaySize() {
    const [size, setSize] = useState(null);
    useEffect(() => {
        let cancelled = false;
        invoke("primary_display_size")
            .then((s) => {
            if (!cancelled)
                setSize(s);
        })
            .catch((e) => console.error("[hit-regions] primary_display_size failed:", e));
        return () => {
            cancelled = true;
        };
    }, []);
    return size;
}
