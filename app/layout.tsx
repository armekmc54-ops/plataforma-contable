import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Vázquez & Asociados · Firma Contable & Asesoría Fiscal Premium",
  description:
    "Servicios contables de alta precisión, planeación fiscal estratégica, auditoría de nóminas y blindaje ante el SAT para profesionistas independientes y empresas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-zinc-200 selection:bg-accent/20 selection:text-zinc-100`}
      >
        {children}
      </body>
    </html>
  );
}
