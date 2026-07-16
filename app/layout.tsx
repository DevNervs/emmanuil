import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://emmanuil-chernivtsi-journal.boris-smuglyakov.chatgpt.site"),
  title: "Еммануїл — євангельська церква Чернівців",
  description: "Еммануїл — християнська церква у Чернівцях: служіння, домашні групи, команда, новини та онлайн.",
  openGraph: {
    title: "Еммануїл — церква, де ти не один",
    description: "Служіння, домашні групи, команда, новини та онлайн-зустрічі церкви у Чернівцях.",
    type: "website",
    locale: "uk_UA",
    images: [
      {
        url: "/og.png",
        width: 1680,
        height: 945,
        alt: "Еммануїл — церква, де ти не один",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Еммануїл — церква, де ти не один",
    description: "Служіння, домашні групи, команда, новини та онлайн-зустрічі церкви у Чернівцях.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="uk"><body>{children}</body></html>;
}
