"use client"

import React, { useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSession } from "next-auth/react"
import { useRoomStore } from "@/store/useRoomStore"
import { connectSocket } from "@/lib/socket"

const FLOAT_EMOJIS = ["❤️", "🔥", "🐀", "🐱", "🍿"]

export function FloatingEmojis() {
    const { data: session } = useSession()
    const floatingEmojis = useRoomStore((s) => s.floatingEmojis)
    const removeFloatingEmoji = useRoomStore((s) => s.removeFloatingEmoji)
    const roomCode = useRoomStore((s) => s.roomCode)
    const participants = useRoomStore((s) => s.lobbyParticipants)

    const handleSendReaction = useCallback(
        (emoji: string) => {
            if (!roomCode || !session?.user?.id) return

            const socket = connectSocket()
            const participant = participants.find((p) => p.userId === session.user?.id)
            socket.emit("floating-reaction", {
                roomCode,
                emoji,
                userId: session.user.id,
                username: participant?.name || session.user.name || "User",
            })
        },
        [roomCode, session?.user?.id, session?.user?.name, participants]
    )

    return (
        <>
            {/* Floating emojis overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
                <AnimatePresence>
                    {floatingEmojis.map((fe) => (
                        <motion.div
                            key={fe.id}
                            initial={{
                                opacity: 1,
                                y: "100%",
                                x: `${fe.x}%`,
                                scale: 0.5,
                            }}
                            animate={{
                                opacity: [1, 1, 0.8, 0],
                                y: [
                                    "100%",
                                    "60%",
                                    "30%",
                                    "-10%",
                                ],
                                scale: [0.5, 1.2, 1, 0.8],
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: 3,
                                ease: "easeOut",
                            }}
                            onAnimationComplete={() => removeFloatingEmoji(fe.id)}
                            className="absolute text-3xl drop-shadow-lg"
                            style={{ left: `${fe.x}%` }}
                        >
                            {fe.emoji}
                            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-white/60 font-medium whitespace-nowrap bg-black/40 px-1.5 py-0.5 rounded-full">
                                {fe.username}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Quick reaction bar — bottom of the video */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.4 }}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-xl"
                >
                    {FLOAT_EMOJIS.map((emoji) => (
                        <button
                            key={emoji}
                            onClick={() => handleSendReaction(emoji)}
                            className="w-9 h-9 rounded-full hover:bg-white/10 active:scale-90 flex items-center justify-center text-lg transition-all duration-150"
                            title={`React with ${emoji}`}
                        >
                            {emoji}
                        </button>
                    ))}
                </motion.div>
            </div>
        </>
    )
}
