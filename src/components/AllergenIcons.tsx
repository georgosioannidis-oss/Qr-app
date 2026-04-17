"use client";

import { allergenLabel } from "@/lib/allergens";
import { allergenPhotoSrc } from "@/lib/allergen-assets";

/** Guest menu: readable next to dish names */
const GUEST_BOX =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1 ring-black/10 sm:h-8 sm:w-8";
/** Dashboard list rows: keep compact */
const DENSE_BOX =
  "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] ring-1 ring-black/10";

function IconGluten() {
  return (
    <svg viewBox="0 0 16 16" className="h-[0.72rem] w-[0.72rem] sm:h-[0.78rem] sm:w-[0.78rem]" aria-hidden>
      <path stroke="#a67c00" strokeWidth="1.1" strokeLinecap="round" d="M8 14V3.5" fill="none" />
      <ellipse cx="5.8" cy="6.2" rx="1.2" ry="2" fill="#d4af37" transform="rotate(-28 5.8 6.2)" />
      <ellipse cx="10.2" cy="7" rx="1.2" ry="2" fill="#d4af37" transform="rotate(28 10.2 7)" />
      <ellipse cx="8" cy="4.3" rx="1.1" ry="1.7" fill="#e8c84a" />
    </svg>
  );
}

function IconMilk() {
  return (
    <svg viewBox="0 0 16 16" className="h-[0.72rem] w-[0.72rem] sm:h-[0.78rem] sm:w-[0.78rem]" aria-hidden>
      <path
        fill="#6eb5e8"
        d="M5 2h6v1.2L10 6v7.5c0 .8-.7 1.5-1.5 1.5h-1C6.7 15 6 14.3 6 13.5V6L5 3.2V2zm1.2 2L7 6.2V13h2V6.2L9.8 4H6.2z"
      />
    </svg>
  );
}

function IconEggs() {
  return (
    <svg viewBox="0 0 16 16" className="h-[0.72rem] w-[0.72rem] sm:h-[0.78rem] sm:w-[0.78rem]" aria-hidden>
      <ellipse cx="8" cy="8.5" rx="3.2" ry="4.2" fill="#f5d76e" />
    </svg>
  );
}

function IconFish() {
  return (
    <svg viewBox="0 0 16 16" className="h-[0.72rem] w-[0.72rem] sm:h-[0.78rem] sm:w-[0.78rem]" aria-hidden>
      <path
        fill="#4a90c9"
        d="M2 8c2-1.5 4-2 6-2v1.2l2-1.5v2.6L8 6.8V8c-2 0-4 .5-6 2z"
      />
      <circle cx="4.5" cy="7.3" r="0.6" fill="#1a3a52" />
    </svg>
  );
}

function IconCrustaceans() {
  return (
    <svg viewBox="0 0 16 16" className="h-[0.72rem] w-[0.72rem] sm:h-[0.78rem] sm:w-[0.78rem]" aria-hidden>
      <path
        fill="#e07a5f"
        d="M11 3.5c.8.3 1.4 1 1.6 1.8-.5-.1-1 .1-1.4.4.6.5 1 1.2 1.1 2-.4-.3-.9-.4-1.4-.3.3.7.3 1.5 0 2.2l-.9-.6c.2-.5.2-1 0-1.5-.5.4-1.1.6-1.8.5v1.5H8v-1.5c-.7 0-1.3-.2-1.8-.5-.2.5-.2 1 0 1.5l-.9.6c-.3-.7-.3-1.5 0-2.2-.5-.1-1 .1-1.4.3.1-.8.5-1.5 1.1-2-.4-.3-.9-.5-1.4-.4.2-.8.8-1.5 1.6-1.8.3.5.8.9 1.4 1-.1.8.1 1.6.6 2.2.6-.4 1.3-.6 2.1-.6s1.5.2 2.1.6c.5-.6.7-1.4.6-2.2.6-.1 1.1-.5 1.4-1z"
      />
    </svg>
  );
}

function IconMolluscs() {
  return (
    <svg viewBox="0 0 16 16" className="h-[0.72rem] w-[0.72rem] sm:h-[0.78rem] sm:w-[0.78rem]" aria-hidden>
      <path
        fill="#8aa6b8"
        d="M3 10c0-2.5 2-4.5 5-4.5s5 2 5 4.5c0 .5-.1 1-.3 1.5H3.3c-.2-.5-.3-1-.3-1.5z"
      />
      <path fill="none" stroke="#5a7588" strokeWidth="0.6" d="M5 9.5h6" />
    </svg>
  );
}

