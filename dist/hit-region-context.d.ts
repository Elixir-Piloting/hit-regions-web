import { type ReactNode } from "react";
import type { Rect } from "./types";
interface HitRegionContextValue {
    register: (id: string, rect: Rect) => void;
    deregister: (id: string) => void;
    registerFocusNode: (id: string, node: HTMLElement) => void;
    deregisterFocusNode: (id: string, node: HTMLElement) => void;
}
export declare function useHitRegionContext(): HitRegionContextValue;
/**
 * Wraps the app (put it in the root layout) and owns the shared hit-region
 * registry. The registry is flushed to Rust as a whole, once per animation
 * frame at most.
 *
 * `idPrefix` lets the host namespace regions per child subtree (one mod per
 * nested provider). The outermost provider (no parent context) owns the
 * registry + flush; any provider that finds a parent becomes a pure
 * id-transform layer that forwards to the parent with its prefix prepended.
 * Prefixes chain across nesting depth. A mod's own `id` values are its own
 * concern — the host guarantees global uniqueness via the prefix.
 */
export declare function HitRegionProvider({ idPrefix, children, }: {
    idPrefix?: string;
    children: ReactNode;
}): import("react").JSX.Element;
export {};
