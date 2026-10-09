"use client";

import { useState } from "react";
import {
  Check,
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Instagram,
  UserRound,
} from "lucide-react";
import {
  flavors,
  memoTotal,
  orderTotal,
  taiyakiTotal,
  taiyakiUnitPrice,
  toppings,
  yen,
  type Customer,
  type OrderDraft,
  type TaiyakiItem,
  type Topping,
} from "@/lib/order";

type Step = "order" | "customer" | "confirm" | "done";
const blankCustomer: Customer = {
  name: "",
  affiliation: "",
  contact: "",
  memo: "",
};
const initialTaiyaki: TaiyakiItem[] = flavors.map((flavor) => ({
  flavor,
  toppings: [],
  quantity: 0,
}));

function Quantity({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="quantity">
      <button
        type="button"
        aria-label="数量を減らす"
        onClick={() => onChange(Math.max(0, value - 1))}
      >
        <Minus size={16} />
      </button>
      <strong>{value}</strong>
      <button
        type="button"
        aria-label="数量を増やす"
        onClick={() => onChange(value + 1)}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState<Step>("order");
  const [taiyaki, setTaiyaki] = useState(initialTaiyaki);
  const [memos, setMemos] = useState({ student: 0, guardian: 0 });
  const [instagramFollow, setInstagramFollow] = useState(false);
  const [customer, setCustomer] = useState(blankCustomer);
  const [message, setMessage] = useState("");
  const draft: OrderDraft = { customer, taiyaki, memos, instagramFollow };
  const total = orderTotal(draft);
  const updateTaiyaki = (index: number, patch: Partial<TaiyakiItem>) =>
    setTaiyaki((items) =>
      items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  const toggleTopping = (index: number, topping: Topping) =>
    setTaiyaki((items) =>
      items.map((item, i) =>
        i === index
          ? {
              ...item,
              toppings: item.toppings.includes(topping)
                ? item.toppings.filter((value) => value !== topping)
                : [...item.toppings, topping],
            }
          : item,
      ),
    );
  const saveOrder = async () => {
    setMessage("保存しています...");
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await response.json();
    setMessage(
      data.ok ? (data.message ?? "注文を受け付けました") : "保存に失敗しました",
    );
    if (data.ok) setStep("done");
  };
  const activeItems = taiyaki.filter((item) => item.quantity > 0);

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">鯛</span>
          <span>たい焼き文化祭</span>
        </div>
        <span className="status">
          <span className="status-dot" />
          受付中
        </span>
      </header>
      <section className="hero">
        <div>
          <p className="eyebrow">文化祭 2026 / ORDER DESK</p>
          <h1>
            焼きたてを、
            <br />
            <em>あなたの席へ。</em>
          </h1>
          <p className="hero-copy">
            たい焼きと、先輩たちの合格体験記。
            <br />
            今日だけの組み合わせをどうぞ。
          </p>
        </div>
        <div className="hero-stamp">
          TODAY
          <br />
          <strong>ONLY</strong>
        </div>
      </section>
      <nav className="steps" aria-label="注文ステップ">
        {[
          ["order", "01", "商品を選ぶ"],
          ["customer", "02", "購入者情報"],
          ["confirm", "03", "注文を確認"],
        ].map(([key, number, label], index) => (
          <div
            className={
              step === key ||
              ["customer", "confirm", "done"].indexOf(step) > index
                ? "step active"
                : "step"
            }
            key={key}
          >
            <span>{number}</span>
            {label}
            {index < 2 && <ChevronRight size={15} />}
          </div>
        ))}
      </nav>
      {step === "order" && (
        <div className="content-grid">
          <section>
            <div className="section-heading">
              <div>
                <p className="eyebrow">MENU 01</p>
                <h2>たい焼きを選ぶ</h2>
              </div>
              <span className="section-note">1個 300円〜</span>
            </div>
            <div className="menu-list">
              {taiyaki.map((item, index) => (
                <article className="menu-item" key={item.flavor}>
                  <div className="taiyaki-icon">鯛</div>
                  <div className="item-main">
                    <h3>{item.flavor}</h3>
                    <div className="topping-row">
                      {toppings.map((topping) => (
                        <button
                          type="button"
                          className={
                            item.toppings.includes(topping)
                              ? "chip selected"
                              : "chip"
                          }
                          onClick={() => toggleTopping(index, topping)}
                          key={topping}
                        >
                          {topping}
                        </button>
                      ))}
                    </div>
                    <span className="price">
                      {yen(taiyakiUnitPrice(item, instagramFollow))}
                      <small> / 個</small>
                    </span>
                  </div>
                  <Quantity
                    value={item.quantity}
                    onChange={(quantity) => updateTaiyaki(index, { quantity })}
                  />
                </article>
              ))}
            </div>
            <label
              className={
                instagramFollow ? "follow-banner checked" : "follow-banner"
              }
            >
              <input
                type="checkbox"
                checked={instagramFollow}
                onChange={(event) => setInstagramFollow(event.target.checked)}
              />
              <Instagram size={18} />
              <span>
                <strong>公式Instagramをフォロー</strong>
                <small>トッピングが50円引きになります</small>
              </span>
              <Check className="follow-check" size={18} />
            </label>
          </section>
          <section>
            <div className="section-heading">
              <div>
                <p className="eyebrow">MENU 02</p>
                <h2>合格体験記</h2>
              </div>
              <span className="section-note">セットがお得</span>
            </div>
            <div className="memo-panel">
              <p>先輩たちのリアルな声を、次の挑戦へ。</p>
              {(
                [
                  ["student", "学生版", 500],
                  ["guardian", "保護者版", 600],
                ] as ["student" | "guardian", string, number][]
              ).map(([key, label, price]) => (
                <div className="memo-row" key={key}>
                  <div>
                    <strong>{label}</strong>
                    <span>{yen(price)} / 冊</span>
                  </div>
                  <Quantity
                    value={memos[key]}
                    onChange={(value) => setMemos({ ...memos, [key]: value })}
                  />
                </div>
              ))}
              <div className="set-note">
                <span>学生版＋保護者版</span>
                <strong>セットで {yen(1000)}</strong>
              </div>
            </div>
            <div className="summary-card">
              <div>
                <span>たい焼き</span>
                <strong>{yen(taiyakiTotal(taiyaki, instagramFollow))}</strong>
              </div>
              <div>
                <span>合格体験記</span>
                <strong>{yen(memoTotal(memos))}</strong>
              </div>
              <hr />
              <div className="total">
                <span>合計</span>
                <strong>{yen(total)}</strong>
              </div>
              <button
                className="primary-button"
                type="button"
                disabled={total === 0}
                onClick={() => setStep("customer")}
              >
                購入者情報へ進む <ChevronRight size={18} />
              </button>
            </div>
          </section>
        </div>
      )}
      {step === "customer" && (
        <section className="single-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">CUSTOMER INFO</p>
              <h2>購入者情報</h2>
            </div>
            <UserRound size={28} />
          </div>
          <p className="lead">
            合格体験記をお求めの方は、受け取り時に確認できる情報を入力してください。
          </p>
          <div className="form-grid">
            <label>
              お名前 *
              <input
                value={customer.name}
                onChange={(e) =>
                  setCustomer({ ...customer, name: e.target.value })
                }
                placeholder="例：たい焼き 太郎"
              />
            </label>
            <label>
              クラス・所属
              <input
                value={customer.affiliation}
                onChange={(e) =>
                  setCustomer({ ...customer, affiliation: e.target.value })
                }
                placeholder="例：3年A組"
              />
            </label>
            <label>
              連絡先（任意）
              <input
                value={customer.contact}
                onChange={(e) =>
                  setCustomer({ ...customer, contact: e.target.value })
                }
                placeholder="例：090-0000-0000"
              />
            </label>
            <label>
              メモ（任意）
              <textarea
                value={customer.memo}
                onChange={(e) =>
                  setCustomer({ ...customer, memo: e.target.value })
                }
                placeholder="受け取りについて伝えたいこと"
              />
            </label>
          </div>
          <div className="action-row">
            <button
              className="text-button"
              type="button"
              onClick={() => setStep("order")}
            >
              戻る
            </button>
            <button
              className="primary-button compact"
              type="button"
              disabled={!customer.name.trim()}
              onClick={() => setStep("confirm")}
            >
              注文を確認する <ChevronRight size={18} />
            </button>
          </div>
        </section>
      )}
      {step === "confirm" && (
        <section className="single-panel confirm-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">FINAL CHECK</p>
              <h2>注文内容を確認</h2>
            </div>
            <ShoppingBag size={28} />
          </div>
          <div className="confirm-list">
            {activeItems.map((item) => (
              <div key={item.flavor}>
                <span>
                  {item.flavor}
                  {item.toppings.length
                    ? `（${item.toppings.join("・")}）`
                    : ""}{" "}
                  × {item.quantity}
                </span>
                <strong>
                  {yen(taiyakiUnitPrice(item, instagramFollow) * item.quantity)}
                </strong>
              </div>
            ))}
            {memos.student > 0 && (
              <div>
                <span>合格体験記・学生版 × {memos.student}</span>
                <strong>{yen(memos.student * 500)}</strong>
              </div>
            )}
            {memos.guardian > 0 && (
              <div>
                <span>合格体験記・保護者版 × {memos.guardian}</span>
                <strong>{yen(memos.guardian * 600)}</strong>
              </div>
            )}
          </div>
          <div className="customer-box">
            <strong>{customer.name}</strong>
            <span>
              {customer.affiliation || "所属未入力"} /
              受け取り時にお名前をお伝えください
            </span>
          </div>
          <div className="confirm-total">
            <span>お支払い合計</span>
            <strong>{yen(total)}</strong>
          </div>
          <div className="action-row">
            <button
              className="text-button"
              type="button"
              onClick={() => setStep("customer")}
            >
              戻る
            </button>
            <button
              className="primary-button compact"
              type="button"
              onClick={saveOrder}
            >
              この内容で注文する <Check size={18} />
            </button>
          </div>
          {message && <p className="message">{message}</p>}
        </section>
      )}
      {step === "done" && (
        <section className="single-panel done-panel">
          <div className="done-icon">
            <Check size={38} />
          </div>
          <p className="eyebrow">ORDER RECEIVED</p>
          <h2>ご注文ありがとうございます</h2>
          <p>受付スタッフにお名前を伝えて、商品をお受け取りください。</p>
          <strong className="done-price">{yen(total)}</strong>
          <button
            className="primary-button compact"
            type="button"
            onClick={() => {
              setStep("order");
              setTaiyaki(initialTaiyaki);
              setMemos({ student: 0, guardian: 0 });
              setCustomer(blankCustomer);
              setMessage("");
            }}
          >
            新しい注文を作成
          </button>
        </section>
      )}
      <footer>
        TAIYAKI FESTIVAL ORDER DESK <span>NEON READY</span>
      </footer>
    </main>
  );
}
