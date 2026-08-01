import { type PointerEvent, type ReactElement, type ReactNode } from "react";
export interface HitRegionProps {
    /** Unique id for this region. Must be unique across all mounted regions. */
    id: string;
    /** Whether the region may take keyboard focus. Defaults to false. */
    focusable?: boolean;
    /** Optional user handler, merged with the focus-grant handler. */
    onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
    /** Exactly one element — the interactive root of the region. */
    children: ReactNode;
}
/**
 * The primary developer-facing hit-region API. Wrap the interactive root element
 * of an overlay UI and it becomes click-capturing while the cursor is over it
 * (and click-through everywhere else).
 *
 * Requires exactly one child element; the region ref is forwarded to it so
 * bounds are measured on the element itself — which keeps Framer Motion
 * drag/animate transforms correct.
 *
 * Pass `focusable` for regions that need keyboard input (search boxes, text
 * inputs). A real click inside the region grants the window focus; hovering
 * never does, so the cursor drifting over a region can't steal the user's
 * keyboard input from another app.
 */
export declare function HitRegion({ id, focusable, onPointerDown, children }: HitRegionProps): ReactElement<unknown, string | import("react").JSXElementConstructor<any>>;
