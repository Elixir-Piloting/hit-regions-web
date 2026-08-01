interface UseHitRegionOptions {
    /** Whether this region may take keyboard focus (granted on click, not hover). */
    focusable?: boolean;
}
/**
 * Attach the returned `ref` to any DOM element to make it a hit region.
 *
 * - Measures via `ResizeObserver` for size/layout changes.
 * - Also samples `getBoundingClientRect()` every animation frame so the region
 *   follows transform-driven motion (Framer Motion `animate`/`drag`).
 * - Deregisters its own id on unmount so no stale rect is left behind — a stale
 *   rect would become an invisible permanent dead zone.
 * - Registers its DOM node so the provider can release focus on click-outside,
 *   and releases focus itself when a focusable region unmounts.
 */
export declare function useHitRegion(id: string, options?: UseHitRegionOptions): {
    ref: import("react").RefObject<HTMLElement | null>;
};
export {};
