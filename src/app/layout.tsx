
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from '@/components/ui/sidebar';
import { SettingsProvider } from '@/context/settings-context';
import { Inter } from 'next/font/google';
import { ThemedBody } from '@/components/themed-body';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'WormGPT',
  description: 'Chat with the WormGPT AI model.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${inter.variable} h-full font-body antialiased`}>
        <SettingsProvider>
          <ThemedBody>
            <SidebarProvider>
              {children}
            </SidebarProvider>
            <Toaster />
          </ThemedBody>
        </SettingsProvider>
      </body>
    </html>
  );
}
