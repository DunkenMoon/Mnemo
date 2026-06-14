import type { Metadata } from "next";
import { Space_Grotesk, Inter, Fira_Code } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { PageTransition } from "@/components/layout/PageTransition";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter" 
});

const firaCode = Fira_Code({ 
  subsets: ["latin"], 
  weight: ["400"], 
  variable: "--font-fira-code" 
});

export const metadata: Metadata = {
  title: "Mnemo — Remember Everything",
  description: "Transform any lecture into a 3D knowledge universe",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${firaCode.variable} antialiased bg-[#050510] text-[#F0F0FF]`}
      >
        <PageTransition>{children}</PageTransition>
        <Toaster />
      </body>
    </html>
  );
}
