import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { orderTotal, TAIYAKI_SALE_CUTOVER, type OrderDraft } from "@/lib/order";

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return NextResponse.json({ ok: true, rows: [] });
  try {
    const sql = neon(databaseUrl);
    await sql`ALTER TABLE taiyaki_orders ADD COLUMN IF NOT EXISTS handed boolean NOT NULL DEFAULT false`;
    await sql`ALTER TABLE taiyaki_orders ADD COLUMN IF NOT EXISTS order_date date`;
    await sql`ALTER TABLE taiyaki_orders ADD COLUMN IF NOT EXISTS order_number integer`;
    await sql`WITH numbered AS (SELECT id, ROW_NUMBER() OVER (PARTITION BY (created_at AT TIME ZONE 'Asia/Tokyo')::date ORDER BY created_at, id) AS number, (created_at AT TIME ZONE 'Asia/Tokyo')::date AS date FROM taiyaki_orders) UPDATE taiyaki_orders AS orders SET order_date = numbered.date, order_number = numbered.number FROM numbered WHERE orders.id = numbered.id AND (orders.order_date IS NULL OR orders.order_number IS NULL)`;
    await sql`UPDATE taiyaki_orders SET total_yen = COALESCE((SELECT SUM(COALESCE((item->>'quantity')::int, 0)) FROM jsonb_array_elements(COALESCE(order_data->'taiyaki', '[]'::jsonb)) AS item), 0) * 100 + LEAST(COALESCE((order_data #>> '{memos,student}')::int, 0), COALESCE((order_data #>> '{memos,guardian}')::int, 0)) * 1000 + (COALESCE((order_data #>> '{memos,student}')::int, 0) - LEAST(COALESCE((order_data #>> '{memos,student}')::int, 0), COALESCE((order_data #>> '{memos,guardian}')::int, 0))) * 500 + (COALESCE((order_data #>> '{memos,guardian}')::int, 0) - LEAST(COALESCE((order_data #>> '{memos,student}')::int, 0), COALESCE((order_data #>> '{memos,guardian}')::int, 0))) * 600 WHERE created_at >= ${TAIYAKI_SALE_CUTOVER.toISOString()}`;
    const rows = await sql`SELECT id, order_date, order_number, total_yen, order_data, handed, created_at FROM taiyaki_orders ORDER BY created_at DESC LIMIT 100`;
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
    await sql`CREATE TABLE IF NOT EXISTS taiyaki_orders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_name text NOT NULL, affiliation text, contact text, order_data jsonb NOT NULL, total_yen integer NOT NULL, handed boolean NOT NULL DEFAULT false, order_date date, order_number integer, created_at timestamptz NOT NULL DEFAULT now())`;
    await sql`ALTER TABLE taiyaki_orders ADD COLUMN IF NOT EXISTS handed boolean NOT NULL DEFAULT false`;
    await sql`ALTER TABLE taiyaki_orders ADD COLUMN IF NOT EXISTS order_date date`;
    await sql`ALTER TABLE taiyaki_orders ADD COLUMN IF NOT EXISTS order_number integer`;
    const inserted = await sql`WITH today AS (SELECT (now() AT TIME ZONE 'Asia/Tokyo')::date AS date), next_number AS (SELECT COALESCE(MAX(order_number), 0) + 1 AS number FROM taiyaki_orders, today WHERE order_date = today.date) INSERT INTO taiyaki_orders (customer_name, affiliation, contact, order_data, total_yen, handed, order_date, order_number) SELECT ${draft.customer.name}, ${draft.customer.affiliation}, ${draft.customer.contact}, ${JSON.stringify(draft)}, ${total}, false, today.date, next_number.number FROM today, next_number RETURNING order_number`;
    return NextResponse.json({ ok: true, saved: true, total, orderNumber: inserted[0]?.order_number });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "保存に失敗しました" }, { status: 500 });
  }
}
