import "./globals.css";
import POSLayout from "@/components/POSLayout";
import { Providers } from "@/components/Providers";
import AuthGuard from "@/components/AuthGuard";

export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "POS Mobile",
  description: "Premium Point of Sale System",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full overflow-x-hidden antialiased">
        <Providers>
          <AuthGuard>
            <POSLayout>{children}</POSLayout>
          </AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
