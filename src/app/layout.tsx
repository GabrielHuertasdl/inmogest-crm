import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { APP_NAME } from "@/lib/constants";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-poppins" });

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: `${APP_NAME} – CRM inmobiliario`,
  icons: { icon: "/brand/icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={poppins.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
