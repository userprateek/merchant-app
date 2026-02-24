import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import GlobalModal from "@/features/merchant/components/GlobalModal";
import ConfirmModal from "@/components/ConfirmModal";

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
        <ConfirmModal />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
