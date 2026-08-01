/** Global cursor position in logical CSS pixels relative to the overlay window's top-left. */
export interface CursorPosition {
    x: number;
    y: number;
}
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
export declare function useCursorPosition(): CursorPosition | null;
