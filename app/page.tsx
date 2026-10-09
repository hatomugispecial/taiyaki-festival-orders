"use client";

import Link from "next/link";
import { Check, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { flavors, memoTotal, orderTotal, taiyakiTotal, taiyakiUnitPrice, toppings, yen, type Customer, type OrderDraft, type TaiyakiItem, type Topping } from "@/lib/order";

const emptyCustomer: Customer = { name: "", affiliation: "", contact: "", memo: "", age: "", gender: "", reasons: [], freeReason: "" };
const emptyTaiyaki: TaiyakiItem[] = flavors.map((flavor) => ({ flavor, toppings: [], quantity: 0 }));
const ageOptions = ["10代未満", "10代", "20代", "30代", "40代", "50代", "60代以上"];
const genderOptions = ["女性", "男性", "回答しない", "その他"];
const reasonOptions = ["受験生の子どもがいるから", "人に教えたいから", "自由記述"];

function Quantity({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <div className="quantity"><button type="button" aria-label="減らす" onClick={() => onChange(Math.max(0, value - 1))}><Minus size={15} /></button><strong>{value}</strong><button type="button" aria-label="増やす" onClick={() => onChange(value + 1)}><Plus size={15} /></button></div>;
}

export default function OrderPage() {
  const [taiyaki, setTaiyaki] = useState(emptyTaiyaki);
  const [memos, setMemos] = useState({ student: 0, guardian: 0 });
  const [instagramFollow, setInstagramFollow] = useState(false);
  const [customer, setCustomer] = useState(emptyCustomer);
  const [message, setMessage] = useState("");
  const [completed, setCompleted] = useState(false);
  const draft: OrderDraft = { customer, taiyaki, memos, instagramFollow };
  const total = orderTotal(draft);
  const updateTaiyaki = (index: number, patch: Partial<TaiyakiItem>) => setTaiyaki((items) => items.map((item, i) => i === index ? { ...item, ...patch } : item));
  const toggleTopping = (index: number, topping: Topping) => setTaiyaki((items) => items.map((item, i) => i === index ? { ...item, toppings: item.toppings.includes(topping) ? item.toppings.filter((value) => value !== topping) : [...item.toppings, topping] } : item));
  const toggleReason = (reason: string) => setCustomer((current) => ({ ...current, reasons: current.reasons.includes(reason) ? current.reasons.filter((item) => item !== reason) : [...current.reasons, reason] }));
  const canSubmit = total > 0 && customer.name.trim() && customer.age && customer.gender && customer.reasons.length > 0 && (!customer.reasons.includes("自由記述") || customer.freeReason.trim());
  const saveOrder = async () => {
    if (!canSubmit) return;
    setMessage("保存中...");
    const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
    const data = await response.json();
    if (data.ok) { setCompleted(true); setMessage("注文を保存しました"); } else setMessage("保存に失敗しました");
  };
  const reset = () => { setTaiyaki(emptyTaiyaki); setMemos({ student: 0, guardian: 0 }); setInstagramFollow(false); setCustomer(emptyCustomer); setMessage(""); setCompleted(false); };

  return <main className="app-shell"><header className="app-header"><h1>文化祭 注文受付</h1><nav><Link className="nav-active" href="/">注文ページ</Link><Link href="/orders">注文確認 →</Link></nav></header>
    {completed ? <section className="notice-panel"><div className="success-icon"><Check size={28} /></div><h2>注文を確定しました</h2><p>{customer.name} / {yen(total)}</p><div className="button-row"><button className="secondary-button" type="button" onClick={reset}>次の注文</button><Link className="primary-button" href="/orders">注文確認ページへ</Link></div></section> : <><div className="page-title"><h2>注文ページ</h2><p>商品と購入者情報を入力し、注文を確定してください。</p></div><div className="order-layout"><section className="panel"><h3>たい焼き</h3><div className="product-list">{taiyaki.map((item, index) => <div className="product-row" key={item.flavor}><div className="product-name"><strong>{item.flavor}</strong><span>{yen(taiyakiUnitPrice(item, instagramFollow))} / 個</span><div className="option-list">{toppings.map((topping) => <button className={item.toppings.includes(topping) ? "option selected" : "option"} type="button" onClick={() => toggleTopping(index, topping)} key={topping}>{topping}</button>)}</div></div><Quantity value={item.quantity} onChange={(quantity) => updateTaiyaki(index, { quantity })} /></div>)}</div><label className="check-row"><input type="checkbox" checked={instagramFollow} onChange={(event) => setInstagramFollow(event.target.checked)} />公式Instagramフォロー（トッピング 50円引き）</label></section><section className="panel"><h3>合格体験記</h3><div className="memo-list"><div className="simple-row"><span>学生版 <small>500円 / 冊</small></span><Quantity value={memos.student} onChange={(value) => setMemos({ ...memos, student: value })} /></div><div className="simple-row"><span>保護者版 <small>600円 / 冊</small></span><Quantity value={memos.guardian} onChange={(value) => setMemos({ ...memos, guardian: value })} /></div></div><p className="hint">学生版と保護者版を1冊ずつ含む場合、セット価格1,000円。</p></section><section className="panel customer-panel"><h3>購入者情報</h3><div className="form-grid"><label>購入者年代 *<select value={customer.age} onChange={(event) => setCustomer({ ...customer, age: event.target.value })}><option value="">選択してください</option>{ageOptions.map((option) => <option key={option}>{option}</option>)}</select></label><label>性別 *<select value={customer.gender} onChange={(event) => setCustomer({ ...customer, gender: event.target.value })}><option value="">選択してください</option>{genderOptions.map((option) => <option key={option}>{option}</option>)}</select></label><label>名前 *<input value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} placeholder="名前" /></label><label>クラス・所属<input value={customer.affiliation} onChange={(event) => setCustomer({ ...customer, affiliation: event.target.value })} placeholder="クラス・所属（任意）" /></label><label>連絡先<input value={customer.contact} onChange={(event) => setCustomer({ ...customer, contact: event.target.value })} placeholder="連絡先（任意）" /></label></div><fieldset className="reason-fieldset"><legend>購入理由（複数選択可） *</legend><div className="reason-options">{reasonOptions.map((reason) => <label key={reason}><input type="checkbox" checked={customer.reasons.includes(reason)} onChange={() => toggleReason(reason)} />{reason}</label>)}</div>{customer.reasons.includes("自由記述") && <input value={customer.freeReason} onChange={(event) => setCustomer({ ...customer, freeReason: event.target.value })} placeholder="購入理由を入力" />}</fieldset></section><aside className="total-panel"><h3>注文合計</h3><div><span>たい焼き</span><strong>{yen(taiyakiTotal(taiyaki, instagramFollow))}</strong></div><div><span>合格体験記</span><strong>{yen(memoTotal(memos))}</strong></div><hr /><div className="grand-total"><span>合計</span><strong>{yen(total)}</strong></div><button className="primary-button" type="button" disabled={!canSubmit} onClick={saveOrder}>注文確定</button>{message && <p className="message">{message}</p>}</aside></div></>}</main>;
}
