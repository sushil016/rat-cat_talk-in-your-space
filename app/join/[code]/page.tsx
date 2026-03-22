"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { Users, Lock, ArrowRight, Loader2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

const avatarOptions = ["🐱", "🐀", "🦊", "🐻", "🐼", "🐸", "🐵", "🐰", "🦉", "🐲"]

interface RoomInfo {
    id: string
    code: string
    name: string
    theme: string
    maxParticipants: number
    password: boolean
    status: string
    host: { name: string }
    _count: { participants: number }
}

export default function JoinRoomPage() {
    const params = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const { toast } = useToast()
    const code = (params.code as string)?.toUpperCase()

    const [room, setRoom] = useState<RoomInfo | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isJoining, setIsJoining] = useState(false)
    const [password, setPassword] = useState("")
    const [guestName, setGuestName] = useState("")
    const [guestAvatar, setGuestAvatar] = useState("🐱")

    useEffect(() => {
        async function fetchRoom() {
            try {
                const res = await fetch(`/api/rooms/${code}`)
                if (res.ok) {
                    setRoom(await res.json())
                } else {
                    toast({ title: "Space not found", description: "This space doesn't exist.", variant: "destructive" })
                }
            } catch {
                toast({ title: "Error", description: "Failed to load space info", variant: "destructive" })
            } finally {
                setIsLoading(false)
            }
        }
        if (code) fetchRoom()
    }, [code, toast])

    async function handleJoin(e: React.FormEvent) {
        e.preventDefault()
        if (!room) return

        setIsJoining(true)
        try {
            const body: Record<string, string> = {}
            if (room.password) body.password = password
            if (!session?.user) {
                body.guestName = guestName || "Guest"
                body.guestAvatar = guestAvatar
            }

            const res = await fetch(`/api/rooms/${code}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })

            if (res.ok) {
                toast({ title: "Joined!", description: `Welcome to ${room.name}` })
                router.push(`/rooms/${code}/space`)
            } else {
                const err = await res.json()
                toast({ title: "Can't join", description: err.error, variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "Failed to join room", variant: "destructive" })
        } finally {
            setIsJoining(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#ffd063] animate-spin" />
            </div>
        )
    }

    if (!room) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Card className="bg-zinc-900 border-zinc-800 max-w-sm w-full">
                    <CardContent className="py-8 text-center">
                        <p className="text-zinc-400 mb-4">Space not found. Check the code and try again.</p>
                        <Link href="/dashboard">
                            <Button className="bg-[#ffd063] text-black hover:brightness-110 border-0">
                                Go to Dashboard
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Room Info */}
                <Card className="bg-zinc-900 border-zinc-800 mb-4">
                    <CardContent className="pt-6">
                        <div className="text-center mb-4">
                            <span className="text-4xl mb-3 block">
                                {room.theme === "rat_den" ? "🐀" : room.theme === "cat_lounge" ? "🐱" : "🎬"}
                            </span>
                            <h1 className="text-xl font-bold text-white">{room.name}</h1>
                            <p className="text-sm text-zinc-400 mt-1">Hosted by {room.host.name}</p>
                        </div>
                        <div className="flex justify-center gap-4 text-sm text-zinc-500">
                            <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {room._count.participants} / {room.maxParticipants}
                            </span>
                            {room.password && (
                                <span className="flex items-center gap-1">
                                    <Lock className="w-3.5 h-3.5" />
                                    Password
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Join Form */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white text-lg">
                            {session?.user ? "Join Space" : "Join as Guest"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleJoin} className="space-y-4">
                            {/* Guest fields */}
                            {!session?.user && (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-300 flex items-center gap-2">
                                            <User className="w-3.5 h-3.5" /> Nickname
                                        </Label>
                                        <Input
                                            value={guestName}
                                            onChange={(e) => setGuestName(e.target.value)}
                                            placeholder="Your nickname"
                                            maxLength={20}
                                            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-[#ffd063]/50"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-300">Pick an Avatar</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {avatarOptions.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    onClick={() => setGuestAvatar(emoji)}
                                                    className={`w-10 h-10 text-xl rounded-lg border-2 transition-all flex items-center justify-center ${guestAvatar === emoji
                                                            ? "border-[#ffd063] bg-[#ffd063]/10"
                                                            : "border-zinc-800 bg-zinc-800 hover:border-zinc-600"
                                                        }`}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Authenticated user display */}
                            {session?.user && (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ffd063] to-[#00a6ff] flex items-center justify-center text-black font-bold">
                                        {session.user.name?.charAt(0)?.toUpperCase() || "U"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{session.user.name}</p>
                                        <p className="text-xs text-zinc-400">{session.user.email}</p>
                                    </div>
                                </div>
                            )}

                            {/* Password */}
                            {room.password && (
                                <div className="space-y-2">
                                    <Label className="text-zinc-300 flex items-center gap-2">
                                        <Lock className="w-3.5 h-3.5" /> Space Password
                                    </Label>
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter space password"
                                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-[#ffd063]/50"
                                        required
                                    />
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={isJoining}
                                className="w-full h-12 bg-gradient-to-r from-[#ffd063] to-[#ffda7a] text-black font-semibold hover:brightness-110 border-0"
                            >
                                {isJoining ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Joining...</>
                                ) : (
                                    <>Join Space <ArrowRight className="w-4 h-4 ml-2" /></>
                                )}
                            </Button>
                        </form>

                        {!session?.user && (
                            <p className="text-center text-xs text-zinc-600 mt-4">
                                <Link href="/sign-in" className="text-[#ffd063] hover:underline">Sign in</Link>
                                {" "}for full features
                            </p>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
