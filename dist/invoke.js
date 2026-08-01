import { invoke, isTauri } from "@tauri-apps/api/core";
/**
 * `invoke()` that no-ops outside a Tauri webview, so the frontend can be
 * developed with plain `next dev` in a browser without crashing on IPC calls.
 */
export function safeInvoke(command, args) {
    if (!isTauri())
        return undefined;
    return invoke(command, args).catch(() => undefined);
}
/** Grant (or release) keyboard focus for the overlay window. */
export function setOverlayFocus(focused) {
    return safeInvoke("set_overlay_focus", { focused });
}
