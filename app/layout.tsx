import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "たい焼き文化祭オーダー",
  description: "たい焼きと合格体験記の注文管理ツール",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
