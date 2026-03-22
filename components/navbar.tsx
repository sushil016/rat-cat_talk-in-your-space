"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Menu, X, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"

const navItems = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Download", href: "#download" },
]

export function Navbar() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl"
    >
      <nav
        ref={navRef}
        className="theme-navbar theme-transition relative flex items-center justify-between px-4 py-3 rounded-full backdrop-blur-md border"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
            <Image 
              src="/logo.png" 
              alt="Rat Cat Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="font-bold text-lg hidden sm:block">
            <span className="text-[var(--color-primary)]">Rat</span>
            <span className="text-white/90">Cat</span>
          </span>
        </Link>

        {/* Desktop Nav Items */}
        <div className="hidden md:flex items-center gap-1 relative">
          {navItems.map((item, index) => (
            <a
              key={item.label}
              href={item.href}
              className="theme-transition relative px-4 py-2 text-sm text-white/80 hover:text-[var(--color-primary)]"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {hoveredIndex === index && (
                <motion.div
                  layoutId="navbar-hover"
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: "rgba(255, 239, 77, 0.10)" }}
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </a>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <>
              <Link href="/dashboard">
                <Button
                  size="sm"
                  className="shimmer-btn rounded-full px-5 border-0 font-medium"
                >
                  Dashboard
                </Button>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="theme-transition p-2 rounded-full text-white/80 hover:text-[var(--color-primary)]"
                title="Sign out"
              >
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-8 h-8 rounded-full border border-zinc-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ffd063] to-[#00a6ff] flex items-center justify-center text-xs font-bold text-black">
                    {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </button>
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="theme-transition text-white/80 hover:text-[var(--color-primary)] hover:bg-[rgba(255,239,77,0.10)]">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button
                  size="sm"
                  className="shimmer-btn rounded-full px-5 border-0 font-medium"
                >
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-zinc-400 hover:text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="theme-transition absolute top-full left-0 right-0 mt-2 p-4 rounded-2xl backdrop-blur-md border"
          style={{ backgroundColor: "rgba(76, 77, 80, 0.95)", borderColor: "rgba(255, 239, 77, 0.20)" }}
        >
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="theme-transition px-4 py-3 text-sm text-white/80 hover:text-[var(--color-primary)] hover:bg-[rgba(255,239,77,0.10)] rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <hr className="my-2 border theme-divider" />
            {session ? (
              <>
                <Link href="/dashboard">
                  <Button className="w-full shimmer-btn rounded-full border-0">
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="theme-transition w-full justify-start text-white/80 hover:text-[var(--color-primary)] hover:bg-[rgba(255,239,77,0.10)]"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut size={16} className="mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" className="theme-transition w-full justify-start text-white/80 hover:text-[var(--color-primary)] hover:bg-[rgba(255,239,77,0.10)]">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="w-full shimmer-btn rounded-full border-0">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.header>
  )
}
