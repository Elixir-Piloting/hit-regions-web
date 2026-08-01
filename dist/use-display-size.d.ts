/** Logical (CSS-pixel) size of the primary monitor. */
export interface DisplaySize {
    width: number;
    height: number;
}
/**
 * Primary monitor's logical (CSS-pixel) size, fetched once on mount via the
 * `primary_display_size` command from hit-regions-rs.
 *
 * Resolves asynchronously, so returns `null` until the first successful
 * response (and stays `null` outside a Tauri webview). Overlay UI can use it
 * to size itself against the display — e.g. an island that defaults to half
 * the display width — animating from a fallback once the value lands.
 */
export declare function useDisplaySize(): DisplaySize | null;
