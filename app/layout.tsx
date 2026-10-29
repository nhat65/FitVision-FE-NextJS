// app/layout.tsx
import React from "react";
import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { Toaster } from 'sonner'; // ✅ Import từ sonner
import { ChatBot } from '@/components/chatbot'
import { QueryProvider } from '@/components/providers/query-provider';
import './globals.css';

const inter = Inter({ subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'FitVision AI - Workout with AI Pose Detection',
  description: 'Transform your fitness journey with AI-powered pose detection.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/dumbbell-icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/dumbbell.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased min-h-screen bg-background text-foreground`}>
        <QueryProvider>
          {children}
          <ChatBot />
          <Analytics />
          <Toaster position="top-right" richColors /> {/* ✅ Sonner Toaster */}
        </QueryProvider>
      </body>
    </html>
  );
}