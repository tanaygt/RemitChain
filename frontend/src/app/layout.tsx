import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RemitChain | Zero-Fee Global Remittances on Stellar",
  description: "Send money home instantly with zero fees. Powered by Stellar Blockchain and USDC.",
  keywords: ["Stellar", "Remittance", "XLM", "USDC", "Blockchain", "Money Transfer"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
