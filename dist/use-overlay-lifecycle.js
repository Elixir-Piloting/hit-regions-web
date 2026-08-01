"use client";
import { useEffect } from "react";
import { emit } from "@tauri-apps/api/event";
import { isTauri } from "@tauri-apps/api/core";
/**
 * Keeps the Rust watchdog (`hit-regions-rs`) informed of the frontend's health
 * so the overlay can never lock the desktop:
 *
 * - emits `overlay-ready` once on mount — Rust only shows the (initially
 *   hidden) window after this, so a failed page load never produces a
 *   full-screen takeover;
 * - emits `overlay-heartbeat` every `heartbeatMs` — Rust hides the window (and
 *   in release builds exits the app) if heartbeats stop for too long, and
 *   re-shows it when they resume;
 * - emits `overlay-fatal` once (debounced) on a JS error or unhandled
 *   rejection — Rust exits immediately in release builds.
 *
 * All IPC is behind `isTauri()`, so the app also runs under a plain dev server
 * in a browser. Call it from a single mounted client component.
 */
export function useOverlayLifecycle(options) {
    const heartbeatMs = options?.heartbeatMs ?? 2000;
    useEffect(() => {
        if (!isTauri())
            return;
        let fatalSent = false;
        const sendFatal = () => {
            if (fatalSent)
                return;
            fatalSent = true;
            void emit("overlay-fatal");
        };
        const onError = () => sendFatal();
        const onRejection = () => sendFatal();
        void emit("overlay-ready");
        const heartbeat = setInterval(() => {
            void emit("overlay-heartbeat");
        }, heartbeatMs);
        window.addEventListener("error", onError);
        window.addEventListener("unhandledrejection", onRejection);
        return () => {
            clearInterval(heartbeat);
            window.removeEventListener("error", onError);
            window.removeEventListener("unhandledrejection", onRejection);
        };
    }, [heartbeatMs]);
}
