"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { orderTotal, taiyakiUnitPrice, yen, type Customer, type OrderDraft } from "@/lib/order";

type OrderRow = { id: string; customer_name: string; affiliation: string | null; contact: string | null; total_yen: number; order_data: OrderDraft; created_at: string };
const emptyCustomer: Customer = { name: "", affiliation: "", contact: "", memo: "" };
const ageOptions = ["10代未満", "10代", "20代", "30代", "40代", "50代", "60代以上"];
const genderOptions = ["女性", "男性", "回答しない", "その他"];
const reasonOptions = ["受験生の子どもがいるから", "人に教えたいから", "自由記述"];

export default function OrdersPage() {
  const [draft] = useState<OrderDraft | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem("taiyaki-order-draft");
    return raw ? JSON.parse(raw) as OrderDraft : null;
  });
  const [customer, setCustomer] = useState(emptyCustomer);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [reasons, setReasons] = useState<string[]>([]);
  const [freeReason, setFreeReason] = useState("");
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [message, setMessage] = useState("");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    fetch("/api/orders").then((response) => response.json()).then((data) => { if (data.ok) setRows(data.rows); });
  }, []);

  const total = draft ? orderTotal({ ...draft, customer }) : 0;
  const toggleReason = (reason: string) => setReasons((current) => current.includes(reason) ? current.filter((item) => item !== reason) : [...current, reason]);
  const saveOrder = async () => {
    if (!draft || !customer.name.trim() || !age || !gender || reasons.length === 0) return;
    const reasonText = reasons.includes("自由記述") && freeReason ? `${reasons.filter((item) => item !== "自由記述").join("、")}${reasons.length > 1 ? "、" : ""}${freeReason}` : reasons.join("、");
    setMessage("保存中...");
    const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, customer: { ...customer, affiliation: `${customer.affiliation}${customer.affiliation ? " / " : ""}年代: ${age} / 性別: ${gender} / 購入理由: ${reasonText}` } }) });
    const data = await response.json();
    if (data.ok) { window.sessionStorage.removeItem("taiyaki-order-draft"); setCompleted(true); setMessage("注文を保存しました"); fetch("/api/orders").then((result) => result.json()).then((latest) => { if (latest.ok) setRows(latest.rows); }); } else setMessage("保存に失敗しました");
  };

  return <main className="app-shell"><header className="app-header"><h1>文化祭 注文受付</h1><nav><Link href="/"><ArrowLeft size={14} /> 注文ページ</Link><Link className="nav-active" href="/orders">注文確認</Link></nav></header>
    <div className="page-title"><h2>注文確認ページ</h2><p>注文内容を確認し、購入者情報を入力して保存してください。</p></div>
    {draft && !completed ? <section className="panel confirmation-panel"><h3>今回の注文</h3><div className="confirm-items">{draft.taiyaki.filter((item) => item.quantity > 0).map((item) => <div key={item.flavor}><span>{item.flavor}{item.toppings.length ? `（${item.toppings.join("・")}）` : ""} × {item.quantity}</span><strong>{yen(taiyakiUnitPrice(item, draft.instagramFollow) * item.quantity)}</strong></div>)}{draft.memos.student > 0 && <div><span>合格体験記・学生版 × {draft.memos.student}</span><strong>{yen(draft.memos.student * 500)}</strong></div>}{draft.memos.guardian > 0 && <div><span>合格体験記・保護者版 × {draft.memos.guardian}</span><strong>{yen(draft.memos.guardian * 600)}</strong></div>}</div><div className="confirm-total"><span>合計</span><strong>{yen(total)}</strong></div><h3 className="buyer-heading">購入者情報</h3><div className="form-grid"><label>購入者年代 *<select value={age} onChange={(event) => setAge(event.target.value)}><option value="">選択してください</option>{ageOptions.map((option) => <option key={option}>{option}</option>)}</select></label><label>性別 *<select value={gender} onChange={(event) => setGender(event.target.value)}><option value="">選択してください</option>{genderOptions.map((option) => <option key={option}>{option}</option>)}</select></label><label>名前 *<input value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} placeholder="名前" /></label><label>クラス・所属<input value={customer.affiliation} onChange={(event) => setCustomer({ ...customer, affiliation: event.target.value })} placeholder="クラス・所属（任意）" /></label><label>連絡先<input value={customer.contact} onChange={(event) => setCustomer({ ...customer, contact: event.target.value })} placeholder="連絡先（任意）" /></label></div><fieldset className="reason-fieldset"><legend>購入理由（複数選択可） *</legend><div className="reason-options">{reasonOptions.map((reason) => <label key={reason}><input type="checkbox" checked={reasons.includes(reason)} onChange={() => toggleReason(reason)} />{reason}</label>)}</div>{reasons.includes("自由記述") && <input value={freeReason} onChange={(event) => setFreeReason(event.target.value)} placeholder="購入理由を入力" />}</fieldset><button className="primary-button" type="button" disabled={!customer.name.trim() || !age || !gender || reasons.length === 0 || (reasons.includes("自由記述") && !freeReason.trim())} onClick={saveOrder}>この注文を保存 <Check size={16} /></button>{message && <p className="message">{message}</p>}</section> : completed ? <section className="notice-panel"><div className="success-icon"><Check size={28} /></div><h2>注文を保存しました</h2><p>注文確認ページに一覧として表示されています。</p><Link className="primary-button" href="/">次の注文を入力</Link></section> : <section className="panel empty-state">注文ページから商品を選択してください。</section>}
    <section className="panel history-panel"><h3>保存済みの注文</h3>{rows.length === 0 ? <p className="empty-state">保存された注文はありません。</p> : <table className="orders-table"><thead><tr><th>受付時刻</th><th>名前</th><th>所属</th><th>合計</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{new Date(row.created_at).toLocaleString("ja-JP")}</td><td>{row.customer_name}</td><td>{row.affiliation || "-"}</td><td>{yen(Number(row.total_yen))}</td></tr>)}</tbody></table>}</section>
  </main>;
}
