import { ClerkProvider } from "@clerk/nextjs";
import Header from "./appComponents/Header";
import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Decide ~ Learn ~ Do",
  description: "A website where I am improving my coding skills by building games.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-bg-app text-text">
          <div className="mx-auto w-full px-4 py-6">
            <Header />
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
    
  );
}
