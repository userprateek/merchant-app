import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import GlobalModal from "@/features/merchant/components/GlobalModal";
import GlobalAlert from "@/features/merchant/components/GlobalAlert";

export const metadata: Metadata = {
  title: "Merchant App",
  description: "Merchant management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <GlobalModal />
        <GlobalAlert />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
