export type Flavor = "あんこ" | "塩あんこ" | "あんバター" | "チーズ";
export type Topping = "アイス" | "ホイップ";
export type MemoType = "学生版" | "保護者版";

export type TaiyakiItem = { flavor: Flavor; toppings: Topping[]; quantity: number; instagramFollow: boolean };
export type MemoItems = { student: number; guardian: number };
export type Customer = { name: string; affiliation: string; contact: string; memo: string; age: string; gender: string; reasons: string[]; freeReason: string };
export type OrderDraft = { customer: Customer; taiyaki: TaiyakiItem[]; memos: MemoItems; instagramFollow: boolean };

export const flavors: Flavor[] = ["あんこ", "塩あんこ", "あんバター", "チーズ"];
export const toppings: Topping[] = ["アイス", "ホイップ"];
export const toppingOptions: { label: string; toppings: Topping[] }[] = [
  { label: "トッピングなし", toppings: [] },
  { label: "アイスのみ", toppings: ["アイス"] },
  { label: "ホイップのみ", toppings: ["ホイップ"] },
  { label: "アイスとホイップ", toppings: ["アイス", "ホイップ"] },
];

export const TAIYAKI_SALE_CUTOVER = new Date("2026-10-11T16:45:00+09:00");

export function usesSaleTaiyakiPrice(at: Date | string | number = Date.now()) {
  return new Date(at).getTime() >= TAIYAKI_SALE_CUTOVER.getTime();
}

export function taiyakiUnitPrice(item: TaiyakiItem, at: Date | string | number = Date.now()) {
  if (usesSaleTaiyakiPrice(at)) return 100;
  const basePrice = item.toppings.length === 0 ? 300 : 350;
  return item.instagramFollow ? basePrice - 50 : basePrice;
}

export function taiyakiTotal(items: TaiyakiItem[], at: Date | string | number = Date.now()) {
  return items.reduce((sum, item) => sum + taiyakiUnitPrice(item, at) * item.quantity, 0);
}

export function memoTotal(memos: MemoItems) {
  const sets = Math.min(memos.student, memos.guardian);
  return sets * 1000 + (memos.student - sets) * 500 + (memos.guardian - sets) * 600;
}

export function orderTotal(draft: OrderDraft, at: Date | string | number = Date.now()) {
  return taiyakiTotal(draft.taiyaki, at) + memoTotal(draft.memos);
}

export function yen(value: number) { return new Intl.NumberFormat("ja-JP").format(value) + "円"; }
