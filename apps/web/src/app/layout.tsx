import Header from "./appComponents/Header";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
<body className="min-h-screen bg-bg-app text-text">
  <div className="mx-auto w-full max-w-md px-4 py-6">
    <Header />
    {children}
  </div>
</body>
    </html>
  );
}
