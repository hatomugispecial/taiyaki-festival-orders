"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";

type SalesDay = {
  date: string;
  total: number;
  taiyakiTotal: number;
  memoTotal: number;
  taiyakiCount: number;
  flavors: Record<string, number>;
  toppings: Record<string, number>;
  memos: { student: number; guardian: number };
};
const yen = (value: number) =>
  new Intl.NumberFormat("ja-JP").format(value) + "円";
const countEntries = (values: Record<string, number>) =>
  Object.entries(values).sort((a, b) => b[1] - a[1]);

export default function SalesPage() {
  const [days, setDays] = useState<SalesDay[]>([]);
  const [message, setMessage] = useState("");
  const load = () =>
    fetch("/api/sales")
      .then((response) => response.json())
      .then((data) => {
        if (data.ok) setDays(data.days);
        else setMessage(data.message);
      });
  useEffect(() => {
    load();
  }, []);
  const total = days.reduce((sum, day) => sum + day.total, 0);
  const taiyakiTotal = days.reduce((sum, day) => sum + day.taiyakiTotal, 0);
  const memoTotal = days.reduce((sum, day) => sum + day.memoTotal, 0);

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>文化祭 注文受付</h1>
        <nav>
          <Link href="/">注文ページ</Link>
          <Link href="/orders">注文確認</Link>
          <Link className="nav-active" href="/sales">
            売り上げ
          </Link>
        </nav>
      </header>
      <div className="page-title sales-title">
        <div>
          <h2>売り上げ</h2>
          <p>日ごとの売上と商品の販売数を確認します。</p>
        </div>
        <button className="secondary-button" type="button" onClick={load}>
          <RefreshCw size={15} />
          更新
        </button>
      </div>
      {message && <p className="message">{message}</p>}
      <section className="sales-summary">
        <div>
          <span>総売上</span>
          <strong>{yen(total)}</strong>
        </div>
        <div>
          <span>たい焼き</span>
          <strong>{yen(taiyakiTotal)}</strong>
        </div>
        <div>
          <span>合格体験記</span>
          <strong>{yen(memoTotal)}</strong>
        </div>
      </section>
      {days.length === 0 ? (
        <section className="panel empty-state">
          売上データがありません。注文を確定すると、ここに日別集計が表示されます。
        </section>
      ) : (
        <div className="sales-days">
          {days.map((day) => (
            <section className="panel sales-day" key={day.date}>
              <div className="sales-day-head">
                <h3>{day.date}</h3>
                <strong>{yen(day.total)}</strong>
              </div>
              <div className="sales-kpis">
                <div>
                  <span>たい焼き売上</span>
                  <strong>{yen(day.taiyakiTotal)}</strong>
                  <small>{day.taiyakiCount}個</small>
                </div>
                <div>
                  <span>体験記売上</span>
                  <strong>{yen(day.memoTotal)}</strong>
                  <small>
                    学生 {day.memos.student}冊 / 保護者 {day.memos.guardian}冊
                  </small>
                </div>
              </div>
              <div className="sales-breakdown">
                <div>
                  <h4>味別</h4>
                  {countEntries(day.flavors).length === 0 ? (
                    <p>なし</p>
                  ) : (
                    countEntries(day.flavors).map(([name, count]) => (
                      <div className="sales-line" key={name}>
                        <span>{name}</span>
                        <strong>{count}個</strong>
                      </div>
                    ))
                  )}
                </div>
                <div>
                  <h4>トッピング別</h4>
                  {countEntries(day.toppings).length === 0 ? (
                    <p>なし</p>
                  ) : (
                    countEntries(day.toppings).map(([name, count]) => (
                      <div className="sales-line" key={name}>
                        <span>{name}</span>
                        <strong>{count}個</strong>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
      <div className="sales-note">
        <BarChart3 size={16} /> 集計は注文確定時の注文内容をもとにしています。
      </div>
    </main>
  );
}
