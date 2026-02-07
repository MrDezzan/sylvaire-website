import type { Metadata } from "next";
import "./globals.css";
import ConditionalLayout from "@/components/ConditionalLayout";
import Providers from "@/components/Providers";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Sylvaire — Приватный сервер Minecraft",
  description: "Присоединяйся к сообществу игроков. Строй, исследуй и создавай историю вместе с нами.",
  keywords: ["minecraft", "сервер", "приватный", "выживание", "ванилла", "sylvaire"],
  icons: {
    icon: "/assets/logo.png",
    shortcut: "/assets/logo.png",
    apple: "/assets/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        <Providers>
          <MaintenanceGuard>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </MaintenanceGuard>
          <Toaster position="top-right" richColors theme="dark" />
        </Providers>
      </body>
    </html>
  );
}
