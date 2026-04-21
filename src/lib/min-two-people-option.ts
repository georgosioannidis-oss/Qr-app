type GenericChoice = {
  id: string;
  label: string;
  priceCents: number;
};

type GenericGroup = {
  id: string;
  label: string;
  required: boolean;
  type: "single" | "multi";
  choices: GenericChoice[];
};

const MIN_TWO_PEOPLE_GROUP_ID = "people_count_min_two";

const MIN_TWO_PEOPLE_CHOICES: GenericChoice[] = [
  { id: "2", label: "2 άτομα", priceCents: 0 },
  { id: "3", label: "3 άτομα", priceCents: 0 },
  { id: "4", label: "4 άτομα", priceCents: 0 },
  { id: "5", label: "5 άτομα", priceCents: 0 },
  { id: "6", label: "6 άτομα", priceCents: 0 },
  { id: "7", label: "7 άτομα", priceCents: 0 },
  { id: "8", label: "8 άτομα", priceCents: 0 },
];

function normalizeName(v: string) {
  return v.toLowerCase().trim();
}

export function isMinTwoPeopleRequiredItemName(name: string): boolean {
  const n = normalizeName(name);
  return n === "ψαρομεζέδες" || n === "μεζές κρεατικών" || n === "psaromezedes";
}

export function ensureMinTwoPeopleOptionGroup<T extends GenericGroup>(
  itemName: string,
  groups: T[] | undefined
): T[] | undefined {
  if (!isMinTwoPeopleRequiredItemName(itemName)) return groups;
  const source = Array.isArray(groups) ? groups : [];
  const idx = source.findIndex((g) => g.id === MIN_TWO_PEOPLE_GROUP_ID);
  const requiredGroup = {
    id: MIN_TWO_PEOPLE_GROUP_ID,
    label: "Για πόσα άτομα;",
    required: true,
    type: "single" as const,
    choices: MIN_TWO_PEOPLE_CHOICES,
  } as T;
  if (idx === -1) return [requiredGroup, ...source];
  const next = [...source];
  next[idx] = requiredGroup;
  return next;
}
