import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { connection } from "next/server";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-open-sans",
});

export const metadata: Metadata = {
  title: "EmprestAI",
  description: "Empréstimo de equipamentos internos",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  return (
    <html className={openSans.variable} lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
