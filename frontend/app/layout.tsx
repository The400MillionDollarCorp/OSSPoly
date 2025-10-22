import type { Metadata } from "next";
import "./globals.css";

import { Toaster } from "@/components/ui/toaster";
import PrivyProvider from "@/components/providers/PrivyProvider";
import Header from "@/components/header";
import WagmiProviderWrapper from "@/components/providers/QueryClientWrapper";

import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";

import { wagmiConfig } from "@/lib/wagmiConfig";

export const metadata: Metadata = {
  title: "OSSPoly AI Dashboard",
  description: "Monitor and control the OSSPoly AI Agent",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialState = cookieToInitialState(
    wagmiConfig,
    (await headers()).get("cookie")
  );

  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        <PrivyProvider>
          <WagmiProviderWrapper initialState={initialState}>
            <Header />
            <main>{children}</main>
          </WagmiProviderWrapper>
        </PrivyProvider>
        <Toaster />
      </body>
    </html>
  );
}
