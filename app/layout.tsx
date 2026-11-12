import type { Metadata } from "next";
import { Newsreader, Schibsted_Grotesk } from "next/font/google";

import { Providers } from "@/app/providers";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

const schibstedGrotesk = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-schibsted",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nexo Assist | Atendimento",
  description: "Atendimento de TI simples e inteligente para você.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${newsreader.variable} ${schibstedGrotesk.variable} h-full antialiased`}
    >
      <body className={`${schibstedGrotesk.className} min-h-full font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
