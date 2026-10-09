export type Flavor = "あんこ" | "塩あんこ" | "あんバター" | "チーズ";
export type Topping = "アイス" | "ホイップ";
export type MemoType = "学生版" | "保護者版";

export type TaiyakiItem = { flavor: Flavor; toppings: Topping[]; quantity: number };
export type MemoItems = { student: number; guardian: number };
export type Customer = { name: string; affiliation: string; contact: string; memo: string };
export type OrderDraft = { customer: Customer; taiyaki: TaiyakiItem[]; memos: MemoItems; instagramFollow: boolean };

export const flavors: Flavor[] = ["あんこ", "塩あんこ", "あんバター", "チーズ"];
export const toppings: Topping[] = ["アイス", "ホイップ"];

export function taiyakiUnitPrice(item: TaiyakiItem, instagramFollow: boolean) {
  if (item.toppings.length === 0) return 300;
  return instagramFollow ? 300 : 350;
}

export function taiyakiTotal(items: TaiyakiItem[], instagramFollow: boolean) {
  return items.reduce((sum, item) => sum + taiyakiUnitPrice(item, instagramFollow) * item.quantity, 0);
}

export function memoTotal(memos: MemoItems) {
  if (memos.student > 0 && memos.guardian > 0) {
    return 1000 + Math.max(0, memos.student - 1) * 500 + Math.max(0, memos.guardian - 1) * 600;
  }
  return memos.student * 500 + memos.guardian * 600;
}

export function orderTotal(draft: OrderDraft) {
  return taiyakiTotal(draft.taiyaki, draft.instagramFollow) + memoTotal(draft.memos);
}

export function yen(value: number) { return new Intl.NumberFormat("ja-JP").format(value) + "円"; }
