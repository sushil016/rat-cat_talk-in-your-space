"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Code2, Film, Globe2, Lock, Loader2, Plus, Search, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface RoomItem {
    id: string
    code: string
    name: string
    roomType: string
    resourceUrl: string | null
    isPublic: boolean
    maxParticipants: number
    status: string
    host: { id: string; name: string | null; username: string | null; image: string | null }
    _count: { participants: number }
}

const roomTypeMeta = {
    coding: { label: "Coding", icon: Code2, className: "text-[#00a6ff] border-[#00a6ff]/30 bg-[#00a6ff]/10" },
    chill: { label: "Chill", icon: Film, className: "text-[#ffd063] border-[#ffd063]/30 bg-[#ffd063]/10" },
}

export default function RoomsPage() {
    const router = useRouter()
    const [rooms, setRooms] = useState<RoomItem[]>([])
    const [query, setQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function loadRooms() {
            try {
                const res = await fetch("/api/rooms")
                if (res.ok) setRooms(await res.json())
            } finally {
                setIsLoading(false)
            }
        }
        loadRooms()
    }, [])

    const filteredRooms = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return rooms
        return rooms.filter((room) =>
            [room.name, room.code, room.host.name, room.host.username, room.resourceUrl]
                .filter(Boolean)
                .some((value) => value!.toLowerCase().includes(q)),
        )
    }, [query, rooms])

    return (
        <div className="max-w-5xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-between mb-8"
            >
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Spaces</h1>
                    <p className="text-zinc-400 text-sm">Your spaces plus public rooms from the community</p>
                </div>
                <button
                    onClick={() => router.push("/rooms/new")}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ffd063] to-[#ffda7a] text-black text-sm font-medium hover:brightness-110 transition-all"
                >
                    <Plus size={16} />
                    New Space
                </button>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-6"
            >
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search spaces by name, code, host, or coding link..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:border-[#00a6ff]/40 focus:outline-none transition-colors"
                    />
                </div>
            </motion.div>

            {isLoading ? (
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="py-12 flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[#ffd063]" />
                    </CardContent>
                </Card>
            ) : filteredRooms.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="rounded-xl bg-zinc-900 border border-zinc-800 p-12 text-center"
                >
                    <Film className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No spaces found</h3>
                    <p className="text-zinc-500 text-sm mb-6">
                        Create a coding or chill space and choose whether it is public or private.
                    </p>
                    <button
                        onClick={() => router.push("/rooms/new")}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ffd063] to-[#ffda7a] text-black text-sm font-medium hover:brightness-110 transition-all"
                    >
                        Create Your First Space
                    </button>
                </motion.div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {filteredRooms.map((room, index) => {
                        const meta = roomTypeMeta[(room.roomType as keyof typeof roomTypeMeta) || "chill"] ?? roomTypeMeta.chill
                        const Icon = meta.icon
                        return (
                            <motion.button
                                key={room.id}
                                type="button"
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.03 }}
                                onClick={() => router.push(`/rooms/${room.code}/space`)}
                                className="text-left"
                            >
                                <Card className="h-full bg-zinc-900 border-zinc-800 hover:border-[#ffd063]/50 transition-colors">
                                    <CardContent className="p-5">
                                        <div className="mb-4 flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h2 className="truncate text-lg font-semibold text-white">{room.name}</h2>
                                                <p className="mt-1 text-xs text-zinc-500">
                                                    Hosted by {room.host.username || room.host.name || "RatCat user"}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className={meta.className}>
                                                <Icon className="h-3 w-3" />
                                                {meta.label}
                                            </Badge>
                                        </div>

                                        {room.resourceUrl && (
                                            <div className="mb-4 truncate rounded-lg bg-zinc-950 px-3 py-2 text-xs text-zinc-400">
                                                {room.resourceUrl}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-xs text-zinc-500">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-zinc-400">{room.code}</span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-3.5 w-3.5" />
                                                    {room._count.participants}/{room.maxParticipants}
                                                </span>
                                            </div>
                                            <span className="flex items-center gap-1">
                                                {room.isPublic ? <Globe2 className="h-3.5 w-3.5 text-[#00a6ff]" /> : <Lock className="h-3.5 w-3.5 text-zinc-500" />}
                                                {room.isPublic ? "Public" : "Private"}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

