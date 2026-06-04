import './globals.css';
import type { Metadata, Viewport } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'LWR World Cup Predictor',
  description: 'Lakewood Ranch Adult Soccer Club World Cup predictor and private league table.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#07111f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Nav />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
