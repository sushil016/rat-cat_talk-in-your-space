"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"

const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Spaces", href: "#developers" },
    { name: "Community", href: "#community" },
]

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const { data: session } = useSession()

    useEffect(() => {
        function onScroll() { setIsScrolled(window.scrollY > 20) }
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [])

    return (
        <header
            className={`fixed z-50 transition-all duration-500 ${isScrolled ? "top-4 left-4 right-4" : "top-0 left-0 right-0"}`}
        >
            <nav
                className={`mx-auto transition-all duration-500 ${isScrolled || isMobileMenuOpen
                    ? "bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl max-w-[1200px]"
                    : "bg-transparent max-w-[1400px]"
                    }`}
            >
                <div className={`flex items-center justify-between transition-all duration-500 px-6 lg:px-8 ${isScrolled ? "h-14" : "h-20"}`}>

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                            <Image src="/logo.png" alt="RatCat Logo" fill className="object-contain" priority />
                        </div>
                        <span className={`font-bold tracking-tight transition-all duration-500 ${isScrolled ? "text-xl" : "text-2xl"}`}>
                            <span style={{ color: "#ffd063" }}>Rat</span>
                            <span className="text-white/90">Cat</span>
                        </span>
                    </Link>

                    {/* Desktop nav links */}
                    <div className="hidden md:flex items-center gap-10">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                className="relative text-sm group"
                                style={{ color: "rgba(255,255,255,0.6)" }}
                                onMouseEnter={e => (e.currentTarget.style.color = "white")}
                                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
                            >
                                {link.name}
                                <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#ffd063] transition-all duration-300 group-hover:w-full" />
                            </a>
                        ))}
                    </div>

                    {/* Desktop CTAs */}
                    <div className="hidden md:flex items-center gap-4">
                        {session ? (
                            <>
                                <Link href="/dashboard">
                                    <Button
                                        size="sm"
                                        className={`shimmer-btn rounded-full border-0 font-semibold transition-all duration-500 ${isScrolled ? "px-4 h-8 text-xs" : "px-6"}`}
                                        style={{ background: "#ffd063", color: "#000" }}
                                    >
                                        Dashboard
                                    </Button>
                                </Link>
                                <button
                                    onClick={() => signOut({ callbackUrl: "/" })}
                                    className="p-1 rounded-full transition-all hover:ring-2 hover:ring-[#ffd063]/40"
                                    title="Sign out"
                                >
                                    {session.user?.image ? (
                                        <img src={session.user.image} alt={session.user.name || "User"} className="w-8 h-8 rounded-full border border-zinc-700" />
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
                                    <span
                                        className={`transition-all duration-500 cursor-pointer ${isScrolled ? "text-xs" : "text-sm"}`}
                                        style={{ color: "rgba(255,255,255,0.55)" }}
                                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "white")}
                                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)")}
                                    >
                                        Sign in
                                    </span>
                                </Link>
                                <Link href="/sign-up">
                                    <Button
                                        size="sm"
                                        className={`shimmer-btn rounded-full border-0 font-semibold transition-all duration-500 ${isScrolled ? "px-4 h-8 text-xs" : "px-6"}`}
                                        style={{ background: "#ffd063", color: "#000" }}
                                    >
                                        Get started
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setIsMobileMenuOpen(prev => !prev)}
                        className="md:hidden p-2"
                        aria-label="Toggle menu"
                        style={{ color: "rgba(255,255,255,0.7)" }}
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </nav>

            {/* Mobile full-screen overlay */}
            <div
                className={`md:hidden fixed inset-0 z-40 transition-all duration-500 ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                style={{ background: "#0d0d0f", top: 0 }}
            >
                <div className="flex flex-col h-full px-8 pt-28 pb-10">
                    {/* Large nav links */}
                    <div className="flex-1 flex flex-col justify-center gap-6">
                        {navLinks.map((link, i) => (
                            <a
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`font-display transition-all duration-500 ${isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                                style={{
                                    fontSize: "clamp(2.5rem,10vw,4rem)",
                                    color: "rgba(255,255,255,0.85)",
                                    transitionDelay: isMobileMenuOpen ? `${i * 70}ms` : "0ms",
                                    textDecoration: "none",
                                }}
                                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#ffd063")}
                                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)")}
                            >
                                {link.name}
                            </a>
                        ))}
                    </div>

                    {/* Bottom CTAs */}
                    <div
                        className={`flex gap-3 pt-8 transition-all duration-500 ${isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                        style={{
                            borderTop: "1px solid rgba(255,255,255,0.08)",
                            transitionDelay: isMobileMenuOpen ? "280ms" : "0ms",
                        }}
                    >
                        {session ? (
                            <>
                                <Link href="/dashboard" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button className="w-full h-14 rounded-full text-base font-semibold shimmer-btn border-0" style={{ background: "#ffd063", color: "#000" }}>
                                        Dashboard
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    className="flex-1 h-14 rounded-full text-base"
                                    style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)" }}
                                    onClick={() => { signOut({ callbackUrl: "/" }); setIsMobileMenuOpen(false) }}
                                >
                                    Sign out
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link href="/sign-in" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button
                                        variant="outline"
                                        className="w-full h-14 rounded-full text-base"
                                        style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)" }}
                                    >
                                        Sign in
                                    </Button>
                                </Link>
                                <Link href="/sign-up" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button className="w-full h-14 rounded-full text-base font-semibold shimmer-btn border-0" style={{ background: "#ffd063", color: "#000" }}>
                                        Get started
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
