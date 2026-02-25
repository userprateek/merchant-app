import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import GlobalModal from "@/features/merchant/components/GlobalModal";
import ConfirmModal from "@/components/ConfirmModal";
import VersionLogger from "@/components/VersionLogger";

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
        <VersionLogger />
        <GlobalModal />
        <ConfirmModal />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
