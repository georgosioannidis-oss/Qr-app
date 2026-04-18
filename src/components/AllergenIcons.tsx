"use client";

import { useState, type ReactNode } from "react";

import { allergenPhotoSrc } from "@/lib/allergen-assets";
import { allergenLabel } from "@/lib/allergens";

/**
 * EU-style allergen marks: solid colour disc + white silhouette
 * (aligned with common “food allergen icons” chart layouts).
 */
const svgCls = "h-full w-full";

const GUEST_BOX =
  "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ring-black/15 shadow-sm overflow-hidden sm:h-6 sm:w-6";
const DENSE_BOX =
  "inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-full ring-1 ring-black/12 overflow-hidden [&_svg]:!h-full [&_svg]:!w-full [&_img]:!h-full [&_img]:!w-full";

function AllergenMark({ fill, children }: { fill: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className={svgCls} aria-hidden>
      <circle cx="12" cy="12" r="11" fill={fill} />
      <g fill="#fff">{children}</g>
    </svg>
  );
}

function IconGluten() {
  return (
    <AllergenMark fill="#f1c40f">
      <rect x="11.1" y="5" width="1.8" height="15" rx="0.4" />
      <ellipse cx="12" cy="4.2" rx="1.4" ry="1.6" />
      <ellipse cx="9.2" cy="6.5" rx="1.5" ry="2" transform="rotate(-35 9.2 6.5)" />
      <ellipse cx="14.8" cy="6.5" rx="1.5" ry="2" transform="rotate(35 14.8 6.5)" />
      <ellipse cx="8.8" cy="9.2" rx="1.45" ry="2" transform="rotate(-38 8.8 9.2)" />
      <ellipse cx="15.2" cy="9.2" rx="1.45" ry="2" transform="rotate(38 15.2 9.2)" />
      <ellipse cx="8.6" cy="12.2" rx="1.4" ry="1.95" transform="rotate(-40 8.6 12.2)" />
      <ellipse cx="15.4" cy="12.2" rx="1.4" ry="1.95" transform="rotate(40 15.4 12.2)" />
      <ellipse cx="9" cy="15" rx="1.35" ry="1.85" transform="rotate(-42 9 15)" />
      <ellipse cx="15" cy="15" rx="1.35" ry="1.85" transform="rotate(42 15 15)" />
      <ellipse cx="9.6" cy="17.6" rx="1.25" ry="1.7" transform="rotate(-44 9.6 17.6)" />
      <ellipse cx="14.4" cy="17.6" rx="1.25" ry="1.7" transform="rotate(44 14.4 17.6)" />
    </AllergenMark>
  );
}

function IconMilk() {
  return (
    <AllergenMark fill="#3949ab">
      <path d="M5.2 8.8h4V6.9L8.6 5.2H6.5L5.6 7v1.8zm1.1 1.2h1.8v9.8a1 1 0 01-1 1H7.3a1 1 0 01-1-1V10z" />
      <path d="M14.5 9.8h5v9a1.3 1.3 0 01-1.3 1.3h-2.4a1.3 1.3 0 01-1.3-1.3V9.8z" />
      <path d="M14.5 9.8c0-1.7 1.1-3 2.5-3s2.5 1.3 2.5 3h-5z" />
    </AllergenMark>
  );
}

function IconEggs() {
  return (
    <AllergenMark fill="#ff9800">
      <ellipse cx="12" cy="14" rx="7.2" ry="5.2" />
      <circle cx="12" cy="12.2" r="3.3" />
    </AllergenMark>
  );
}

function IconFish() {
  const bg = "#42a5f5";
  return (
    <AllergenMark fill={bg}>
      {/* Tail left → head right; then mirror to match chart (head left): flip x */}
      <g transform="translate(24 0) scale(-1 1)">
        <path d="M3 12L7.5 7v3H14c4.2 0 7 1.8 7 2s-2.8 2-7 2H7.5v3L3 12z" />
        <path d="M14.5 7.5L16.5 5l1 3.5h-3z" />
        <path d="M14.5 16.5L16.5 19l1-3.5h-3z" />
        <path
          fill="none"
          stroke="#fff"
          strokeWidth="0.85"
          strokeLinecap="round"
          d="M10.5 12.3c0.9-1.1 2.1-1.6 3.3-1.4"
        />
        <circle cx="7.9" cy="12" r="1.25" fill={bg} />
        <circle cx="7.75" cy="12" r="0.6" fill="#fff" />
      </g>
    </AllergenMark>
  );
}

