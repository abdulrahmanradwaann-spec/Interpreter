'use client';

import { useEffect } from 'react';
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('SW registered', reg))
        .catch((err) => console.log('SW error', err));
    }
  }, []);

  return (
    <html lang="ar" dir="rtl">
      <head>
        <title>AI Multimodal Translation Platform</title>
        <meta name="description" content="Next-generation AI translation for Text, Speech, and Images" />
      </head>
      <body>
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(0,242,255,0.05),transparent_50%)]" />
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_80%_20%,rgba(112,0,255,0.05),transparent_50%)]" />
        <main className="min-height-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