function IconPeanuts() {
  return (
    <svg viewBox="0 0 16 16" className="h-[0.72rem] w-[0.72rem] sm:h-[0.78rem] sm:w-[0.78rem]" aria-hidden>
      <ellipse cx="6" cy="9" rx="2.2" ry="3" fill="#c4a574" transform="rotate(-35 6 9)" />
      <ellipse cx="10" cy="7" rx="2.2" ry="3" fill="#a88452" transform="rotate(35 10 7)" />
    </svg>
  );
}

function IconSoy() {
  return (
    <svg viewBox="0 0 16 16" className="h-[0.72rem] w-[0.72rem] sm:h-[0.78rem] sm:w-[0.78rem]" aria-hidden>
      <path fill="#6b8f3d" d="M8 2c-1 2-2 3.5-1.5 5 .3-.5.8-.8 1.5-.9V2z" />
      <path fill="#8cb04c" d="M8 6.1c.7.1 1.2.4 1.5.9.5-1.5-.5-3-1.5-5v4.1z" />
      <ellipse cx="6" cy="11" rx="2" ry="3.5" fill="#a4c969" />
      <ellipse cx="10" cy="11" rx="2" ry="3.5" fill="#8cb04c" />
    </svg>
  );
}

function IconNuts() {
  return (
    <svg viewBox="0 0 16 16" className="h-[0.72rem] w-[0.72rem] sm:h-[0.78rem] sm:w-[0.78rem]" aria-hidden>
      <ellipse cx="8" cy="9" rx="3" ry="3.8" fill="#8b5a2b" />
      <path fill="#5c3d1e" d="M8 5.2c-1.2.8-2 2-2 3.3 0 .3 0 .6.1.9 1.2-.5 2.8-.5 4 0 .1-.3.1-.6.1-.9 0-1.3-.8-2.5-2-3.3z" />
    </svg>
  );
}

function IconCelery() {
  return (
    <svg viewBox="0 0 16 16" className="h-[0.72rem] w-[0.72rem] sm:h-[0.78rem] sm:w-[0.78rem]" aria-hidden>
      <path
        fill="#43a047"
        d="M8 1.5l1 2.5-.5 6h-1l-.5-6 1-2.5zm-2 4l-.8 5.5c-.2 1.2.6 2.3 1.8 2.5V9.5L6 5.5zm4 0l.8 5.5L9 13.5v-4c1.2-.2 2-1.3 1.8-2.5L10 5.5z"
      />
    </svg>
  );
}

function IconMustard() {
  return (
    <svg viewBox="0 0 16 16" className="h-[0.72rem] w-[0.72rem] sm:h-[0.78rem] sm:w-[0.78rem]" aria-hidden>
      <path fill="#e6c200" d="M6 2h4l.5 3H5.5L6 2zm-.5 5h5l-.5 7.5c0 .5-.4 1-1 1H7c-.6 0-1-.5-1-1L5.5 7z" />
    </svg>
  );
}

function IconSesame() {
  return (
    <svg viewBox="0 0 16 16" className="h-[0.72rem] w-[0.72rem] sm:h-[0.78rem] sm:w-[0.78rem]" aria-hidden>
      <circle cx="6" cy="7" r="1.1" fill="#d4b896" />
      <circle cx="10" cy="6" r="1.1" fill="#c4a882" />
      <circle cx="8" cy="10" r="1.1" fill="#e8d4b8" />
      <circle cx="5" cy="10.5" r="0.9" fill="#b8956a" />
      <circle cx="11" cy="9" r="0.9" fill="#a88460" />
    </svg>
  );
}

function IconSulphites() {
  return (
    <svg viewBox="0 0 16 16" className="h-[0.72rem] w-[0.72rem] sm:h-[0.78rem] sm:w-[0.78rem]" aria-hidden>
      <path fill="#c62828" d="M5 2h6l1 10H4L5 2zm1 2l-.5 6h5L10 4H6z" />
      <path fill="#ff8a80" d="M6 6h4v3H6z" opacity="0.85" />
    </svg>
  );
}

function IconLupin() {
  return (
    <svg viewBox="0 0 16 16" className="h-[0.72rem] w-[0.72rem] sm:h-[0.78rem] sm:w-[0.78rem]" aria-hidden>
      <path fill="#7e57c2" d="M8 2c1.5 2 2 3.5 1.5 5l-.5 7h-2l-.5-7C6 5.5 6.5 4 8 2z" />
      <circle cx="8" cy="6" r="1.2" fill="#b39ddb" />
    </svg>
  );
}

