"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Check, Users, ArrowLeft, Loader2, Crown, Zap, WifiOff, Wifi, Film, Gamepad2, Code2, Globe2, Lock, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useRoomStore, type LobbyParticipant } from "@/store/useRoomStore"
import { connectSocket, disconnectSocket } from "@/lib/socket"

const themeStyles: Record<string, { bg: string; accent: string; glow: string; emoji: string }> = {
    rat_den: { bg: "from-orange-950/30", accent: "text-orange-400", glow: "bg-orange-500/10", emoji: "🐀" },
    cat_lounge: { bg: "from-purple-950/30", accent: "text-purple-400", glow: "bg-purple-500/10", emoji: "🐱" },
    neutral: { bg: "from-zinc-900/50", accent: "text-[#ffd063]", glow: "bg-[#ffd063]/10", emoji: "🎬" },
}

interface RoomData {
    id: string
    code: string
    slug: string
    name: string
    theme: string
    roomType: string
    resourceUrl: string | null
    isPublic: boolean
    status: string
    maxParticipants: number
    password: boolean
    host: { id: string; name: string; username: string; image: string }
    participants: Array<{
        id: string
        role: string
        userId: string | null
        guestName: string | null
        guestAvatar: string | null
        user: { id: string; name: string; username: string; image: string } | null
    }>
}

