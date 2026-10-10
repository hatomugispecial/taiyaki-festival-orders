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
type HourlySales = {
  hour: number;
  taiyaki: number;
  taiyakiCount: number;
  memo: number;
  memoCount: number;
  student: number;
  guardian: number;
};
type FlavorSales = { name: string; total: number; count: number };
type FlavorHourlySales = { hour: number; flavors: Record<string, number> };
const yen = (value: number) =>
  new Intl.NumberFormat("ja-JP").format(value) + "円";
const countEntries = (values: Record<string, number>) =>
  Object.entries(values).sort((a, b) => b[1] - a[1]);

export default function SalesPage() {
  const [days, setDays] = useState<SalesDay[]>([]);
  const [hourly, setHourly] = useState<HourlySales[]>([]);
  const [flavors, setFlavors] = useState<FlavorSales[]>([]);
  const [flavorHourly, setFlavorHourly] = useState<FlavorHourlySales[]>([]);
  const [message, setMessage] = useState("");
  const load = () =>
    fetch("/api/sales")
      .then((response) => response.json())
      .then((data) => {
        if (data.ok) {
          setDays(data.days);
          setHourly(data.hourly ?? []);
          setFlavors(data.flavors ?? []);
          setFlavorHourly(data.flavorHourly ?? []);
        } else setMessage(data.message);
      });
  useEffect(() => {
    load();
  }, []);
  const total = days.reduce((sum, day) => sum + day.total, 0);
  const taiyakiTotal = days.reduce((sum, day) => sum + day.taiyakiTotal, 0);
  const memoTotal = days.reduce((sum, day) => sum + day.memoTotal, 0);
  const maxHourlyTaiyaki = Math.max(...hourly.map((item) => item.taiyakiCount), 1);
  const flavorNames = flavors.map((item) => item.name);
  const maxFlavorHourly = Math.max(
    ...flavorHourly.flatMap((item) => Object.values(item.flavors)),
    1,
  );
  const maxHourlyMemo = Math.max(...hourly.map((item) => item.memoCount), 1);
  const bar = (value: number, max: number) =>
    `${Math.max(value > 0 ? 4 : 0, (value / max) * 100)}%`;

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
      {days.length > 0 && (
        <section className="sales-charts">
          <div className="chart-panel">
            <div className="chart-heading">
              <h3>たい焼きの時間帯別販売数</h3>
              <span>10:00〜16:59 / 1時間単位</span>
            </div>
            <div className="chart-with-axis">
              <div className="y-axis"><span>{maxHourlyTaiyaki}個</span><span>{Math.round(maxHourlyTaiyaki / 2)}個</span><span>0個</span></div>
              <div className="bar-chart hourly-chart">
              {hourly.map((item) => (
                <div className="bar-column" key={item.hour}>
                  <strong>{item.taiyakiCount}個</strong>
                  <div className="bar-track">
                    <i
                      style={{ height: bar(item.taiyakiCount, maxHourlyTaiyaki) }}
                    />
                  </div>
                  <span>{String(item.hour).padStart(2, "0")}時</span>
                </div>
              ))}
              </div>
            </div>
          </div>
          <div className="chart-panel">
            <div className="chart-heading">
              <h3>味ごとのたい焼き販売数推移</h3>
              <span>個数 / 10:00〜16:59</span>
            </div>
            <div className="legend">
              {flavorNames.map((name, index) => (
                <span
                  className={`legend-flavor flavor-${index % 4}`}
                  key={name}
                >
                  {name}
                </span>
              ))}
            </div>
            <div className="chart-with-axis">
              <div className="y-axis"><span>{maxFlavorHourly}個</span><span>{Math.round(maxFlavorHourly / 2)}個</span><span>0個</span></div>
              <div className="bar-chart hourly-chart flavor-trend-chart">
              {flavorHourly.map((item) => (
                <div className="bar-column" key={item.hour}>
                  <strong>
                    {Object.values(item.flavors).reduce(
                      (sum, value) => sum + value,
                      0,
                    )}
                    個
                  </strong>
                  <div className="bar-track flavor-bars">
                    {flavorNames.map((name, index) => (
                      <i
                        className={`flavor-bar flavor-${index % 4}`}
                        style={{
                          height: bar(item.flavors[name] ?? 0, maxFlavorHourly),
                        }}
                        key={name}
                      />
                    ))}
                  </div>
                  <span>{String(item.hour).padStart(2, "0")}時</span>
                </div>
              ))}
              </div>
            </div>
          </div>
          <div className="chart-panel memo-chart-panel">
            <div className="chart-heading">
              <h3>合格体験記の時間帯別販売数</h3>
              <span>10:00〜16:59 / 1時間単位</span>
            </div>
            <div className="legend">
              <span className="legend-all">全体</span>
              <span className="legend-student">学生版</span>
              <span className="legend-guardian">保護者版</span>
            </div>
            <div className="chart-with-axis">
              <div className="y-axis"><span>{maxHourlyMemo}冊</span><span>{Math.round(maxHourlyMemo / 2)}冊</span><span>0冊</span></div>
              <div className="bar-chart hourly-chart">
              {hourly.map((item) => (
                <div className="bar-column memo-bars" key={item.hour}>
                  <strong>{item.memoCount}冊</strong>
                  <div className="bar-track">
                    <i
                      className="bar-all"
                      style={{ height: bar(item.memoCount, maxHourlyMemo) }}
                    />
                       <i
                         className="bar-student"
                         style={{ height: bar(item.student, maxHourlyMemo) }}
                       />
                    <i
                      className="bar-guardian"
                      style={{
                           height: bar(item.guardian, maxHourlyMemo),
                      }}
                    />
                  </div>
                  <span>{String(item.hour).padStart(2, "0")}時</span>
                </div>
              ))}
              </div>
            </div>
          </div>
        </section>
      )}
      <div className="sales-note">
        <BarChart3 size={16} /> 集計は注文確定時の注文内容をもとにしています。
      </div>
    </main>
  );
}
