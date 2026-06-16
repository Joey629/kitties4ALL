const STORAGE_KEY = 'kitticare-cat-supplies';

export interface SupplyCatalogItem {
  id: string;
  name: string;
  unit: string;
  /** Percent of a full package consumed per day */
  dailyConsumptionPercent: number;
  /** Units to request on restock */
  resupplyQuantity: number;
}

export interface CatSupplyRecord {
  catalogItemId: string;
  /** Remaining stock as a percentage of a full package */
  remainingPercent: number;
  /** Date the remainingPercent was recorded */
  asOfDate: string;
}

export interface CatSupplyStatus extends SupplyCatalogItem {
  remainingPercent: number;
  daysRemaining: number;
  isLow: boolean;
}

export interface CatSupplyBundle {
  catId: string;
  items: CatSupplyRecord[];
}

export const LOW_SUPPLY_THRESHOLD = 20;

const DEFAULT_FOSTER_CATALOG: SupplyCatalogItem[] = [
  {
    id: 'prescription-diet',
    name: 'Prescription diet food',
    unit: 'bag',
    dailyConsumptionPercent: 2.5,
    resupplyQuantity: 1,
  },
  {
    id: 'litter',
    name: 'Clumping litter',
    unit: 'bag',
    dailyConsumptionPercent: 4,
    resupplyQuantity: 1,
  },
  {
    id: 'hairball-paste',
    name: 'Hairball paste',
    unit: 'tube',
    dailyConsumptionPercent: 3,
    resupplyQuantity: 1,
  },
];

const CATALOG: Record<string, SupplyCatalogItem[]> = {
  maple: [
    {
      id: 'prescription-diet',
      name: 'Royal Canin Kitten Food',
      unit: 'bag',
      dailyConsumptionPercent: 2.5,
      resupplyQuantity: 1,
    },
    {
      id: 'hairball-paste',
      name: 'Hairball paste',
      unit: 'tube',
      dailyConsumptionPercent: 3,
      resupplyQuantity: 1,
    },
  ],
};

const SEED: CatSupplyBundle[] = [
  {
    catId: 'maple',
    items: [
      { catalogItemId: 'prescription-diet', remainingPercent: 15, asOfDate: '2026-06-13' },
      { catalogItemId: 'hairball-paste', remainingPercent: 42, asOfDate: '2026-06-13' },
    ],
  },
];

type Listener = (bundles: CatSupplyBundle[]) => void;
const listeners = new Set<Listener>();

function notify(bundles: CatSupplyBundle[]) {
  listeners.forEach((listener) => listener(bundles));
}

function daysBetween(from: string, to: Date) {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000));
}

function computeRemainingPercent(record: CatSupplyRecord, asOf = new Date()) {
  const catalog = getCatalogForCat(record.catalogItemId);
  const dailyRate = catalog?.dailyConsumptionPercent ?? 2;
  const elapsedDays = daysBetween(record.asOfDate, asOf);
  return Math.max(0, record.remainingPercent - elapsedDays * dailyRate);
}

function getCatalogForCat(catalogItemId: string) {
  for (const items of Object.values(CATALOG)) {
    const match = items.find((item) => item.id === catalogItemId);
    if (match) return match;
  }
  return undefined;
}

export function getSupplyCatalog(catId: string): SupplyCatalogItem[] {
  return CATALOG[catId] ?? DEFAULT_FOSTER_CATALOG;
}

export function loadCatSupplyBundles(): CatSupplyBundle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
      return SEED;
    }
    return JSON.parse(raw) as CatSupplyBundle[];
  } catch {
    return SEED;
  }
}

function persist(bundles: CatSupplyBundle[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bundles));
  notify(bundles);
}

export function subscribeCatSupplyBundles(listener: Listener) {
  listener(loadCatSupplyBundles());
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCatSupplyStatuses(catId: string, asOf = new Date()): CatSupplyStatus[] {
  const catalog = getSupplyCatalog(catId);
  if (catalog.length === 0) return [];

  let bundle = loadCatSupplyBundles().find((entry) => entry.catId === catId);
  if (!bundle) {
    const today = new Date().toISOString().slice(0, 10);
    bundle = {
      catId,
      items: catalog.map((item, index) => ({
        catalogItemId: item.id,
        remainingPercent: index === 0 ? 15 : 55,
        asOfDate: today,
      })),
    };
    persist([...loadCatSupplyBundles(), bundle]);
  }

  const records = bundle.items;

  return catalog.map((item) => {
    const record = records.find((entry) => entry.catalogItemId === item.id);
    const remainingPercent = record
      ? computeRemainingPercent(record, asOf)
      : 100;
    const daysRemaining =
      item.dailyConsumptionPercent > 0
        ? Math.ceil(remainingPercent / item.dailyConsumptionPercent)
        : 999;
    return {
      ...item,
      remainingPercent: Math.round(remainingPercent),
      daysRemaining,
      isLow: remainingPercent <= LOW_SUPPLY_THRESHOLD,
    };
  });
}

export function hasLowSupplies(catId: string) {
  return getCatSupplyStatuses(catId).some((item) => item.isLow);
}

export function getResupplyLineItems(catId: string) {
  return getSupplyCatalog(catId).map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.resupplyQuantity,
    unit: item.unit,
  }));
}

export function restockCatSupplies(catId: string) {
  const catalog = getSupplyCatalog(catId);
  if (catalog.length === 0) return;

  const today = new Date().toISOString().slice(0, 10);
  const bundles = loadCatSupplyBundles().filter((entry) => entry.catId !== catId);
  bundles.push({
    catId,
    items: catalog.map((item) => ({
      catalogItemId: item.id,
      remainingPercent: 100,
      asOfDate: today,
    })),
  });
  persist(bundles);
}
