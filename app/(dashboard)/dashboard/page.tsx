"use client"

import { motion } from "framer-motion"
import { Plus, LogIn, Users, Film, Zap, ArrowRight, Crown, Loader2 } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

interface RoomItem {
    id: string
    code: string
    slug: string
    name: string
    theme: string
    status: string
    maxParticipants: number
    createdAt: string
    updatedAt: string
    host: { id: string; name: string | null; username: string | null; image: string | null }
    _count: { participants: number }
}

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    waiting: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
    live: { bg: "bg-green-500/10", text: "text-green-400", dot: "bg-green-400" },
    ended: { bg: "bg-zinc-500/10", text: "text-zinc-400", dot: "bg-zinc-500" },
}

const themeEmojis: Record<string, string> = {
    rat_den: "🐀",
    cat_lounge: "🐱",
    neutral: "🎬",
}

export default function DashboardPage() {
    const { data: session, update: updateSession } = useSession()
    const { toast } = useToast()
    const hasShownWelcome = useRef(false)

    const [rooms, setRooms] = useState<RoomItem[]>([])
    const [roomsLoading, setRoomsLoading] = useState(true)

    useEffect(() => {
        async function checkNewUser() {
            if (!session?.user?.id || hasShownWelcome.current) return

            try {
                const res = await fetch("/api/profile")
                if (res.ok) {
                    const profile = await res.json()
                    if (profile.isNewUser) {
                        hasShownWelcome.current = true
                        toast({
                            title: "Welcome to RatCat 🐀🐱",
                            description: "Your account is ready! Set up your profile to get started.",
                            duration: 6000,
                        })
                        // Mark as not new
                        await fetch("/api/profile", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name: profile.name }),
                        })
                        await updateSession({ isNewUser: false })
                    }
                }
            } catch {
                // Silent fail
            }
        }
        checkNewUser()
    }, [session?.user?.id])

    // Fetch recent rooms
    useEffect(() => {
        async function fetchRooms() {
            try {
                const res = await fetch("/api/rooms")
                if (res.ok) {
                    const data = await res.json()
                    setRooms(data)
                }
            } catch {
                // Silent fail
            } finally {
                setRoomsLoading(false)
            }
        }
        if (session?.user?.id) {
            fetchRooms()
        } else {
            setRoomsLoading(false)
        }
    }, [session?.user?.id])

    return (
        <div className="max-w-5xl mx-auto">
            {/* Welcome */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-10"
            >
                <h1 className="text-3xl font-bold text-white mb-2">
                    Welcome back, <span className="text-[#ffd063]">{session?.user?.name || "friend"}</span> 👋
                </h1>
                <p className="text-zinc-400">Ready to watch something together?</p>
            </motion.div>

            {/* Big "Create New Room" CTA */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-10"
            >
                <Link href="/rooms/new">
                    <button className="w-full group relative p-8 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-dashed border-[#ffd063]/30 hover:border-[#ffd063]/60 transition-all duration-500 text-left overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#ffd063]/5 via-transparent to-[#00a6ff]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Floating glow */}
                        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#ffd063]/8 rounded-full blur-3xl group-hover:bg-[#ffd063]/15 transition-all duration-500" />

                        <div className="relative flex items-center gap-6">
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#ffd063] to-[#ffda7a] shadow-lg shadow-[#ffd063]/20 group-hover:shadow-[#ffd063]/40 transition-shadow">
                                <Plus className="w-8 h-8 text-black" />
                            </div>
                            <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-white mb-1 group-hover:text-[#ffd063] transition-colors">
                                    Create New Space
                                </h2>
                                <p className="text-zinc-400">
                                    Start a virtual space, invite friends, and hang out together
                                </p>
                            </div>
                            <ArrowRight className="w-6 h-6 text-zinc-600 group-hover:text-[#ffd063] group-hover:translate-x-1 transition-all" />
                        </div>
                    </button>
                </Link>
            </motion.div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Card className="bg-zinc-900 border-zinc-800 hover:border-[#00a6ff]/40 transition-all cursor-pointer group">
                        <CardContent className="py-5 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-[#00a6ff]/10">
                                <LogIn className="w-5 h-5 text-[#00a6ff]" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white group-hover:text-[#00a6ff] transition-colors">Join Space</h3>
                                <p className="text-zinc-500 text-sm">Enter a space code</p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.25 }}
                >
                    <Link href="/friends">
                        <Card className="bg-zinc-900 border-zinc-800 hover:border-[#ffd063]/40 transition-all cursor-pointer group">
                            <CardContent className="py-5 flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-[#ffd063]/10">
                                    <Users className="w-5 h-5 text-[#ffd063]" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white group-hover:text-[#ffd063] transition-colors">Friends</h3>
                                    <p className="text-zinc-500 text-sm">Invite friends to watch</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </motion.div>
            </div>

            {/* Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10"
            >
                {[
                    { label: "Spaces Created", value: String(rooms.filter(r => r.host.id === session?.user?.id).length), icon: Film, color: "#ffd063" },
                    { label: "Watch Parties", value: String(rooms.filter(r => r.status === "live" || r.status === "ended").length), icon: Users, color: "#00a6ff" },
                    { label: "Active Spaces", value: String(rooms.filter(r => r.status !== "ended").length), icon: Zap, color: "#ffd063" },
                ].map((stat) => (
                    <Card key={stat.label} className="bg-zinc-900 border-zinc-800">
                        <CardContent className="py-5">
                            <div className="flex items-center gap-3 mb-2">
                                <stat.icon size={18} style={{ color: stat.color }} />
                                <span className="text-xs text-zinc-500 uppercase tracking-wider">{stat.label}</span>
                            </div>
                            <span className="text-2xl font-bold text-white">{stat.value}</span>
                        </CardContent>
                    </Card>
                ))}
            </motion.div>

            {/* Recent Rooms */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                <h2 className="text-xl font-semibold text-white mb-4">Recent Spaces</h2>

                {roomsLoading ? (
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardContent className="py-8 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-[#ffd063] animate-spin" />
                        </CardContent>
                    </Card>
                ) : rooms.length === 0 ? (
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardContent className="py-8 text-center">
                            <Film className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                            <p className="text-zinc-500 text-sm">No spaces yet. Create one to get started!</p>
                            <Link href="/rooms/new">
                                <Button
                                    variant="link"
                                    className="mt-2 text-[#ffd063] hover:text-[#ffda7a]"
                                >
                                    Create your first space →
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {rooms.slice(0, 6).map((room, i) => {
                            const sc = statusColors[room.status] || statusColors.ended
                            return (
                                <motion.div
                                    key={room.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.05 * i }}
                                >
                                    <Link href={`/rooms/${room.code}/space`}>
                                        <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer group">
                                            <CardContent className="py-4 flex items-center gap-4">
                                                {/* Theme emoji */}
                                                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-2xl shrink-0">
                                                    {themeEmojis[room.theme] || "🎬"}
                                                </div>

                                                {/* Room info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold text-white truncate group-hover:text-[#ffd063] transition-colors">
                                                            {room.name}
                                                        </h3>
                                                        <Badge variant="outline" className={`${sc.bg} ${sc.text} border-0 text-[10px] px-1.5 py-0 shrink-0`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${sc.dot} mr-1`} />
                                                            {room.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                                                        <span className="font-mono text-zinc-400">{room.code}</span>
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-3 h-3" />
                                                            {room._count.participants}
                                                        </span>
                                                        <span>
                                                            {formatDistanceToNow(new Date(room.updatedAt), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Host avatar */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Avatar className="w-8 h-8 border border-zinc-700">
                                                        <AvatarImage src={room.host.image || undefined} />
                                                        <AvatarFallback className="bg-gradient-to-br from-[#ffd063] to-[#00a6ff] text-black text-xs font-bold">
                                                            {room.host.name?.charAt(0)?.toUpperCase() || "H"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {room.host.id === session?.user?.id && (
                                                        <Crown className="w-3.5 h-3.5 text-[#ffd063]" />
                                                    )}
                                                </div>

                                                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-[#ffd063] group-hover:translate-x-0.5 transition-all shrink-0" />
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </motion.div>
                            )
                        })}

                        {rooms.length > 6 && (
                            <Link href="/rooms">
                                <Button variant="ghost" className="w-full text-zinc-400 hover:text-white mt-2">
                                    View all spaces ({rooms.length}) →
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    )
}
