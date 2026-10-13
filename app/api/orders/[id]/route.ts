import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { orderTotal, type OrderDraft } from "@/lib/order";

function getSql() {
  const url = process.env.DATABASE_URL;
  return url ? neon(url) : null;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const sql = getSql();
  if (!sql) return NextResponse.json({ ok: false, message: "DATABASE_URL が未設定です" }, { status: 400 });
  const { id } = await context.params;
  const body = await request.json() as { handed: boolean; orderData: OrderDraft };
  try {
    const existing = await sql`SELECT created_at FROM taiyaki_orders WHERE id = ${id}`;
    const total = orderTotal(body.orderData, String(existing[0]?.created_at ?? Date.now()));
    await sql`UPDATE taiyaki_orders SET customer_name = ${body.orderData.customer.name}, affiliation = ${body.orderData.customer.affiliation}, contact = ${body.orderData.customer.contact}, order_data = ${JSON.stringify(body.orderData)}, total_yen = ${total}, handed = ${body.handed} WHERE id = ${id}`;
    return NextResponse.json({ ok: true, total });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const sql = getSql();
  if (!sql) return NextResponse.json({ ok: false, message: "DATABASE_URL が未設定です" }, { status: 400 });
  const { id } = await context.params;
  try {
    await sql`DELETE FROM taiyaki_orders WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "削除に失敗しました" }, { status: 500 });
  }
}