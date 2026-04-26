"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"
import { GameSpace } from "@/components/space/GameSpace"
import { useToast } from "@/components/ui/use-toast"

interface RoomData {
    id: string
    code: string
    name: string
    roomType: string
    resourceUrl: string | null
    host: { id: string; name: string; image: string }
}

export default function SpacePage() {
    const params = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const { toast } = useToast()

    const roomId = params.roomId as string
    const [room, setRoom] = useState<RoomData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/rooms/${roomId}`)
                if (res.ok) {
                    setRoom(await res.json())
                } else {
                    toast({ title: "Space not found", variant: "destructive" })
                    router.push("/rooms")
                }
            } catch {
                toast({ title: "Error", description: "Failed to load space", variant: "destructive" })
            } finally {
                setIsLoading(false)
            }
        }
        load()
    }, [roomId, router, toast])

    if (isLoading || !session?.user) {
        return (
            <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#ffd063] animate-spin" />
            </div>
        )
    }

    if (!room) return null

    return (
        <div className="fixed inset-0 z-50">
            <GameSpace
                roomCode={room.code}
                roomId={roomId}
                roomType={room.roomType}
                resourceUrl={room.resourceUrl || undefined}
                userId={session.user.id!}
                userName={session.user.name || "Anonymous"}
                userAvatar={session.user.image || undefined}
            />
        </div>
    )
}
