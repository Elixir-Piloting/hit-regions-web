export interface OverlayLifecycleOptions {
    /** Heartbeat interval in ms. Defaults to 2000. */
    heartbeatMs?: number;
}
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
export declare function useOverlayLifecycle(options?: OverlayLifecycleOptions): void;
