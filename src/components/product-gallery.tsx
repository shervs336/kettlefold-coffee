"use client";

import { useRef, useState } from "react";
import { ZoomInIcon, ZoomOutIcon } from "lucide-react";
import { CoffeeBag } from "@/components/coffee-bag";
import { PALETTES, type Product } from "@/lib/catalog";

const VIEWS = [
  { id: "front", label: "Front" },
  { id: "back", label: "Brew guide" },
  { id: "beans", label: "Beans & notes" },
] as const;

/**
 * Gallery with zoom: hover to magnify where you point (mouse), or use the
 * zoom button and drag/move to pan (touch, keyboard). The art is vector, so
 * it stays sharp at any zoom.
 */
export function ProductGallery({ product }: { product: Product }) {
  const [view, setView] = useState<(typeof VIEWS)[number]["id"]>("front");
  // Hover zoom (mouse) is temporary; the button pins zoom on (touch, keyboard, or mouse).
  const [hoverZoom, setHoverZoom] = useState(false);
  const [pinned, setPinned] = useState(false);
  const zoom = hoverZoom || pinned;
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const frame = useRef<HTMLDivElement>(null);

  function track(clientX: number, clientY: number) {
    const r = frame.current?.getBoundingClientRect();
    if (!r) return;
    setOrigin({
      x: Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)),
      y: Math.min(100, Math.max(0, ((clientY - r.top) / r.height) * 100)),
    });
  }

  return (
    <div>
      <div
        ref={frame}
        className="relative grid aspect-[4/5] cursor-zoom-in place-items-center overflow-hidden rounded-[2rem] soft-shadow"
        style={{ background: PALETTES[product.palette].label }}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHoverZoom(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setHoverZoom(false)}
        onPointerMove={(e) => track(e.clientX, e.clientY)}
      >
        <div
          className="h-[86%] transition-transform duration-200 ease-out"
          style={{ transform: zoom ? "scale(2.3)" : "scale(1)", transformOrigin: `${origin.x}% ${origin.y}%` }}
        >
          <CoffeeBag product={product} view={view} className="h-full w-auto" />
        </div>
        <button
          type="button"
          onClick={() => setPinned((z) => !z)}
          aria-pressed={pinned}
          aria-label={pinned ? "Zoom out" : "Zoom in"}
          className="absolute right-4 bottom-4 grid size-11 place-items-center rounded-full bg-paper/90 text-espresso shadow-md backdrop-blur hover:bg-paper focus-visible:outline-2 focus-visible:outline-fern"
        >
          {pinned ? <ZoomOutIcon className="size-5" /> : <ZoomInIcon className="size-5" />}
        </button>
      </div>
      <div role="tablist" aria-label="Product images" className="mt-4 grid grid-cols-3 gap-3">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={view === v.id}
            onClick={() => {
              setView(v.id);
              setPinned(false);
            }}
            className="group overflow-hidden rounded-2xl border-2 border-transparent text-xs text-roast aria-selected:border-espresso focus-visible:outline-2 focus-visible:outline-fern"
          >
            <span className="grid aspect-square place-items-center" style={{ background: PALETTES[product.palette].label }}>
              <CoffeeBag product={product} view={v.id} className="h-[80%] w-auto" title={`${v.label} view`} />
            </span>
            <span className="block py-1.5">{v.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
