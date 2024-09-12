import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Instant Calculation",
  description: "Natural language calculator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head></head>
      <body className={(inter.className, "min-h-screen flex flex-col")}>
        {children}
      </body>
    </html>
  );
}
