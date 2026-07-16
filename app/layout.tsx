import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Еммануїл — християнська церква Чернівців",
  description:
    "Еммануїл — християнська церква у Чернівцях: спільнота, домашні групи, новини та служіння.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
