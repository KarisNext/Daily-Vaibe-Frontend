// frontend/src/app/client/layout.tsx
import '../../styles/Master.css';
import '../../styles/Gallery.css';
import '../../styles/Home.css';
import '../../styles/components_styles/news/Hero.css';
import '../../styles/components_styles/news/Header.css';
import '../../styles/components_styles/news/Cookies.css';
import '../../styles/components_styles/news/SmallRibbon.css';
import '../../styles/components_styles/news/Horizontal.css';

import '../../styles/Footer.css';
import { ClientSessionProvider } from '@/components/client/hooks/ClientSessions';
import { ClientSessionInitializer } from '@/components/client/ClientSessionInitializer';

export const metadata = {
  title: 'Daily Vaibe.',
  description: 'Stay informed with the latest news, politics, business, Buzz, Sports and more from Daily Vaibe',
  keywords: 'news, politics, business, technology, Kenya, Africa, breaking news',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function ClientSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <ClientSessionProvider>
          <ClientSessionInitializer />
          <div className="client-layout">
            {children}
          </div>
        </ClientSessionProvider>
      </body>
    </html>
  );
}