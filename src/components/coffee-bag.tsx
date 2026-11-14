import { PALETTES, ROAST_LEVEL, type Product } from "@/lib/catalog";

type View = "front" | "back" | "beans";
type Props = { product: Product; view?: View; className?: string; title?: string };

/** Deterministic pseudo-random numbers from a string, so art is stable per product. */
function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function splitName(name: string): string[] {
  if (name.length <= 13) return [name];
  const words = name.split(" ");
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

function Pattern({ product }: { product: Product }) {
  const p = PALETTES[product.palette];
  const r = rng(product.slug);
  // Art area inside the label: x 76..224, y 146..232
  switch (product.pattern) {
    case "sun":
      return (
        <g>
          <rect x="76" y="146" width="148" height="86" fill={p.bag} opacity="0.12" />
          {Array.from({ length: 14 }, (_, i) => {
            const a = (Math.PI * (i + 0.5)) / 14;
            return (
              <line key={i} x1="150" y1="232" x2={150 - Math.cos(a) * 120} y2={232 - Math.sin(a) * 120} stroke={p.accent} strokeWidth="3" opacity="0.55" />
            );
          })}
          <circle cx="150" cy="232" r="34" fill={p.accent} />
          <circle cx="150" cy="232" r="24" fill={p.bag} opacity="0.2" />
        </g>
      );
    case "hills":
      return (
        <g>
          <rect x="76" y="146" width="148" height="86" fill={p.accent} opacity="0.25" />
          <circle cx={120 + r() * 60} cy="172" r="12" fill={p.accent} />
          <path d="M76 212 Q110 180 140 200 T224 188 V232 H76Z" fill={p.bag} opacity="0.55" />
          <path d="M76 222 Q120 196 160 214 T224 206 V232 H76Z" fill={p.bag} />
        </g>
      );
    case "waves":
      return (
        <g>
          <rect x="76" y="146" width="148" height="86" fill={p.bag} opacity="0.1" />
          {Array.from({ length: 6 }, (_, i) => (
            <path
              key={i}
              d={`M76 ${160 + i * 13} q12 -8 24 0 t24 0 t24 0 t24 0 t24 0 t24 0`}
              fill="none"
              stroke={i % 2 ? p.bag : p.accent}
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity={0.9 - i * 0.08}
            />
          ))}
        </g>
      );
    case "leaf":
      return (
        <g>
          <rect x="76" y="146" width="148" height="86" fill={p.bag} />
          {[
            [118, 196, -35],
            [182, 190, 30],
            [150, 176, 0],
          ].map(([x, y, rot], i) => (
            <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
              <path d="M0 -30 C18 -16 18 16 0 30 C-18 16 -18 -16 0 -30Z" fill={i === 2 ? p.accent : p.label} opacity={i === 2 ? 1 : 0.85} />
              <path d="M0 -26 V26" stroke={p.bag} strokeWidth="1.5" opacity="0.6" />
            </g>
          ))}
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={100 + i * 50 + r() * 10} cy={222} r="5" fill="#b8322a" />
          ))}
        </g>
      );
    case "grid":
      return (
        <g>
          <rect x="76" y="146" width="148" height="86" fill={p.accent} opacity="0.3" />
          {Array.from({ length: 6 }, (_, row) =>
            Array.from({ length: 8 }, (_, col) => (
              <rect
                key={`${row}-${col}`}
                x={80 + col * 18.5}
                y={150 + row * 14}
                width="9"
                height="9"
                transform={`rotate(45 ${84.5 + col * 18.5} ${154.5 + row * 14})`}
                fill={(row + col) % 3 === 0 ? p.bag : p.accent}
                opacity={(row + col) % 3 === 0 ? 1 : 0.7}
              />
            )),
          )}
        </g>
      );
    case "dots":
    default:
      return (
        <g>
          <rect x="76" y="146" width="148" height="86" fill={p.bag} opacity="0.12" />
          {Array.from({ length: 7 }, (_, row) =>
            Array.from({ length: 12 }, (_, col) => {
              const d = Math.hypot(col - 5.5, row - 3) / 7;
              return <circle key={`${row}-${col}`} cx={82 + col * 12.5} cy={152 + row * 12.5} r={Math.max(0.8, 5.2 * (1 - d))} fill={(row + col) % 2 ? p.accent : p.bag} />;
            }),
          )}
        </g>
      );
  }
}

