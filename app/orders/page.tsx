"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import {
  flavors,
  orderTotal,
  toppingOptions,
  toppings,
  yen,
  type Customer,
  type OrderDraft,
  type TaiyakiItem,
  type Topping,
} from "@/lib/order";

type OrderRow = {
  id: string;
  order_date: string | null;
  order_number: number | null;
  total_yen: number;
  order_data: OrderDraft;
  handed: boolean;
  created_at: string;
};
const emptyCustomer: Customer = {
  name: "",
  affiliation: "",
  contact: "",
  memo: "",
  age: "",
  gender: "",
  reasons: [],
  freeReason: "",
};
const ageOptions = [
  "10代未満",
  "10代",
  "20代",
  "30代",
  "40代",
  "50代",
  "60代以上",
];
const genderOptions = ["女性", "男性", "回答しない", "その他"];
const reasonOptions = [
  "受験生の子どもがいるから",
  "人に教えたいから",
  "自由記述",
];
const emptyTaiyaki = (): TaiyakiItem[] =>
  flavors.flatMap((flavor) =>
    toppingOptions.map((option) => ({
      flavor,
      toppings: option.toppings,
      quantity: 0,
      instagramFollow: false,
    })),
  );

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
        aria-label="減らす"
        onClick={() => onChange(Math.max(0, value - 1))}
      >
        −
      </button>
      <strong>{value}</strong>
      <button
        type="button"
        aria-label="増やす"
        onClick={() => onChange(value + 1)}
      >
        ＋
      </button>
    </div>
  );
}

