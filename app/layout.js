import "./globals.css";
import POSLayout from "@/components/POSLayout";

export const metadata = {
  title: "POS Mobile",
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
    <html lang="en" className="h-full">
      <body className="h-full overflow-x-hidden">
        <POSLayout>{children}</POSLayout>
      </body>
    </html>
  );
}
