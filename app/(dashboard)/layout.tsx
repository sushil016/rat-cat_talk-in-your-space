"use client"

import type React from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Film, Users, UserCircle, Settings, Menu, X, LogOut } from "lucide-react"
import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"

const sidebarLinks = [
    { label: "Dashboard", href: "/dashboard", icon: Home },
    { label: "My Spaces", href: "/rooms", icon: Film },
    { label: "Friends", href: "/friends", icon: Users },
    { label: "Profile", href: "/profile", icon: UserCircle },
    { label: "Settings", href: "/settings", icon: Settings },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { data: session } = useSession()
    const pathname = usePathname()

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Top Header */}
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-3">
                    <button
                        className="md:hidden p-2 text-zinc-400 hover:text-white"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ffd063] to-[#00a6ff] flex items-center justify-center">
                            <span className="text-black font-bold text-sm">🐱</span>
                        </div>
                        <span className="font-bold text-lg">
                            <span className="text-[#ffd063]">Rat</span>
                            <span className="text-[#00a6ff]">Cat</span>
                        </span>
                    </Link>
                </div>

                <div className="flex items-center gap-3">
                    {session?.user && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-zinc-400 hidden sm:block">
                                {session.user.name || session.user.email}
                            </span>
                            <Link href="/profile">
                                <Avatar className="w-9 h-9 border border-zinc-700 cursor-pointer hover:border-[#ffd063]/50 transition-colors">
                                    <AvatarImage src={session.user.image || undefined} alt={session.user.name || "User"} />
                                    <AvatarFallback className="bg-gradient-to-br from-[#ffd063] to-[#00a6ff] text-black text-sm font-bold">
                                        {session.user.name?.charAt(0)?.toUpperCase() || "U"}
                                    </AvatarFallback>
                                </Avatar>
                            </Link>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="text-zinc-400 hover:text-white"
                                title="Sign out"
                            >
                                <LogOut size={18} />
                            </Button>
                        </div>
                    )}
                </div>
            </header>

            <div className="flex pt-16">
                {/* Sidebar */}
                <aside
                    className={`fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-zinc-950 border-r border-zinc-800 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                        }`}
                >
                    <nav className="p-4 space-y-1">
                        {sidebarLinks.map((link) => {
                            const isActive = pathname === link.href
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                                            ? "bg-zinc-800/80 text-[#ffd063]"
                                            : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                                        }`}
                                >
                                    <link.icon size={18} />
                                    {link.label}
                                </Link>
                            )
                        })}
                    </nav>
                </aside>

                {/* Mobile overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-black/50 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <main className="flex-1 min-h-[calc(100vh-4rem)] p-6 md:p-8">
                    {children}
                </main>
            </div>

            <Toaster />
        </div>
    )
}
