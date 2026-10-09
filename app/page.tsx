"use client";

import Link from "next/link";
import { Check, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { flavors, memoTotal, orderTotal, taiyakiTotal, taiyakiUnitPrice, toppings, yen, type Customer, type OrderDraft, type TaiyakiItem, type Topping } from "@/lib/order";

const emptyCustomer: Customer = { name: "", affiliation: "", contact: "", memo: "", age: "", gender: "", reasons: [], freeReason: "" };
const emptyTaiyaki: TaiyakiItem[] = flavors.map((flavor) => ({ flavor, toppings: [], quantity: 0 }));

function Quantity({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <div className="quantity"><button type="button" aria-label="減らす" onClick={() => onChange(Math.max(0, value - 1))}><Minus size={15} /></button><strong>{value}</strong><button type="button" aria-label="増やす" onClick={() => onChange(value + 1)}><Plus size={15} /></button></div>;
}

export default function OrderPage() {
  const [taiyaki, setTaiyaki] = useState(emptyTaiyaki);
  const [memos, setMemos] = useState({ student: 0, guardian: 0 });
  const [instagramFollow, setInstagramFollow] = useState(false);
  const [message, setMessage] = useState("");
  const [completed, setCompleted] = useState(false);
  const draft: OrderDraft = { customer: emptyCustomer, taiyaki, memos, instagramFollow };
  const total = orderTotal(draft);
  const updateTaiyaki = (index: number, patch: Partial<TaiyakiItem>) => setTaiyaki((items) => items.map((item, i) => i === index ? { ...item, ...patch } : item));
  const toggleTopping = (index: number, topping: Topping) => setTaiyaki((items) => items.map((item, i) => i === index ? { ...item, toppings: item.toppings.includes(topping) ? item.toppings.filter((value) => value !== topping) : [...item.toppings, topping] } : item));
  const saveOrder = async () => {
    if (total === 0) return;
    setMessage("保存中...");
    const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
    const data = await response.json();
    if (data.ok) { setCompleted(true); setMessage("注文を確定しました"); } else setMessage("保存に失敗しました");
  };
  const reset = () => { setTaiyaki(emptyTaiyaki); setMemos({ student: 0, guardian: 0 }); setInstagramFollow(false); setMessage(""); setCompleted(false); };

  return <main className="app-shell"><header className="app-header"><h1>文化祭 注文受付</h1><nav><Link className="nav-active" href="/">注文ページ</Link><Link href="/orders">注文確認 →</Link></nav></header>{completed ? <section className="notice-panel"><div className="success-icon"><Check size={28} /></div><h2>注文を確定しました</h2><p>{yen(total)} / 購入者情報は未入力</p><div className="button-row"><button className="secondary-button" type="button" onClick={reset}>次の注文</button><Link className="primary-button" href="/orders">注文確認ページへ</Link></div></section> : <><div className="page-title"><h2>注文ページ</h2><p>商品を選択して、注文を確定してください。</p></div><div className="order-layout"><section className="panel"><h3>たい焼き</h3><div className="product-list">{taiyaki.map((item, index) => <div className="product-row" key={item.flavor}><div className="product-name"><strong>{item.flavor}</strong><span>{yen(taiyakiUnitPrice(item, instagramFollow))} / 個</span><div className="option-list">{toppings.map((topping) => <button className={item.toppings.includes(topping) ? "option selected" : "option"} type="button" onClick={() => toggleTopping(index, topping)} key={topping}>{topping}</button>)}</div></div><Quantity value={item.quantity} onChange={(quantity) => updateTaiyaki(index, { quantity })} /></div>)}</div><label className="check-row"><input type="checkbox" checked={instagramFollow} onChange={(event) => setInstagramFollow(event.target.checked)} />公式Instagramフォロー（トッピング 50円引き）</label></section><section className="panel"><h3>合格体験記</h3><div className="memo-list"><div className="simple-row"><span>学生版 <small>500円 / 冊</small></span><Quantity value={memos.student} onChange={(value) => setMemos({ ...memos, student: value })} /></div><div className="simple-row"><span>保護者版 <small>600円 / 冊</small></span><Quantity value={memos.guardian} onChange={(value) => setMemos({ ...memos, guardian: value })} /></div></div><p className="hint">学生版と保護者版を1冊ずつ含む場合、セット価格1,000円。</p></section><aside className="total-panel"><h3>注文合計</h3><div><span>たい焼き</span><strong>{yen(taiyakiTotal(taiyaki, instagramFollow))}</strong></div><div><span>合格体験記</span><strong>{yen(memoTotal(memos))}</strong></div><hr /><div className="grand-total"><span>合計</span><strong>{yen(total)}</strong></div><button className="primary-button" type="button" disabled={total === 0} onClick={saveOrder}>注文確定</button>{message && <p className="message">{message}</p>}</aside></div></>}</main>;
}