export default function OrdersPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<OrderDraft | null>(null);
  const [message, setMessage] = useState("");
  const load = () =>
    fetch("/api/orders")
      .then((response) => response.json())
      .then((data) => {
        if (data.ok) setRows(data.rows);
        else setMessage(data.message);
      });
  useEffect(() => {
    load();
  }, []);
  const startEdit = (row: OrderRow) => {
    setEditing(row.id);
    setDraft({
      customer: { ...emptyCustomer, ...(row.order_data?.customer ?? {}) },
      taiyaki: row.order_data?.taiyaki?.length
        ? row.order_data.taiyaki.map((item) => ({
            ...item,
            instagramFollow: item.instagramFollow ?? false,
          }))
        : emptyTaiyaki(),
      memos: {
        student: row.order_data?.memos?.student ?? 0,
        guardian: row.order_data?.memos?.guardian ?? 0,
      },
      instagramFollow: false,
    });
  };
  const updateItem = (index: number, patch: Partial<TaiyakiItem>) =>
    setDraft((current) =>
      current
        ? {
            ...current,
            taiyaki: current.taiyaki.map((item, itemIndex) =>
              itemIndex === index ? { ...item, ...patch } : item,
            ),
          }
        : current,
    );
  const toggleTopping = (index: number, topping: Topping) =>
    setDraft((current) =>
      current
        ? {
            ...current,
            taiyaki: current.taiyaki.map((item, itemIndex) =>
              itemIndex === index
                ? {
                    ...item,
                    toppings: item.toppings.includes(topping)
                      ? item.toppings.filter((value) => value !== topping)
                      : [...item.toppings, topping],
                  }
                : item,
            ),
          }
        : current,
    );
  const toggleReason = (reason: string) =>
    setDraft((current) =>
      current
        ? {
            ...current,
            customer: {
              ...current.customer,
              reasons: current.customer.reasons.includes(reason)
                ? current.customer.reasons.filter((item) => item !== reason)
                : [...current.customer.reasons, reason],
            },
          }
        : current,
    );
  const save = async (row: OrderRow, handed = row.handed) => {
    if (!draft) return;
    const response = await fetch(`/api/orders/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handed, orderData: draft }),
    });
    if (response.ok) {
      setEditing(null);
      setDraft(null);
      load();
    } else setMessage("更新に失敗しました");
  };
  const toggleHanded = async (row: OrderRow) => {
    const orderData = row.order_data;
    const response = await fetch(`/api/orders/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handed: !row.handed, orderData }),
    });
    if (response.ok) load();
  };
  const deleteOrder = async (id: string) => {
    if (!window.confirm("この注文を削除しますか？")) return;
    const response = await fetch(`/api/orders/${id}`, { method: "DELETE" });
    if (response.ok) load();
  };
  const summary = (order: OrderDraft) =>
    order.taiyaki
      .filter((item) => item.quantity > 0)
      .map(
        (item) =>
          `${item.flavor}${item.toppings.length ? `（${item.toppings.join("・")}）` : ""}×${item.quantity}`,
      )
      .join("、") || "たい焼きなし";

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>文化祭 注文受付</h1>
        <nav>
          <Link href="/">注文ページ</Link>
          <Link className="nav-active" href="/orders">
            注文確認
          </Link>
          <Link href="/sales">売り上げ</Link>
        </nav>
      </header>
      <div className="page-title">
        <h2>注文確認ページ</h2>
        <p>注文内容の確認・編集、渡し済み管理、削除を行います。</p>
      </div>
      {message && <p className="message">{message}</p>}
      <section className="panel history-panel">
        {rows.length === 0 ? (
          <p className="empty-state">保存された注文はありません。</p>
        ) : (
          <div className="order-cards">
            {rows.map((row) =>
              editing === row.id && draft ? (
                <article className="order-card edit-card" key={row.id}>
                  <div className="order-card-head">
                    <div>
                      <strong>注文内容を編集</strong>
                      <small>
                        {new Date(row.created_at).toLocaleString("ja-JP")}
                      </small>
                    </div>
                  </div>
                  <div className="edit-order-items">
                    <h4>たい焼き</h4>
                    {draft.taiyaki.map((item, index) => (
                      <div className="edit-item" key={item.flavor}>
                        <div>
                          <strong>{item.flavor}</strong>
                          <div className="option-list">
                            {toppings.map((topping) => (
                              <button
                                className={
                                  item.toppings.includes(topping)
                                    ? "option selected"
                                    : "option"
                                }
                                type="button"
                                onClick={() => toggleTopping(index, topping)}
                                key={topping}
                              >
                                {topping}
                              </button>
                            ))}
                          </div>
                          <label className="item-follow">
                            <input
                              type="checkbox"
                              checked={item.instagramFollow}
                              onChange={(event) =>
                                updateItem(index, {
                                  instagramFollow: event.target.checked,
                                })
                              }
                            />
                            Instagram割引
                          </label>
                        </div>
                        <Quantity
                          value={item.quantity}
                          onChange={(quantity) =>
                            updateItem(index, { quantity })
                          }
                        />
                      </div>
                    ))}
                    <h4>合格体験記</h4>
                    <div className="simple-row">
                      <span>
                        学生版 <small>500円 / 冊</small>
                      </span>
                      <Quantity
                        value={draft.memos.student}
                        onChange={(value) =>
                          setDraft({
                            ...draft,
                            memos: { ...draft.memos, student: value },
                          })
                        }
                      />
                    </div>
                    <div className="simple-row">
                      <span>
                        保護者版 <small>600円 / 冊</small>
                      </span>
                      <Quantity
                        value={draft.memos.guardian}
                        onChange={(value) =>
                          setDraft({
                            ...draft,
                            memos: { ...draft.memos, guardian: value },
                          })
                        }
                      />
                    </div>
                    <div className="edit-total">
                      編集後の合計: <strong>{yen(orderTotal(draft, rows.find((row) => row.id === editing)?.created_at))}</strong>
                    </div>
                    <h4>購入者情報</h4>
                    <div className="form-grid">
                      <label>
                        購入者年代
                        <select
                          value={draft.customer.age}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              customer: {
                                ...draft.customer,
                                age: event.target.value,
                              },
                            })
                          }
                        >
                          <option value="">未選択</option>
                          {ageOptions.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        性別
                        <select
                          value={draft.customer.gender}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              customer: {
                                ...draft.customer,
                                gender: event.target.value,
                              },
                            })
                          }
                        >
                          <option value="">未選択</option>
                          {genderOptions.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <fieldset className="reason-fieldset">
                      <legend>購入理由（複数選択可）</legend>
                      <div className="reason-options">
                        {reasonOptions.map((reason) => (
                          <label key={reason}>
                            <input
                              type="checkbox"
                              checked={draft.customer.reasons.includes(reason)}
                              onChange={() => toggleReason(reason)}
                            />
                            {reason}
                          </label>
                        ))}
                      </div>
                      {draft.customer.reasons.includes("自由記述") && (
                        <input
                          value={draft.customer.freeReason}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              customer: {
                                ...draft.customer,
                                freeReason: event.target.value,
                              },
                            })
                          }
                          placeholder="自由記述"
                        />
                      )}
                    </fieldset>
                  </div>
                  <div className="edit-actions">
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => {
                        setEditing(null);
                        setDraft(null);
                      }}
                    >
                      <X size={15} />
                      キャンセル
                    </button>
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => save(row)}
                    >
                      <Check size={15} />
                      注文内容を保存
                    </button>
                  </div>
                </article>
              ) : (
                <article
                  className={row.handed ? "order-card handed" : "order-card"}
                  key={row.id}
                >
                  <div className="order-card-head">
                    <div>
                      <strong>注文 #{row.order_number ?? "-"}</strong>
                      <small>
                        {row.order_date ?? new Date(row.created_at).toLocaleDateString("ja-JP")} / {new Date(row.created_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} /{" "}
                        {yen(Number(row.total_yen))}
                      </small>
                    </div>
                    <span className="delivery-status">
                      {row.handed ? "渡し済み" : "未渡し"}
                    </span>
                  </div>
                  <div className="order-card-body">
                    <p>{summary(row.order_data)}</p>
                    <p>
                      体験記: 学生版 {row.order_data?.memos?.student ?? 0}冊 /
                      保護者版 {row.order_data?.memos?.guardian ?? 0}冊
                    </p>
                    <p>
                      年代: {row.order_data?.customer?.age || "未入力"} / 性別:{" "}
                      {row.order_data?.customer?.gender || "未入力"}
                    </p>
                    <p>
                      購入理由:{" "}
                      {row.order_data?.customer?.reasons?.join("、") ||
                        "未入力"}
                      {row.order_data?.customer?.freeReason
                        ? `（${row.order_data.customer.freeReason}）`
                        : ""}
                    </p>
                  </div>
                  <div className="order-actions">
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => startEdit(row)}
                    >
                      <Pencil size={15} />
                      注文内容を編集
                    </button>
                    <button
                      className={
                        row.handed ? "secondary-button" : "primary-button"
                      }
                      type="button"
                      onClick={() => toggleHanded(row)}
                    >
                      <Check size={15} />
                      {row.handed ? "未渡しに戻す" : "渡し済みにする"}
                    </button>
                    <button
                      className="delete-button"
                      type="button"
                      onClick={() => deleteOrder(row.id)}
                    >
                      <Trash2 size={15} />
                      削除
                    </button>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>
    </main>
  );
}