function IconCrustaceans() {
  return (
    <AllergenMark fill="#ec407a">
      <ellipse cx="12" cy="14.5" rx="5.2" ry="3.6" />
      <path d="M7.5 6.5c-1.8 1-3 2.8-3.2 4.8l2.4 0.6c0.4-1.4 1.3-2.6 2.5-3.4l-1.7-2zm9 0l1.7-2c1.2 0.8 2.1 2 2.5 3.4l2.4-0.6C22.5 9.3 21.3 7.5 19.5 6.5l-1.7 2z" />
      <circle cx="10" cy="13" r="0.85" />
      <circle cx="14" cy="13" r="0.85" />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="1"
        strokeLinecap="round"
        d="M6.8 16.2l-2.2 2.8M8 17.8l-1.4 3M9.6 18.5l-0.6 3M14.4 18.5l0.6 3M16 17.8l1.4 3M17.2 16.2l2.2 2.8"
      />
    </AllergenMark>
  );
}

function IconMolluscs() {
  return (
    <AllergenMark fill="#f06292">
      <path d="M4 14.5c0-4.2 3.6-7.8 8-7.8s8 3.6 8 7.8v1.2H4v-1.2z" />
      <path
        fill="none"
        stroke="#f8bbd0"
        strokeWidth="0.5"
        strokeLinecap="round"
        d="M12 15.2L7.5 8M12 15.2L9 6.8M12 15.2L12 6M12 15.2L15 6.8M12 15.2L16.5 8M12 15.2L18 10"
      />
    </AllergenMark>
  );
}

function IconPeanuts() {
  return (
    <AllergenMark fill="#795548">
      <ellipse cx="9" cy="14" rx="3.8" ry="5.5" transform="rotate(-38 9 14)" />
      <ellipse cx="15" cy="11" rx="3.8" ry="5.5" transform="rotate(42 15 11)" />
      <ellipse cx="14.5" cy="10.5" rx="1.9" ry="2.6" transform="rotate(42 14.5 10.5)" />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="0.85"
        d="M12.5 8.5c1.2 0.6 2 1.8 2.2 3.2"
        opacity="0.9"
      />
    </AllergenMark>
  );
}

function IconSoy() {
  return (
    <AllergenMark fill="#43a047">
      <path d="M5.5 10.5c1-2.5 4-4 8-3.5 3.5 0.4 5.5 2.2 6 4.5 0.3 1.4-0.2 2.8-1.2 3.8-1.5 1.6-4 2-6.5 1.2C8.8 15.5 6 13.8 5.5 10.5z" />
      <circle cx="9.5" cy="11" r="1.5" />
      <circle cx="12.5" cy="10" r="1.65" />
      <circle cx="15.5" cy="11.2" r="1.45" />
      <circle cx="10" cy="17.5" r="1.35" />
      <circle cx="13.5" cy="18" r="1.25" />
    </AllergenMark>
  );
}

function IconNuts() {
  return (
    <AllergenMark fill="#6d4c41">
      <ellipse cx="9.5" cy="12" rx="3.2" ry="3.8" transform="rotate(-25 9.5 12)" />
      <ellipse cx="14.5" cy="11.5" rx="2.4" ry="3.2" transform="rotate(18 14.5 11.5)" />
      <ellipse cx="12.5" cy="15.5" rx="2.8" ry="2.2" transform="rotate(8 12.5 15.5)" />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="0.7"
        opacity="0.5"
        d="M8.2 9.5c1.2-1.8 2.8-2.8 4-2.5"
      />
    </AllergenMark>
  );
}

function IconCelery() {
  return (
    <AllergenMark fill="#2e7d32">
      <path d="M8.5 19.5V8.2c0.8-1.8 1.6-3 2.2-3.5l0.8 14.8h-3z" />
      <path d="M12 20V6.5c0.5-0.6 1-1.5 1.3-2.8L13.2 20H12z" />
      <path d="M15.5 19.2V8.5c0.6 1.2 1.4 2.2 2.2 3.2v7.5h-2.2z" />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="0.85"
        strokeLinecap="round"
        d="M6.5 7.5c1.2-1.5 2.5-2.3 3.8-2.5M10 6c0.8-1 1.6-1.6 2.5-1.8M14.5 6.8c1-0.5 2-0.3 3 0.5"
      />
    </AllergenMark>
  );
}

