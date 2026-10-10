import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { taiyakiUnitPrice, type OrderDraft } from "@/lib/order";

type SalesDay = {
  date: string;
  total: number;
  taiyakiTotal: number;
  memoTotal: number;
  taiyakiCount: number;
  flavors: Record<string, number>;
  toppings: Record<string, number>;
  memos: { student: number; guardian: number };
};

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return NextResponse.json({ ok: true, days: [] });

  try {
    const sql = neon(databaseUrl);
    const rows =
      await sql`SELECT order_data, total_yen, created_at FROM taiyaki_orders ORDER BY created_at DESC LIMIT 10000`;
    const byDate = new Map<string, SalesDay>();

    for (const row of rows as Record<string, unknown>[]) {
      const draft = row.order_data as OrderDraft;
      const date = new Date(String(row.created_at))
        .toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
        .replaceAll("/", "-");
      const day = byDate.get(date) ?? {
        date,
        total: 0,
        taiyakiTotal: 0,
        memoTotal: 0,
        taiyakiCount: 0,
        flavors: {},
        toppings: {},
        memos: { student: 0, guardian: 0 },
      };
      const taiyakiTotal = (draft.taiyaki ?? []).reduce((sum, item) => {
        const quantity = Number(item.quantity ?? 0);
        day.taiyakiCount += quantity;
        day.flavors[item.flavor] = (day.flavors[item.flavor] ?? 0) + quantity;
        for (const topping of item.toppings ?? [])
          day.toppings[topping] = (day.toppings[topping] ?? 0) + quantity;
        return sum + taiyakiUnitPrice(item) * quantity;
      }, 0);
      const student = Number(draft.memos?.student ?? 0);
      const guardian = Number(draft.memos?.guardian ?? 0);
      const memoTotal = Number(row.total_yen ?? 0) - taiyakiTotal;
      day.total += Number(row.total_yen ?? 0);
      day.taiyakiTotal += taiyakiTotal;
      day.memoTotal += memoTotal;
      day.memos.student += student;
      day.memos.guardian += guardian;
      byDate.set(date, day);
    }

    return NextResponse.json({ ok: true, days: [...byDate.values()] });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "売上の取得に失敗しました",
      },
      { status: 500 },
    );
  }
}
