import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  label: string;
  children: ReactNode;
}

/**
 * Styled hover/focus tooltip.
 *
 * The tooltip is rendered in a portal with fixed positioning so it is never
 * clipped by ancestors that hide overflow (table scroll wrappers, cards).
 */
export default function Tooltip({ label, children }: TooltipProps) {
  const hostRef = useRef<HTMLSpanElement | null>(null);
  const tipRef = useRef<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; placement: "top" | "bottom" } | null>(null);

  const place = useCallback(() => {
    const host = hostRef.current;
    const tip = tipRef.current;
    if (!host || !tip) return;
    const h = host.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    // Flip below only when there is no room above.
    const placement: "top" | "bottom" = h.top > t.height + 16 ? "top" : "bottom";
    const top = placement === "top" ? h.top - 8 : h.bottom + 8;
    const half = t.width / 2;
    const left = Math.min(Math.max(h.left + h.width / 2, half + 8), window.innerWidth - half - 8);
    setPos({ top, left, placement });
  }, []);

  // Measure after the tooltip is in the DOM (it is hidden until measured).
  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    place();
  }, [open, place]);

  // Keep the tooltip glued to its trigger while scrolling or resizing.
  useEffect(() => {
    if (!open) return;
    const reposition = () => place();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, place]);

  return (
    <>
      <span
        ref={hostRef}
        className="ml-tooltip-host"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onMouseDown={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </span>
      {open &&
        createPortal(
          <span
            ref={tipRef}
            role="tooltip"
            className={`ml-tooltip ml-tooltip--${pos ? pos.placement : "top"}`}
            style={{
              top: pos ? pos.top : 0,
              left: pos ? pos.left : 0,
              transform: `translate(-50%, ${pos && pos.placement === "bottom" ? "0" : "-100%"})`,
              visibility: pos ? "visible" : "hidden",
            }}
          >
            {label}
          </span>,
          document.body,
        )}
    </>
  );
}