export default function RoomLobbyPage() {
    const params = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const { toast } = useToast()
    const roomCode = params.roomId as string

    const [room, setRoom] = useState<RoomData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [copied, setCopied] = useState(false)
    const [socketConnected, setSocketConnected] = useState(false)
    const [isTogglingPrivacy, setIsTogglingPrivacy] = useState(false)
    const { lobbyParticipants, setLobbyParticipants, setRoom: setStoreRoom, everyoneReady, setEveryoneReady } = useRoomStore()

    const isHost = room?.host.id === session?.user?.id
    const shareUrl = typeof window !== "undefined"
        ? `${window.location.origin}/r/${roomCode}`
        : ""

    const fetchRoom = useCallback(async () => {
        try {
            const res = await fetch(`/api/rooms/${roomCode}`)
            if (res.ok) {
                const data = await res.json()
                setRoom(data)
                setStoreRoom({
                    roomId: data.id,
                    roomCode: data.code,
                    roomName: data.name,
                    roomTheme: data.theme,
                    roomStatus: data.status,
                })
            } else {
                toast({ title: "Space not found", description: "This space doesn't exist.", variant: "destructive" })
                router.push("/dashboard")
            }
        } catch {
            toast({ title: "Error", description: "Failed to load room", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }, [roomCode, router, setStoreRoom, toast])

    useEffect(() => {
        fetchRoom()
    }, [fetchRoom])

    // Socket.io connection
    useEffect(() => {
        if (!room || !session?.user) return

        const socket = connectSocket()

        socket.on("connect", () => {
            setSocketConnected(true)
            // Join room once connected
            socket.emit("join-room", {
                roomCode: room.code,
                participantId: session.user!.id,
                userId: session.user!.id,
                name: session.user!.name || "User",
                avatar: session.user!.image || undefined,
                role: isHost ? "host" : "participant",
            })
        })

        socket.on("disconnect", () => {
            setSocketConnected(false)
        })

        socket.on("connect_error", () => {
            setSocketConnected(false)
        })

        // If already connected, emit join immediately
        if (socket.connected) {
            setSocketConnected(true)
            socket.emit("join-room", {
                roomCode: room.code,
                participantId: session.user.id,
                userId: session.user.id,
                name: session.user.name || "User",
                avatar: session.user.image || undefined,
                role: isHost ? "host" : "participant",
            })
        }

        socket.on("participants-update", (participants: LobbyParticipant[]) => {
            setLobbyParticipants(participants)
        })

        socket.on("everyone-ready", () => {
            setEveryoneReady(true)
        })

        socket.on("room-started", () => {
            toast({ title: "Let's go!", description: "Entering the space!" })
            router.push(`/rooms/${roomCode}/space`)
        })

        socket.on("user-joined", (data: { name: string }) => {
            toast({ title: `${data.name} joined`, description: "A new viewer entered the room" })
        })

        socket.on("user-left", (data: { name: string }) => {
            toast({ title: `${data.name} left`, description: "A viewer left the room" })
        })

        return () => {
            socket.emit("leave-room", { roomCode: room.code })
            socket.off("connect")
            socket.off("disconnect")
            socket.off("connect_error")
            socket.off("participants-update")
            socket.off("everyone-ready")
            socket.off("room-started")
            socket.off("user-joined")
            socket.off("user-left")
            disconnectSocket()
        }
    }, [room, session?.user, isHost, setLobbyParticipants, setEveryoneReady, toast, roomCode, router])

    function handleToggleReady() {
        if (!socketConnected) {
            toast({ title: "Not connected", description: "Socket server is not running. Start it with: npm run socket:dev", variant: "destructive" })
            return
        }
        const socket = connectSocket()
        socket.emit("toggle-ready", { roomCode: room?.code })
    }

    function handleStartRoom() {
        if (!socketConnected) {
            toast({ title: "Not connected", description: "Socket server is not running. Start it with: npm run socket:dev", variant: "destructive" })
            return
        }
        const socket = connectSocket()
        socket.emit("start-room", { roomCode: room?.code })
    }

    async function togglePrivacy() {
        if (!room || !isHost) return
        setIsTogglingPrivacy(true)
        try {
            const res = await fetch(`/api/rooms/${room.code}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPublic: !room.isPublic }),
            })
            if (res.ok) {
                const updated = await res.json()
                setRoom(prev => prev ? { ...prev, isPublic: updated.isPublic } : prev)
                toast({
                    title: updated.isPublic ? "Room is now Public" : "Room is now Private",
                    description: updated.isPublic
                        ? "Anyone can discover and join this room."
                        : "Only people with the link can join.",
                })
            }
        } catch {
            toast({ title: "Error", description: "Failed to update privacy", variant: "destructive" })
        } finally {
            setIsTogglingPrivacy(false)
        }
    }

    function copyCode() {
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast({ title: "Copied!", description: "Room link copied to clipboard" })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-[#ffd063] animate-spin" />
            </div>
        )
    }

    if (!room) return null

    const style = themeStyles[room.theme] || themeStyles.neutral
    const myParticipant = lobbyParticipants.find((p) => p.userId === session?.user?.id)

    return (
        <div className="max-w-3xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Back */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/dashboard")}
                    className="text-zinc-400 hover:text-white mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>

                {/* Socket Connection Banner */}
                {!socketConnected && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3"
                    >
                        <WifiOff className="w-5 h-5 text-red-400 shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-red-400">Socket server not connected</p>
                            <p className="text-xs text-red-400/70 mt-0.5">
                                Run <code className="bg-red-500/20 px-1.5 py-0.5 rounded text-red-300">npm run dev:all</code> or{" "}
                                <code className="bg-red-500/20 px-1.5 py-0.5 rounded text-red-300">npm run socket:dev</code> in a separate terminal
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Room Header */}
                <div className={`p-6 rounded-2xl bg-gradient-to-br ${style.bg} to-zinc-950 border border-zinc-800 mb-6`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">{style.emoji}</span>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{room.name}</h1>
                                <p className="text-sm text-zinc-400">
                                    {room.roomType === "coding" ? "Coding space lobby" : "Chill space lobby"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className={room.roomType === "coding" ? "text-[#00a6ff] border-[#00a6ff]/40" : "text-[#ffd063] border-[#ffd063]/40"}>
                                {room.roomType === "coding" ? <Code2 className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                                {room.roomType === "coding" ? "Coding" : "Chill"}
                            </Badge>
                            {isHost ? (
                                <button
                                    onClick={togglePrivacy}
                                    disabled={isTogglingPrivacy}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all ${
                                        room.isPublic
                                            ? "text-[#00a6ff] border-[#00a6ff]/40 hover:bg-[#00a6ff]/10"
                                            : "text-zinc-400 border-zinc-700 hover:bg-zinc-800"
                                    }`}
                                    title={room.isPublic ? "Click to make private" : "Click to make public"}
                                >
                                    {isTogglingPrivacy ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : room.isPublic ? (
                                        <Globe2 className="w-3 h-3" />
                                    ) : (
                                        <Lock className="w-3 h-3" />
                                    )}
                                    {room.isPublic ? "Public" : "Private"}
                                </button>
                            ) : (
                                <Badge variant="outline" className={room.isPublic ? "text-[#00a6ff] border-[#00a6ff]/40" : "text-zinc-400 border-zinc-700"}>
                                    {room.isPublic ? <Globe2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                    {room.isPublic ? "Public" : "Private"}
                                </Badge>
                            )}
                            {/* Connection indicator */}
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${socketConnected
                                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                                    : "bg-red-500/10 border-red-500/30 text-red-400"
                                }`}>
                                {socketConnected ? (
                                    <><Wifi className="w-3 h-3" /> Connected</>
                                ) : (
                                    <><WifiOff className="w-3 h-3" /> Offline</>
                                )}
                            </div>
                            <Badge variant="outline" className={`${style.accent} border-current`}>
                                {room.status === "waiting" ? "Lobby" : room.status}
                            </Badge>
                        </div>
                    </div>

                    {/* Room Code + Share */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-black/30">
                        <div className="flex-1">
                            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Share Code</p>
                            <p className="text-xl font-mono font-bold text-white tracking-[0.2em]">{room.code}</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={copyCode}
                            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                        >
                            {copied ? <Check className="w-4 h-4 mr-1 text-green-400" /> : <Copy className="w-4 h-4 mr-1" />}
                            {copied ? "Copied!" : "Copy Link"}
                        </Button>
                    </div>

                    {room.resourceUrl && (
                        <div className="mt-3 rounded-xl bg-black/30 p-3">
                            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Coding Link</p>
                            <a
                                href={room.resourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="block truncate text-sm text-[#00a6ff] hover:text-cyan-300"
                            >
                                {room.resourceUrl}
                            </a>
                        </div>
                    )}
                </div>

                {/* Participants Grid */}
                <Card className="bg-zinc-900 border-zinc-800 mb-6">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-[#00a6ff]" />
                                Participants
                            </h2>
                            <span className="text-sm text-zinc-500">
                                {lobbyParticipants.length} / {room.maxParticipants}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <AnimatePresence>
                                {lobbyParticipants.map((p) => (
                                    <motion.div
                                        key={p.socketId}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className={`p-4 rounded-xl border ${p.isReady
                                            ? "border-green-500/50 bg-green-500/5"
                                            : "border-zinc-800 bg-zinc-800/30"
                                            } text-center transition-colors`}
                                    >
                                        <Avatar className="w-12 h-12 mx-auto mb-2 border-2 border-zinc-700">
                                            <AvatarImage src={p.avatar} />
                                            <AvatarFallback className="bg-gradient-to-br from-[#ffd063] to-[#00a6ff] text-black text-sm font-bold">
                                                {p.name?.charAt(0)?.toUpperCase() || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <p className="text-sm font-medium text-white truncate">{p.name}</p>
                                        <div className="flex items-center justify-center gap-1.5 mt-1">
                                            {p.role === "host" && (
                                                <Crown className="w-3 h-3 text-[#ffd063]" />
                                            )}
                                            <span className={`text-xs ${p.isReady ? "text-green-400" : "text-zinc-500"}`}>
                                                {p.isReady ? "Ready ✓" : "Not ready"}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Empty slots */}
                            {Array.from({ length: Math.max(0, Math.min(6, room.maxParticipants) - lobbyParticipants.length) }).map((_, i) => (
                                <div
                                    key={`empty-${i}`}
                                    className="p-4 rounded-xl border-2 border-dashed border-zinc-800 text-center opacity-30"
                                >
                                    <div className="w-12 h-12 rounded-full bg-zinc-800 mx-auto mb-2" />
                                    <p className="text-sm text-zinc-600">Waiting...</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {!isHost && (
                        <Button
                            onClick={handleToggleReady}
                            disabled={!socketConnected}
                            className={`flex-1 h-14 text-lg font-semibold rounded-xl border-0 ${!socketConnected
                                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                    : myParticipant?.isReady
                                        ? "bg-green-600 hover:bg-green-700 text-white"
                                        : "bg-gradient-to-r from-[#ffd063] to-[#ffda7a] text-black hover:brightness-110"
                                }`}
                        >
                            {!socketConnected ? (
                                <><WifiOff className="w-5 h-5 mr-2" /> Not Connected</>
                            ) : myParticipant?.isReady ? (
                                <><Check className="w-5 h-5 mr-2" /> Ready!</>
                            ) : (
                                <><Zap className="w-5 h-5 mr-2" /> I&apos;m Ready</>
                            )}
                        </Button>
                    )}

                    {isHost && (
                        <Button
                            onClick={handleStartRoom}
                            disabled={!socketConnected || (!everyoneReady && lobbyParticipants.length > 1)}
                            className={`flex-1 h-14 text-lg font-semibold rounded-xl border-0 ${!socketConnected
                                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                    : everyoneReady || lobbyParticipants.length <= 1
                                        ? "bg-gradient-to-r from-[#ffd063] to-[#ffda7a] text-black hover:brightness-110"
                                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                }`}
                        >
                            <Zap className="w-5 h-5 mr-2" />
                            {!socketConnected
                                ? "Socket Not Connected"
                                : everyoneReady || lobbyParticipants.length <= 1
                                    ? "Enter Space 🚀"
                                    : `Waiting for everyone (${lobbyParticipants.filter(p => p.isReady).length}/${lobbyParticipants.length})`}
                        </Button>
                    )}
                </div>

                {/* Direct entry buttons */}
                <div className="flex gap-3 mt-3">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/rooms/${roomCode}/watch`)}
                        className="flex-1 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                    >
                        <Film className="w-4 h-4 mr-2" /> Watch Party
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/rooms/${roomCode}/space`)}
                        className="flex-1 border-[#a855f7]/50 text-[#a855f7] hover:text-[#a855f7] hover:bg-[#a855f7]/10"
                    >
                        <Gamepad2 className="w-4 h-4 mr-2" /> Enter Space
                    </Button>
                    {isHost && (
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/rooms/${roomCode}/settings`)}
                            className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
                            title="Room settings"
                        >
                            <Settings className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                {/* Tip */}
                <p className="text-center text-sm text-zinc-600 mt-4">
                    Share the code <span className="font-mono text-zinc-400">{room.code}</span> with friends to invite them
                </p>
            </motion.div>
        </div>
    )
}
