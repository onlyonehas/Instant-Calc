import './globals.css';

export const metadata = {
  title: 'Instant Calculation',
  description: 'Natural language calculator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
