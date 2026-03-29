import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SolanaWalletProvider } from '@/components/wallet/wallet-provider'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EngageX - Web3 Gamified Attention Marketplace',
  description: 'Create missions, earn rewards, and dominate the attention economy on Solana',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-brand-dark text-white antialiased`}>
        <SolanaWalletProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#0D1117',
                color: '#fff',
                border: '1px solid #1A2332',
                borderRadius: '12px',
              },
              success: { iconTheme: { primary: '#00FF88', secondary: '#0D1117' } },
              error: { iconTheme: { primary: '#FF4444', secondary: '#0D1117' } },
            }}
          />
        </SolanaWalletProvider>
      </body>
    </html>
  )
}
