/**
 * `invoke()` that no-ops outside a Tauri webview, so the frontend can be
 * developed with plain `next dev` in a browser without crashing on IPC calls.
 */
export declare function safeInvoke<T = unknown>(command: string, args?: Record<string, unknown>): Promise<T | undefined> | undefined;
/** Grant (or release) keyboard focus for the overlay window. */
export declare function setOverlayFocus(focused: boolean): Promise<void> | undefined;
