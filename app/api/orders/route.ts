import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { orderTotal, type OrderDraft } from "@/lib/order";

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return NextResponse.json({ ok: true, rows: [] });
  try {
    const sql = neon(databaseUrl);
    await sql`ALTER TABLE taiyaki_orders ADD COLUMN IF NOT EXISTS handed boolean NOT NULL DEFAULT false`;
    const rows = await sql`SELECT id, customer_name, affiliation, contact, total_yen, order_data, handed, created_at FROM taiyaki_orders ORDER BY created_at DESC LIMIT 100`;
    return NextResponse.json({ ok: true, rows });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "注文の取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const draft = (await request.json()) as OrderDraft;
  const total = orderTotal(draft);
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ ok: true, saved: false, message: "Neon未接続のデモ注文です", total });
  }
  try {
    const sql = neon(databaseUrl);
    await sql`CREATE TABLE IF NOT EXISTS taiyaki_orders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_name text NOT NULL, affiliation text, contact text, order_data jsonb NOT NULL, total_yen integer NOT NULL, handed boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now())`;
    await sql`ALTER TABLE taiyaki_orders ADD COLUMN IF NOT EXISTS handed boolean NOT NULL DEFAULT false`;
    await sql`INSERT INTO taiyaki_orders (customer_name, affiliation, contact, order_data, total_yen, handed) VALUES (${draft.customer.name}, ${draft.customer.affiliation}, ${draft.customer.contact}, ${JSON.stringify(draft)}, ${total}, false)`;
    return NextResponse.json({ ok: true, saved: true, total });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "保存に失敗しました" }, { status: 500 });
  }
}
