import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import ClientChrome from '@/components/layout/ClientChrome';
import AppToaster from '@/components/ui/AppToaster';

export const metadata: Metadata = {
  title: {
    default: 'Zhua Enterprises — Premium Furniture, Curtains & Interior Design | South Africa',
    template: '%s | Zhua Enterprises',
  },
  description: "South Africa's #1 home solutions platform. Shop premium furniture, custom curtains & blinds, and professional interior design services. Delivered across all 9 provinces.",
  keywords: ['furniture South Africa', 'curtains', 'blinds', 'interior design', 'home decor', 'Johannesburg furniture', 'Cape Town curtains'],
  icons: {
    icon: '/logo.jpg?v=2',
    shortcut: '/logo.jpg?v=2',
    apple: '/logo.jpg?v=2',
  },
  openGraph: {
    title: 'Zhua Enterprises — Premium Home Solutions',
    description: "South Africa's #1 home solutions platform",
    type: 'website',
    locale: 'en_ZA',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" data-scroll-behavior="smooth">
      <body suppressHydrationWarning>
        <Script id="strip-fdprocessedid" strategy="beforeInteractive">
          {`(() => {
  const attrName = 'fdprocessedid';
  const selector = '[' + attrName + ']';

  const stripOnElement = (element) => {
    if (!(element instanceof Element)) {
      return;
    }

    if (element.hasAttribute(attrName)) {
      element.removeAttribute(attrName);
    }

    element.querySelectorAll(selector).forEach((node) => {
      node.removeAttribute(attrName);
    });
  };

  stripOnElement(document.documentElement);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes') {
        stripOnElement(mutation.target);
      }

      mutation.addedNodes.forEach((node) => {
        stripOnElement(node);
      });
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [attrName],
  });

  window.addEventListener(
    'load',
    () => {
      window.setTimeout(() => observer.disconnect(), 4000);
    },
    { once: true }
  );

  window.setTimeout(() => observer.disconnect(), 10000);
})();`}
        </Script>
        <AppToaster />
        <ClientChrome>{children}</ClientChrome>
      </body>
    </html>
  );
}