function Bag({ product, uid, children }: { product: Product; uid: string; children: React.ReactNode }) {
  const p = PALETTES[product.palette];
  return (
    <>
      <defs>
        <linearGradient id={`sheen-${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.28" />
          <stop offset="0.18" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.82" stopColor="#000" stopOpacity="0.06" />
          <stop offset="1" stopColor="#000" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={`tie-${uid}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f4dc9b" />
          <stop offset="1" stopColor="#a8823b" />
        </linearGradient>
        <filter id={`grain-${uid}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.07 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      <ellipse cx="150" cy="388" rx="122" ry="9" fill="#000" opacity="0.18" />
      {/* Body */}
      <path d="M44 74 H256 L268 366 Q269 384 251 384 H49 Q31 384 32 366 Z" fill={p.bag} />
      <path d="M44 74 H256 L268 366 Q269 384 251 384 H49 Q31 384 32 366 Z" fill={`url(#sheen-${uid})`} />
      <path d="M44 74 H256 L268 366 Q269 384 251 384 H49 Q31 384 32 366 Z" fill={p.bag} filter={`url(#grain-${uid})`} />
      {/* Folded top + crimp */}
      <path d="M40 26 H260 L256 76 H44 Z" fill={p.bag} />
      <path d="M40 26 H260 L256 76 H44 Z" fill="#000" opacity="0.18" />
      {Array.from({ length: 44 }, (_, i) => (
        <line key={i} x1={42 + i * 5} y1="27" x2={42 + i * 5} y2="35" stroke="#000" strokeOpacity="0.25" strokeWidth="1.2" />
      ))}
      <rect x="40" y="44" width="220" height="7" rx="2" fill={`url(#tie-${uid})`} />
      <path d="M44 76 H256" stroke="#000" strokeOpacity="0.3" strokeWidth="2" />
      {children}
    </>
  );
}

export function CoffeeBag({ product, view = "front", className, title }: Props) {
  const p = PALETTES[product.palette];
  const uid = `${product.slug}-${view}`;
  const lines = splitName(product.name);
  const roast = ROAST_LEVEL[product.roast];
  const display = { fontFamily: "var(--font-display), Georgia, serif" };
  const sans = { fontFamily: "var(--font-sans), system-ui, sans-serif" };

  if (view === "beans") {
    const r = rng(product.slug + "beans");
    const beans = Array.from({ length: 34 }, () => ({ x: r() * 300, y: r() * 400, rot: r() * 180, s: 0.8 + r() * 0.5 }));
    const bean = product.roast === "light" ? "#9a6a3c" : product.roast === "medium" ? "#6e4523" : "#3a2414";
    return (
      <svg viewBox="0 0 300 400" className={className} role="img" aria-label={title ?? `${product.name} roasted beans and tasting notes`}>
        <rect width="300" height="400" fill={p.label} />
        {beans.map((b, i) => (
          <g key={i} transform={`translate(${b.x} ${b.y}) rotate(${b.rot}) scale(${b.s})`}>
            <ellipse rx="15" ry="10" fill={bean} />
            <ellipse rx="15" ry="10" fill="none" stroke="#000" strokeOpacity="0.15" />
            <path d="M-12 1 C-4 -5 4 6 12 -1" stroke="#000" strokeOpacity="0.45" strokeWidth="2" fill="none" strokeLinecap="round" />
            <ellipse rx="10" ry="4" cy="-4" fill="#fff" opacity="0.12" />
          </g>
        ))}
        <g transform="translate(150 200)">
          <circle r="86" fill={p.label} stroke={p.bag} strokeWidth="4" />
          <circle r="76" fill="none" stroke={p.bag} strokeWidth="1" strokeDasharray="3 4" />
          <text y="-38" textAnchor="middle" fill={p.bag} fontSize="11" letterSpacing="3" style={sans} fontWeight="700">
            TASTING NOTES
          </text>
          {product.notes.slice(0, 3).map((n, i) => (
            <text key={n} y={-10 + i * 24} textAnchor="middle" fill={p.ink} fontSize="19" style={display}>
              {n}
            </text>
          ))}
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 300 400" className={className} role="img" aria-label={title ?? `${product.name} coffee bag, ${view === "back" ? "back" : "front"}`}>
      <Bag product={product} uid={uid}>
        {/* Valve */}
        <circle cx="150" cy="108" r="9" fill={p.bag} stroke="#000" strokeOpacity="0.25" strokeWidth="2" />
        <circle cx="150" cy="108" r="3.5" fill="#000" opacity="0.25" />

        {/* Label */}
        <rect x="70" y="138" width="160" height="200" rx="6" fill={p.label} />
        <rect x="70" y="138" width="160" height="200" rx="6" fill="none" stroke="#000" strokeOpacity="0.08" />

        {view === "front" ? (
          <>
            <clipPath id={`art-${uid}`}>
              <rect x="76" y="146" width="148" height="86" rx="3" />
            </clipPath>
            <g clipPath={`url(#art-${uid})`}>
              <Pattern product={product} />
            </g>
            <text x="150" y="250" textAnchor="middle" fill={p.ink} fontSize="8.5" letterSpacing="3.2" style={sans} fontWeight="700">
              KETTLEFOLD
            </text>
            {lines.map((l, i) => (
              <text key={l} x="150" y={lines.length === 1 ? 278 : 271 + i * 19} textAnchor="middle" fill={p.ink} fontSize={lines.length === 1 ? 22 : 19} style={display} fontWeight="600">
                {l}
              </text>
            ))}
            <text x="150" y="309" textAnchor="middle" fill={p.ink} fillOpacity="0.7" fontSize="8" letterSpacing="1.6" style={sans}>
              {`${product.origin === "Blend" ? "BLEND" : product.origin.toUpperCase()} · ${product.process.toUpperCase()}`}
            </text>
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={138 + i * 12} cy="322" r="3.6" fill={i < roast ? p.bag : "none"} stroke={p.bag} strokeWidth="1.3" />
            ))}
          </>
        ) : (
          <>
            <text x="150" y="164" textAnchor="middle" fill={p.ink} fontSize="8" letterSpacing="3" style={sans} fontWeight="700">
              BREW GUIDE
            </text>
            {[
              ["Pour-over", "15 g : 250 g · 94°C"],
              ["French press", "30 g : 500 g · 4 min"],
              ["Espresso", "18 g in · 36 g out"],
            ].map(([k, v], i) => (
              <g key={k}>
                <text x="84" y={190 + i * 30} fill={p.ink} fontSize="12" style={display} fontWeight="600">
                  {k}
                </text>
                <text x="84" y={204 + i * 30} fill={p.ink} fillOpacity="0.65" fontSize="8.5" style={sans}>
                  {v}
                </text>
              </g>
            ))}
            <line x1="84" y1="284" x2="216" y2="284" stroke={p.ink} strokeOpacity="0.15" />
            <text x="150" y="302" textAnchor="middle" fill={p.ink} fillOpacity="0.75" fontSize="8" style={sans}>
              Roasted to order in small batches.
            </text>
            <text x="150" y="316" textAnchor="middle" fill={p.ink} fillOpacity="0.75" fontSize="8" style={sans}>
              Best within 6 weeks of roasting.
            </text>
          </>
        )}
      </Bag>
    </svg>
  );
}
