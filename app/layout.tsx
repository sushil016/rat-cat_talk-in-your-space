import type React from "react"
import type { Metadata } from "next"
import { Manrope, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "@/components/providers"
import "./globals.css"

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "RatCat – Watch Together, Stay in Sync",
  description: "Real-time synchronized movie and video watching for 2–50 friends. Create private watch rooms, share YouTube links or upload files, and enjoy perfectly synced playback with voice and text chat.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${manrope.variable} ${inter.variable} font-sans antialiased`}>
        <Providers>
          <div className="noise-overlay" aria-hidden="true" />
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}