function IconAlcohol() {
  return (
    <svg viewBox="0 0 16 16" className="h-[0.72rem] w-[0.72rem] sm:h-[0.78rem] sm:w-[0.78rem]" aria-hidden>
      <path fill="#8d6e63" d="M3 12h4v2H3v-2zm5-8l1 6H7l1-6h0z" />
      <path fill="#5d4037" d="M9 4h3v1.5c0 1-.7 1.8-1.5 1.8H9.5L9 4z" />
    </svg>
  );
}

function IconVegetarian() {
  return (
    <svg viewBox="0 0 16 16" className="h-[0.72rem] w-[0.72rem] sm:h-[0.78rem] sm:w-[0.78rem]" aria-hidden>
      <path
        fill="#2e7d32"
        d="M8 14c-2-3-4-5.5-4-8.5a4 4 0 018 0c0 3-2 5.5-4 8.5z"
      />
      <path fill="#66bb6a" d="M8 12.5c-1.2-1.8-2.5-3.5-2.5-6A2.5 2.5 0 018 7a2.5 2.5 0 012.5 2.5c0 2.5-1.3 4.2-2.5 6z" />
    </svg>
  );
}

function IconGarlic() {
  return (
    <svg viewBox="0 0 16 16" className="h-[0.72rem] w-[0.72rem] sm:h-[0.78rem] sm:w-[0.78rem]" aria-hidden>
      <ellipse cx="8" cy="9" rx="3" ry="4" fill="#f5f5f5" />
      <path fill="#9ccc65" d="M8 2c-.5 1-1 2-.8 3.2h1.6c.2-1.2-.3-2.2-.8-3.2z" />
      <path stroke="#bdbdbd" strokeWidth="0.4" fill="none" d="M6.5 6.5h3M6.5 8h3M6.5 9.5h3" />
    </svg>
  );
}

function IconMushroom() {
  return (
    <svg viewBox="0 0 16 16" className="h-[0.72rem] w-[0.72rem] sm:h-[0.78rem] sm:w-[0.78rem]" aria-hidden>
      <path
        fill="#a1887f"
        d="M3 9c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5v.5H3V9zm5 1.5v3.5h-1v-3.5"
      />
      <ellipse cx="8" cy="6" rx="4.5" ry="3" fill="#bcaaa4" />
    </svg>
  );
}

function iconForCode(code: string) {
  switch (code) {
    case "gluten":
      return <IconGluten />;
    case "milk":
      return <IconMilk />;
    case "eggs":
      return <IconEggs />;
    case "fish":
      return <IconFish />;
    case "crustaceans":
      return <IconCrustaceans />;
    case "molluscs":
      return <IconMolluscs />;
    case "peanuts":
      return <IconPeanuts />;
    case "soy":
      return <IconSoy />;
    case "nuts":
      return <IconNuts />;
    case "celery":
      return <IconCelery />;
    case "mustard":
      return <IconMustard />;
    case "sesame":
      return <IconSesame />;
    case "sulphites":
      return <IconSulphites />;
    case "lupin":
      return <IconLupin />;
    case "alcohol":
      return <IconAlcohol />;
    case "vegetarian":
      return <IconVegetarian />;
    case "garlic":
      return <IconGarlic />;
    case "mushroom":
      return <IconMushroom />;
    default:
      return null;
  }
}

type AllergenIconRowProps = {
  codes: string[];
  className?: string;
  /** Larger icons on dashboard rows */
  variant?: "guest" | "dense";
};

export function AllergenIconRow({ codes, className = "", variant = "guest" }: AllergenIconRowProps) {
  if (!codes.length) return null;
  const isGuest = variant === "guest";
  const box = isGuest ? GUEST_BOX : DENSE_BOX;
  const imgClass = isGuest
    ? "h-5 w-5 object-contain sm:h-6 sm:w-6"
    : "h-3 w-3 object-contain";
  const svgBoost = isGuest ? "[&_svg]:!h-5 [&_svg]:!w-5 sm:[&_svg]:!h-6 sm:[&_svg]:!w-6" : "";
  return (
    <span
      className={`inline-flex flex-wrap items-center ${isGuest ? "gap-1" : "gap-0.5"} ${className}`}
      role="list"
      aria-label="Allergens and dietary markers"
    >
      {codes.map((code) => {
        const label = allergenLabel(code);
        const src = allergenPhotoSrc(code);
        const inner = src ? (
          <img
            src={src}
            alt=""
            className={imgClass}
            loading="lazy"
            decoding="async"
          />
        ) : (
          iconForCode(code)
        );
        if (!inner) return null;
        return (
          <span key={code} role="listitem" title={label} className={`${box} bg-white/90 ${svgBoost}`}>
            <span className="sr-only">{label}</span>
            {inner}
          </span>
        );
      })}
    </span>
  );
}
