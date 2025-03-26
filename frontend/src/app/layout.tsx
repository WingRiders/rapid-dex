import type {Metadata} from 'next'
import {Geist, Geist_Mono} from 'next/font/google'
import './globals.css'
import {Suspense} from 'react'
import {WalletStateHandler} from '../components/connect-wallet/wallet-state-handler'
import {QueryProvider} from '../components/query-provider'
import {ThemeProvider} from '../components/theme-provider'
import {Toaster} from '../components/ui/sonner'
import {TooltipProvider} from '../components/ui/tooltip'
import {AppMenu} from './app-menu'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Rapid DEX',
  description: 'DEX on Cardano built without batcher',
}

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <TooltipProvider>
              <AppMenu />
              <Suspense>{children}</Suspense>
              <Toaster />
              <WalletStateHandler />
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

export default RootLayout
