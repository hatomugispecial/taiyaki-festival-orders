import { neon } from "@neondatabase/serverless";
import { yen } from "@/lib/order";

export default async function OrdersPage() {
  const databaseUrl = process.env.DATABASE_URL;
  const rows = databaseUrl ? await neon(databaseUrl)`SELECT id, customer_name, affiliation, total_yen, created_at FROM taiyaki_orders ORDER BY created_at DESC LIMIT 50`.catch(() => []) : [];
  return <main className="shell"><header className="topbar"><div className="brand"><span className="brand-mark">鯛</span><span>たい焼き文化祭 / 受付一覧</span></div></header><section className="single-panel" style={{ marginTop: 50, maxWidth: 860 }}><p className="eyebrow">ORDER HISTORY</p><h2>保存済みの注文</h2>{!databaseUrl ? <p className="lead">DATABASE_URL が未設定です。Neon 接続後に保存された注文がここに表示されます。</p> : rows.length === 0 ? <p className="lead">まだ注文はありません。</p> : <div className="confirm-list">{rows.map((row) => <div key={String(row.id)}><span><strong>{String(row.customer_name)}</strong><br /><small>{String(row.affiliation ?? "")} / {new Date(String(row.created_at)).toLocaleString("ja-JP")}</small></span><strong>{yen(Number(row.total_yen))}</strong></div>)}</div>}</section></main>;
}
