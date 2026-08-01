"use client";
import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { isTauri } from "@tauri-apps/api/core";
/**
 * Latest global cursor position, updated live via the `cursor-moved` event the
 * Rust engine (`hit-regions-rs`) emits from its existing ~60 Hz polling loop.
 *
 * Coordinates are in the same space `getBoundingClientRect()` reports (CSS
 * pixels relative to the window's top-left), and are **not** gated by
 * click-through state — they update whether or not the cursor is inside a
 * registered hit region. Returns `null` until the first event arrives, and
 * stays `null` outside a Tauri webview.
 */
export function useCursorPosition() {
    const [position, setPosition] = useState(null);
    useEffect(() => {
        if (!isTauri())
            return;
        let disposed = false;
        let unlisten;
        void listen("cursor-moved", (event) => {
            if (!disposed)
                setPosition(event.payload);
        }).then((stop) => {
            if (disposed) {
                stop();
            }
            else {
                unlisten = stop;
            }
        });
        return () => {
            disposed = true;
            unlisten?.();
        };
    }, []);
    return position;
}
