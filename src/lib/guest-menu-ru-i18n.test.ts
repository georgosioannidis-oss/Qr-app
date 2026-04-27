import { describe, expect, it } from "vitest";
import {
  localizeGuestMenuCategories,
  translateDemoOptionLabel,
  type GuestMenuCategory,
} from "@/lib/guest-demo-menu-i18n";
import { getGuestMenuUiStrings } from "@/lib/guest-menu-ui-strings";

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
