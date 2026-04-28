import { describe, expect, it } from "vitest";
import {
  localizeGuestMenuCategories,
  translateDemoOptionLabel,
  type GuestMenuCategory,
} from "@/lib/guest-demo-menu-i18n";
import { getGuestMenuUiStrings } from "@/lib/guest-menu-ui-strings";
import { guestCategoryLabelWithEmoji } from "@/lib/guest-category-emoji";

const hasCyrillic = (s: string) => /[\u0400-\u04FF]/.test(s);

describe("Russian guest menu (moustakallis runtime path)", () => {
  it("exposes Russian UI strings", () => {
    const ru = getGuestMenuUiStrings("ru");
    expect(ru.backToMenu).toBe("Назад к меню");
    expect(ru.langRussian).toBe("Русский");
    expect(hasCyrillic(ru.placeOrder)).toBe(true);
  });

  it("localizes categories and items from demo JSON for slug moustakallis", () => {
    const categories: GuestMenuCategory[] = [
      {
        id: "cat-1",
        name: "Κρύα ορεκτικά",
        items: [
          {
            id: "item-1",
            name: "Ταραμοσαλάτα",
            description: "Απαλό ροζ άλειμμα από αυγά ψαριού, κρεμμύδι και ελαιόλαδο.",
            price: 4.5,
          },
        ],
      },
    ];
    const out = localizeGuestMenuCategories(categories, "ru", "moustakallis");
    expect(out[0].name).not.toBe("Κρύα ορεκτικά");
    expect(hasCyrillic(out[0].name)).toBe(true);
    expect(out[0].items[0].name).not.toBe("Ταραμοσαλάτα");
    expect(hasCyrillic(out[0].items[0].name)).toBe(true);
    expect(out[0].items[0].description).toBeDefined();
    expect(hasCyrillic(out[0].items[0].description ?? "")).toBe(true);
  });

  it("keeps Greek when lang is el", () => {
    const categories: GuestMenuCategory[] = [
      {
        id: "c",
        name: "Κρύα ορεκτικά",
        items: [{ id: "i", name: "Ταραμοσαλάτα", price: 1 }],
      },
    ];
    const out = localizeGuestMenuCategories(categories, "el", "moustakallis");
    expect(out[0].name).toBe("Κρύα ορεκτικά");
    expect(out[0].items[0].name).toBe("Ταραμοσαλάτα");
  });

  it("translates known option labels to Russian", () => {
    expect(translateDemoOptionLabel("Μέγεθος", "ru")).toBe("Размер");
    expect(translateDemoOptionLabel("Χωρίς κρεμμύδια", "ru")).toMatch(/^Без /);
  });
});

describe("French guest menu (moustakallis runtime path)", () => {
  it("exposes French UI strings", () => {
    const fr = getGuestMenuUiStrings("fr");
    expect(fr.backToMenu).toBe("Retour au menu");
    expect(fr.langFrench).toBe("Français");
    expect(fr.placeOrder).toContain("mand");
  });

  it("localizes categories and items from demo JSON for slug moustakallis", () => {
    const categories: GuestMenuCategory[] = [
      {
        id: "cat-1",
        name: "Κρύα ορεκτικά",
        items: [
          {
            id: "item-1",
            name: "Ταραμοσαλάτα",
            description: "Greek desc",
            price: 4.5,
          },
        ],
      },
    ];
    const out = localizeGuestMenuCategories(categories, "fr", "moustakallis");
    expect(out[0].name).not.toBe("Κρύα ορεκτικά");
    expect(out[0].name.length).toBeGreaterThan(2);
    expect(out[0].items[0].name).not.toBe("Ταραμοσαλάτα");
    expect(out[0].items[0].description).toBeDefined();
  });

  it("translates known option labels to French", () => {
    expect(translateDemoOptionLabel("Μέγεθος", "fr")).toBe("Taille");
    expect(translateDemoOptionLabel("Χωρίς κρεμμύδια", "fr")).toMatch(/^Sans /);
  });
});

const hasPolishDiacritics = (s: string) => /[ąćęłńóśźż]/i.test(s);

describe("Polish guest menu (moustakallis runtime path)", () => {
  it("exposes Polish UI strings", () => {
    const pl = getGuestMenuUiStrings("pl");
    expect(pl.backToMenu).toBe("Powrót do menu");
    expect(pl.langPolish).toBe("Polski");
    expect(hasPolishDiacritics(pl.placeOrder)).toBe(true);
  });

  it("localizes categories and items from demo JSON for slug moustakallis", () => {
    const categories: GuestMenuCategory[] = [
      {
        id: "cat-1",
        name: "Κρύα ορεκτικά",
        items: [
          {
            id: "item-1",
            name: "Ταραμοσαλάτα",
            description: "Greek desc",
            price: 4.5,
          },
        ],
      },
    ];
    const out = localizeGuestMenuCategories(categories, "pl", "moustakallis");
    expect(out[0].name).toBe("Zimne przekąski");
    expect(out[0].items[0].name).toContain("Taramo");
    expect(out[0].items[0].description).toBeDefined();
    expect(hasPolishDiacritics(out[0].items[0].description ?? "")).toBe(true);
  });

  it("translates known option labels to Polish", () => {
    expect(translateDemoOptionLabel("Μέγεθος", "pl")).toBe("Rozmiar");
    expect(translateDemoOptionLabel("Χωρίς κρεμμύδια", "pl")).toMatch(/^Bez /);
  });
});

describe("guest category emoji with localized titles", () => {
  it("uses Greek nameEl when display name is not in the emoji map", () => {
    expect(guestCategoryLabelWithEmoji("Zimne przekąski", "Κρύα ορεκτικά")).toMatch(/^🧊 Zimne/);
    expect(guestCategoryLabelWithEmoji("Entrées froides", "Κρύα ορεκτικά")).toMatch(/^🧊 Entrées/);
  });
});
