"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
    ArrowLeft, Globe2, Lock, Loader2, Save, Trash2,
    Code2, Film, Link as LinkIcon, Users, ShieldAlert,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"

interface RoomData {
    id: string
    code: string
    name: string
    roomType: string
    resourceUrl: string | null
    isPublic: boolean
    maxParticipants: number
    status: string
    host: { id: string; name: string }
}

export default function RoomSettingsPage() {
    const params = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const { toast } = useToast()
    const roomCode = params.roomId as string

    const [room, setRoom] = useState<RoomData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Editable fields
    const [name, setName] = useState("")
    const [isPublic, setIsPublic] = useState(false)

    const fetchRoom = useCallback(async () => {
        try {
            const res = await fetch(`/api/rooms/${roomCode}`)
            if (res.ok) {
                const data: RoomData = await res.json()
                // Only host can access settings
                if (data.host.id !== session?.user?.id) {
                    router.push(`/rooms/${roomCode}`)
                    return
                }
                setRoom(data)
                setName(data.name)
                setIsPublic(data.isPublic)
            } else {
                router.push("/rooms")
            }
        } finally {
            setIsLoading(false)
        }
    }, [roomCode, router, session?.user?.id])

    useEffect(() => {
        if (session?.user?.id) fetchRoom()
    }, [fetchRoom, session?.user?.id])

    async function saveSettings() {
        if (!room) return
        setIsSaving(true)
        try {
            const res = await fetch(`/api/rooms/${room.code}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, isPublic }),
            })
            if (res.ok) {
                const updated = await res.json()
                setRoom(prev => prev ? { ...prev, ...updated } : prev)
                toast({ title: "Settings saved", description: "Room updated successfully." })
            } else {
                toast({ title: "Error", description: "Failed to save settings", variant: "destructive" })
            }
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-[#ffd063] animate-spin" />
            </div>
        )
    }

    if (!room) return null

    const hasChanges = name !== room.name || isPublic !== room.isPublic

    return (
        <div className="max-w-2xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                {/* Back */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/rooms/${roomCode}`)}
                    className="text-zinc-400 hover:text-white mb-6"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Lobby
                </Button>

                <div className="flex items-center gap-3 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Room Settings</h1>
                        <p className="text-sm text-zinc-500 mt-0.5 font-mono">{room.code}</p>
                    </div>
                    <Badge
                        variant="outline"
                        className={room.roomType === "coding"
                            ? "text-[#00a6ff] border-[#00a6ff]/40 ml-auto"
                            : "text-[#ffd063] border-[#ffd063]/40 ml-auto"}
                    >
                        {room.roomType === "coding"
                            ? <><Code2 className="w-3 h-3 mr-1" />Coding</>
                            : <><Film className="w-3 h-3 mr-1" />Chill</>}
                    </Badge>
                </div>

                <div className="space-y-4">
                    {/* Room name */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                        <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                            Room Name
                        </label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            maxLength={60}
                            className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#ffd063]/50 transition-colors"
                            placeholder="Room name..."
                        />
                    </div>

                    {/* Privacy toggle */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                        <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
                            Visibility
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setIsPublic(true)}
                                className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                                    isPublic
                                        ? "border-[#00a6ff]/60 bg-[#00a6ff]/8 ring-1 ring-[#00a6ff]/30"
                                        : "border-zinc-700 hover:border-zinc-600 bg-zinc-800/40"
                                }`}
                            >
                                <Globe2 className={`w-5 h-5 ${isPublic ? "text-[#00a6ff]" : "text-zinc-500"}`} />
                                <div>
                                    <p className={`font-semibold text-sm ${isPublic ? "text-white" : "text-zinc-400"}`}>
                                        Public
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                        Visible on the landing page. Anyone can discover and join.
                                    </p>
                                </div>
                            </button>
                            <button
                                onClick={() => setIsPublic(false)}
                                className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                                    !isPublic
                                        ? "border-[#ffd063]/60 bg-[#ffd063]/8 ring-1 ring-[#ffd063]/30"
                                        : "border-zinc-700 hover:border-zinc-600 bg-zinc-800/40"
                                }`}
                            >
                                <Lock className={`w-5 h-5 ${!isPublic ? "text-[#ffd063]" : "text-zinc-500"}`} />
                                <div>
                                    <p className={`font-semibold text-sm ${!isPublic ? "text-white" : "text-zinc-400"}`}>
                                        Private
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                        Hidden from public listings. Only accessible via room code or link.
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Read-only info */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
                        <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">
                            Room Info
                        </label>
                        <div className="flex items-center gap-3 text-sm">
                            <Users className="w-4 h-4 text-zinc-500 shrink-0" />
                            <span className="text-zinc-400">Max participants:</span>
                            <span className="text-white font-medium">{room.maxParticipants}</span>
                        </div>
                        {room.resourceUrl && (
                            <div className="flex items-start gap-3 text-sm">
                                <LinkIcon className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                                <span className="text-zinc-400 shrink-0">Coding link:</span>
                                <a
                                    href={room.resourceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[#00a6ff] hover:text-cyan-300 truncate"
                                >
                                    {room.resourceUrl}
                                </a>
                            </div>
                        )}
                        <div className="flex items-center gap-3 text-sm">
                            <ShieldAlert className="w-4 h-4 text-zinc-500 shrink-0" />
                            <span className="text-zinc-400">Status:</span>
                            <span className="text-white font-medium capitalize">{room.status}</span>
                        </div>
                    </div>

                    {/* Danger zone */}
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                        <p className="text-xs font-semibold uppercase tracking-widest text-red-400/70 mb-3">
                            Danger Zone
                        </p>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-white">Delete this room</p>
                                <p className="text-xs text-zinc-500 mt-0.5">This action cannot be undone.</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
                            >
                                <Trash2 className="w-4 h-4 mr-1.5" />
                                Delete Room
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Save */}
                <div className="mt-6 flex gap-3">
                    <Button
                        onClick={saveSettings}
                        disabled={!hasChanges || isSaving || name.trim().length < 2}
                        className="flex-1 h-12 rounded-xl font-semibold border-0 bg-gradient-to-r from-[#ffd063] to-[#ffda7a] text-black hover:brightness-110 disabled:opacity-40"
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Changes
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/rooms/${roomCode}`)}
                        className="border-zinc-700 text-zinc-400 hover:text-white h-12 rounded-xl px-6"
                    >
                        Cancel
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}
