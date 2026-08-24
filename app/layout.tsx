import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Linktree | Bookchaowalit",
  description: "Editable personal links page.",
  keywords: ["linktree", "tool"],
  authors: [{ name: "Bookchaowalit", url: "https://bookchaowalit.com" }],
  creator: "Bookchaowalit",
  metadataBase: new URL("https://bookchaowalit.com"),
  openGraph: {
    type: "website",
    title: "Linktree | Bookchaowalit",
    description: "Editable personal links page.",
    siteName: "Bookchaowalit",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* THESIS: make a personal link page feel like a living broadcast poster.
OWN-WORLD: cobalt paper, coral sun, lime marks, and hard ink shadows; the profile is a signal, not a dashboard.
STORY: meet the person, choose a door, read the editor's note, then optionally add or remove a local link.
FIRST VIEWPORT: identity and the links themselves dominate; editing remains a deliberate secondary action.
FORM: numbered transmissions, sticker identity, offset shadows, and broadcast notes establish the interaction grammar.
SEED: 586566ac · assigned direction 4 · operate mode.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance */}
        {children}
      </body>
    </html>
  );
}
