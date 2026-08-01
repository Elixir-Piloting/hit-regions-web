import { type ReactNode } from "react";
import type { Rect } from "./types";
interface HitRegionContextValue {
    /** Register or update a region's bounds in the shared registry. */
    register: (id: string, rect: Rect) => void;
    /** Remove a region. Must run on unmount or a stale rect becomes a dead zone. */
    deregister: (id: string) => void;
    /** Track the DOM node of a focusable region for click-outside detection. */
    registerFocusNode: (id: string, node: HTMLElement) => void;
    deregisterFocusNode: (id: string, node: HTMLElement) => void;
}
export declare function useHitRegionContext(): HitRegionContextValue;
/**
 * Wraps the app (put it in the root layout) and owns the shared hit-region
 * registry. The registry is flushed to Rust as a whole, once per animation
 * frame at most, so N components updating together produce ONE IPC call.
 */
export declare function HitRegionProvider({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
export {};
