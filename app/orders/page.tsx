import Link from "next/link";
import { neon } from "@neondatabase/serverless";
import { yen } from "@/lib/order";

type OrderRow = { id: string; customer_name: string; affiliation: string | null; contact: string | null; total_yen: number; created_at: string };

export default async function OrdersPage() {
  const databaseUrl = process.env.DATABASE_URL;
  const rows: OrderRow[] = databaseUrl ? await neon(databaseUrl)`SELECT id, customer_name, affiliation, contact, total_yen, created_at FROM taiyaki_orders ORDER BY created_at DESC LIMIT 100`.catch(() => []) as OrderRow[] : [];
  return <main className="app-shell"><header className="app-header"><h1>文化祭 注文受付</h1><nav><Link href="/">注文ページ</Link><Link className="nav-active" href="/orders">注文確認</Link></nav></header><div className="page-title"><h2>注文確認ページ</h2><p>保存された注文を新しい順に表示しています。</p></div><section className="panel">{!databaseUrl ? <p className="empty-state">DATABASE_URL が未設定です。Neon接続後に保存された注文を確認できます。</p> : rows.length === 0 ? <p className="empty-state">保存された注文はありません。</p> : <table className="orders-table"><thead><tr><th>受付時刻</th><th>名前</th><th>所属</th><th>連絡先</th><th>合計</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{new Date(row.created_at).toLocaleString("ja-JP")}</td><td>{row.customer_name}</td><td>{row.affiliation || "-"}</td><td>{row.contact || "-"}</td><td>{yen(Number(row.total_yen))}</td></tr>)}</tbody></table>}</section></main>;
}