function IconMustard() {
  return (
    <AllergenMark fill="#fb8c00">
      <rect x="9.2" y="4" width="5.6" height="3.2" rx="0.6" />
      <path d="M7 8.5h10v11.5a2.2 2.2 0 01-2.2 2.2H9.2A2.2 2.2 0 017 20V8.5z" />
      <circle cx="12" cy="2.5" r="1.05" />
    </AllergenMark>
  );
}

function IconSesame() {
  return (
    <AllergenMark fill="#7e57c2">
      <ellipse cx="9" cy="11" rx="1.4" ry="2.2" transform="rotate(-25 9 11)" />
      <ellipse cx="12" cy="9.5" rx="1.4" ry="2.3" transform="rotate(5 12 9.5)" />
      <ellipse cx="15" cy="11" rx="1.4" ry="2.2" transform="rotate(25 15 11)" />
      <ellipse cx="10.5" cy="14" rx="1.3" ry="2" transform="rotate(-12 10.5 14)" />
      <ellipse cx="13.8" cy="14.2" rx="1.3" ry="2" transform="rotate(15 13.8 14.2)" />
      <ellipse cx="12" cy="16.8" rx="1.2" ry="1.8" />
    </AllergenMark>
  );
}

function IconLupin() {
  return (
    <AllergenMark fill="#ffc107">
      <path d="M7.5 9.5C7 8 8.5 6.5 10 7c1.2 0.4 1.8 1.8 1.5 3.2-0.2 1-1 2-2 2.5-0.8-1.8-1.5-2.8-2-3.2z" />
      <path d="M11.5 8.5c-0.5-1.8 1-3.2 2.8-3 1.5 0.2 2.5 1.6 2.3 3.2-0.2 1.3-1.2 2.5-2.5 3-0.5-1.6-1.2-2.8-1.6-3.2z" />
      <path d="M15.5 10.5c-0.3-1.6 1.2-2.8 2.8-2.5 1.4 0.2 2.3 1.5 2 3-0.3 1.4-1.5 2.6-3 3-0.2-1.5-0.8-2.8-1.8-3.5z" />
    </AllergenMark>
  );
}

function IconAlcohol() {
  return (
    <AllergenMark fill="#8e24aa">
      <path d="M8.2 4h7.6l-1 8.8c-0.4 1.8-2.2 3.2-4.8 3.2s-4.4-1.4-4.8-3.2L8.2 4z" />
      <path d="M11.2 17h3.6v3.2h-3.6V17z" />
      <path d="M8 21.2h8v1H8v-1.2z" />
    </AllergenMark>
  );
}

function IconMushroom() {
  return (
    <AllergenMark fill="#8d6e63">
      <path d="M4.5 14.5c0-4.5 3.4-7.5 7.5-7.5s7.5 3 7.5 7.5v1H4.5v-1z" />
      <rect x="10" y="14.5" width="4" height="6.5" rx="0.8" />
    </AllergenMark>
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
    case "lupin":
      return <IconLupin />;
    case "alcohol":
      return <IconAlcohol />;
    case "mushroom":
      return <IconMushroom />;
    default:
      return null;
  }
}

function AllergenTile({ code }: { code: string }) {
  const src = allergenPhotoSrc(code);
  const svg = iconForCode(code);
  const [useSvg, setUseSvg] = useState(!src);

  if (src && !useSvg) {
    return (
      <img
        src={src}
        alt=""
        className="h-full w-full object-contain"
        loading="lazy"
        decoding="async"
        onError={() => setUseSvg(true)}
      />
    );
  }
  return svg;
}

type AllergenIconRowProps = {
  codes: string[];
  className?: string;
  variant?: "guest" | "dense";
};

export function AllergenIconRow({ codes, className = "", variant = "guest" }: AllergenIconRowProps) {
  if (!codes.length) return null;
  const isGuest = variant === "guest";
  const box = isGuest ? GUEST_BOX : DENSE_BOX;
  return (
    <span
      className={`inline-flex flex-wrap items-center ${isGuest ? "gap-0.5" : "gap-0.5"} ${className}`}
      role="list"
      aria-label="Allergens and dietary markers"
    >
      {codes.map((code) => {
        const label = allergenLabel(code);
        if (!iconForCode(code)) return null;
        return (
          <span key={code} role="listitem" title={label} className={box}>
            <span className="sr-only">{label}</span>
            <AllergenTile code={code} />
          </span>
        );
      })}
    </span>
  );
}
