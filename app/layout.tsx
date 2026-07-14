import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TicketFlow - Enterprise Dispatch Portal",
  description: "Internal Organization Communications Hub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${inter.className} bg-white text-slate-900 min-h-screen flex flex-col`}>
        
        {/* 👇 Injected Client Side Modular Navbar layout element */}
        <Navbar />

        {/* Internal Application Layout Injection Plane */}
        <main className="flex-1 flex flex-col">{children}</main>
        
      </body>
    </html>
  );
}