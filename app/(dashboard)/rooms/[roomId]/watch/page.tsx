"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2, ArrowLeft, MessageCircle, X } from "lucide-react"
import { useRoomStore } from "@/store/useRoomStore"
import { connectSocket, disconnectSocket } from "@/lib/socket"
import { useToast } from "@/components/ui/use-toast"
import { VideoPlayer } from "@/components/room/VideoPlayer"
import { ControlsBar } from "@/components/room/ControlsBar"
import { ChatSidebar } from "@/components/room/ChatSidebar"
import { FloatingEmojis } from "@/components/room/FloatingEmojis"
import { VoiceChannel } from "@/components/room/VoiceChannel"
import { Button } from "@/components/ui/button"

export default function WatchPage() {
    const params = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const { toast } = useToast()

    const roomCode = params.roomId as string
    const [isLoading, setIsLoading] = useState(true)
    const [isValidRoom, setIsValidRoom] = useState(false)
    const [chatOpen, setChatOpen] = useState(true)
    const [hostId, setHostId] = useState<string | null>(null)

    const setRoom = useRoomStore((state) => state.setRoom)
    const setLobbyParticipants = useRoomStore((state) => state.setLobbyParticipants)
    const setMessages = useRoomStore((state) => state.setMessages)
    const addMessage = useRoomStore((state) => state.addMessage)
    const updateMessageReactions = useRoomStore((state) => state.updateMessageReactions)
    const addFloatingEmoji = useRoomStore((state) => state.addFloatingEmoji)

    // Verify room
    useEffect(() => {
        async function verifyRoom() {
            try {
                const res = await fetch(`/api/rooms/${roomCode}`)
                if (res.ok) {
                    const data = await res.json()
                    setRoom({
                        roomId: data.id,
                        roomCode: data.code,
                        roomName: data.name,
                        roomTheme: data.theme,
                        roomStatus: "live"
                    })
                    setHostId(data.host?.id || data.hostId || null)
                    setIsValidRoom(true)
                } else {
                    toast({ title: "Room not found", description: "Invalid room.", variant: "destructive" })
                    router.push("/dashboard")
                }
            } catch {
                toast({ title: "Error", description: "Failed to verify room.", variant: "destructive" })
            } finally {
                setIsLoading(false)
            }
        }
        verifyRoom()
    }, [roomCode, router, setRoom, toast])

    // Establish socket + chat events
    useEffect(() => {
        if (!isValidRoom || !session?.user) return
        const socket = connectSocket()

        const isHost = hostId === session.user.id

        socket.emit("join-room", {
            roomCode,
            participantId: session.user.id,
            userId: session.user.id,
            name: session.user.name || "User",
            avatar: session.user.image || undefined,
            role: isHost ? "host" : "participant",
        })

        socket.on("participants-update", (participants: any[]) => {
            setLobbyParticipants(participants)
        })

        // Chat events
        socket.on("chat-history", (messages: any[]) => {
            setMessages(messages)
        })

        socket.on("new-message", (message: any) => {
            addMessage(message)
        })

        socket.on("message-reaction-update", (data: { messageId: string; reactions: any[] }) => {
            updateMessageReactions(data.messageId, data.reactions)
        })

        socket.on("floating-emoji", (data: { id: string; emoji: string; userId: string; username: string; timestamp: number }) => {
            addFloatingEmoji({
                id: data.id,
                emoji: data.emoji,
                userId: data.userId,
                username: data.username,
                x: 10 + Math.random() * 75, // Random 10-85% horizontal position
                timestamp: data.timestamp,
            })
        })

        return () => {
            disconnectSocket()
        }
    }, [isValidRoom, roomCode, session?.user, setLobbyParticipants, setMessages, addMessage, updateMessageReactions, addFloatingEmoji])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh] bg-black">
                <Loader2 className="w-8 h-8 text-[#ffd063] animate-spin" />
            </div>
        )
    }

    if (!isValidRoom) return null

    return (
        <div className="flex flex-col h-screen bg-black overflow-hidden relative">
            {/* Top Bar */}
            <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-6 z-20 pointer-events-none">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/rooms/${roomCode}`)}
                    className="pointer-events-auto text-white/70 hover:text-white bg-black/40 hover:bg-black/60 border border-white/10 rounded-full"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Leave Watch Party
                </Button>

                {/* Voice Channel Controls */}
                <div className="pointer-events-auto">
                    <VoiceChannel />
                </div>

                {/* Chat toggle (mobile) */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChatOpen(!chatOpen)}
                    className="pointer-events-auto text-white/70 hover:text-white bg-black/40 hover:bg-black/60 border border-white/10 rounded-full lg:hidden"
                >
                    {chatOpen ? (
                        <><X className="w-4 h-4 mr-1" /> Close Chat</>
                    ) : (
                        <><MessageCircle className="w-4 h-4 mr-1" /> Chat</>
                    )}
                </Button>
            </div>

            <div className="flex flex-1 overflow-hidden pt-16">

                {/* Main Watch Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
                    <div className="w-full max-w-6xl aspect-video mx-auto relative">
                        <VideoPlayer />
                        <FloatingEmojis />
                    </div>
                </div>

                {/* Chat Sidebar */}
                <div
                    className={`w-80 shrink-0 border-l border-zinc-800 bg-zinc-950 flex flex-col transition-all duration-300 ${chatOpen
                        ? "translate-x-0 opacity-100"
                        : "translate-x-full opacity-0 absolute right-0 top-0 bottom-0 pointer-events-none lg:translate-x-full"
                        } ${chatOpen ? "flex" : "hidden lg:hidden"}`}
                >
                    <ChatSidebar />
                </div>

                {/* Desktop chat toggle */}
                {!chatOpen && (
                    <div className="hidden lg:flex items-start p-2 shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setChatOpen(true)}
                            className="text-zinc-500 hover:text-white hover:bg-zinc-800"
                        >
                            <MessageCircle className="w-5 h-5" />
                        </Button>
                    </div>
                )}

            </div>

            {/* Bottom Controls */}
            <ControlsBar />

        </div>
    )
}
