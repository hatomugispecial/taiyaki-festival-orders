import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

function getSql() {
  const url = process.env.DATABASE_URL;
  return url ? neon(url) : null;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const sql = getSql();
  if (!sql) return NextResponse.json({ ok: false, message: "DATABASE_URL が未設定です" }, { status: 400 });
  const { id } = await context.params;
  const body = await request.json() as { handed: boolean; customer: { name: string; affiliation: string; contact: string; memo: string; age: string; gender: string; reasons: string[]; freeReason: string }; orderData: unknown };
  try {
    await sql`UPDATE taiyaki_orders SET customer_name = ${body.customer.name}, affiliation = ${body.customer.affiliation}, contact = ${body.customer.contact}, order_data = ${JSON.stringify(body.orderData)}, handed = ${body.handed} WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
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