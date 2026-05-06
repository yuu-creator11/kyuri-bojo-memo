import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppProvider } from '@/context/AppContext'
import BottomNavWrapper from '@/components/BottomNavWrapper'

export const metadata: Metadata = {
  title: 'キュウリ防除メモ',
  description: '1分で記録、3秒で使用回数がわかる農薬散布管理アプリ',
}

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full bg-emerald-50">
        <AppProvider>
          {children}
          <BottomNavWrapper />
        </AppProvider>
      </body>
    </html>
  )
}
