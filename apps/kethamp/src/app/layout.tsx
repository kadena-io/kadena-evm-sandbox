import type { Metadata } from 'next';
import { Geist, Kode_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const kodeMono = Kode_Mono({
  variable: '--font-kode-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Kadena @ ETH Denver 2025',
  description: 'Demo app created for ETH Denver 2025',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
      />
      <body
        className={`${geistSans.variable} ${kodeMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
