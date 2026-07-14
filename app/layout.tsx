import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NIBL Foods — Field Sales Tracker',
  description: 'Live GPS tracking, route optimization, and analytics for the NIBL Foods field sales team.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
