import type { Metadata } from "next";
import "@fontsource-variable/golos-text";
import "./globals.css";

export const metadata: Metadata = {
  title: "Конструктор исследования",
  description:
    "Рабочая среда для проектирования психологического исследования: от вопроса и гипотез до выборки, методов, анализа и этики.",
  other: { "codex-preview": "development" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
