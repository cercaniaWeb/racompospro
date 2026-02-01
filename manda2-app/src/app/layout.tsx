import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Manda2 | Tu Súper en Minutos",
  description: "La forma más fresca de hacer el súper.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-gray-50 flex justify-center text-slate-900`}>
        {/* Mobile-first centered container */}
        <div className="w-full max-w-[480px] bg-[hsl(var(--background))] min-h-screen relative shadow-2xl overflow-hidden flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
