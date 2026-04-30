import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SystemProvider } from "@/context/SystemContext";
import { ToastProvider } from "@/context/ToastContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Conserva Restaurant",
  description: "Modern management for modern food",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Conserva",
  },
};

export const viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="https://cdn-icons-png.flaticon.com/512/1046/1046788.png" />
      </head>
      <body className={inter.className}>
        <ToastProvider>
          <SystemProvider>
            {children}
          </SystemProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
