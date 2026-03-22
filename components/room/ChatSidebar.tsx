"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Send, Smile, Hash, X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRoomStore, type ChatMessage, type LobbyParticipant } from "@/store/useRoomStore"
import { connectSocket } from "@/lib/socket"
import { formatDistanceToNow } from "date-fns"

const QUICK_EMOJIS = ["❤️", "🔥", "🐀", "🐱", "🍿", "😂", "👀", "💀"]
const REACTION_EMOJIS = ["❤️", "🔥", "🐀", "🐱", "🍿"]

// Simple markdown-ish rendering
function renderContent(content: string, participants: LobbyParticipant[]) {
    let html = content
        // Escape HTML
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")

    // Spoiler tags: ||text|| → blurred reveal
    html = html.replace(
        /\|\|(.+?)\|\|/g,
        '<span class="chat-spoiler" onclick="this.classList.toggle(\'revealed\')" role="button" tabindex="0">$1</span>'
    )

    // Bold: **text**
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")

    // Italic: *text* (but not already bold)
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>")

    // Inline code: `code`
    html = html.replace(/`(.+?)`/g, '<code class="chat-inline-code">$1</code>')

    // @mentions
    participants.forEach((p) => {
        const regex = new RegExp(`@${p.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "gi")
        html = html.replace(regex, `<span class="chat-mention">@${p.name}</span>`)
    })

    // Links
    html = html.replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>'
    )

    return html
}

function MessageBubble({
    message,
    participants,
    currentUserId,
}: {
    message: ChatMessage
    participants: LobbyParticipant[]
    currentUserId: string | undefined
}) {
    const roomCode = useRoomStore((s) => s.roomCode)

    function handleReaction(emoji: string) {
        if (!roomCode || !currentUserId) return
        const socket = connectSocket()
        const participant = participants.find((p) => p.userId === currentUserId)
        socket.emit("send-reaction", {
            roomCode,
            messageId: message.id,
            emoji,
            userId: currentUserId,
            username: participant?.name || "User",
        })
    }

    if (message.type === "system") {
        return (
            <div className="flex justify-center py-1.5">
                <span className="text-[11px] text-zinc-600 bg-zinc-900/50 px-3 py-1 rounded-full">
                    {message.content}
                </span>
            </div>
        )
    }

    const isOwn = message.userId === currentUserId

    // Group reactions by emoji
    const reactionGroups: Record<string, { emoji: string; count: number; users: string[]; hasOwn: boolean }> = {}
    message.reactions.forEach((r) => {
        if (!reactionGroups[r.emoji]) {
            reactionGroups[r.emoji] = { emoji: r.emoji, count: 0, users: [], hasOwn: false }
        }
        reactionGroups[r.emoji].count++
        reactionGroups[r.emoji].users.push(r.username)
        if (r.userId === currentUserId) reactionGroups[r.emoji].hasOwn = true
    })

    return (
        <div className={`group flex gap-2.5 px-3 py-1.5 hover:bg-zinc-800/30 transition-colors rounded-lg ${isOwn ? "" : ""}`}>
            <Avatar className="w-8 h-8 shrink-0 mt-0.5 border border-zinc-800">
                <AvatarImage src={message.imageUrl} />
                <AvatarFallback className="bg-gradient-to-br from-[#ffd063] to-[#00a6ff] text-black text-[10px] font-bold">
                    {message.username?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                    <span className={`text-sm font-semibold ${isOwn ? "text-[#ffd063]" : "text-white"}`}>
                        {message.username}
                    </span>
                    <span className="text-[10px] text-zinc-600">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </span>
                </div>
                <div
                    className="text-sm text-zinc-300 break-words leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderContent(message.content, participants) }}
                />

                {/* Reactions */}
                {Object.keys(reactionGroups).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                        {Object.values(reactionGroups).map((rg) => (
                            <button
                                key={rg.emoji}
                                onClick={() => handleReaction(rg.emoji)}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs transition-all ${rg.hasOwn
                                        ? "bg-[#ffd063]/20 border border-[#ffd063]/40 text-[#ffd063]"
                                        : "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-500"
                                    }`}
                                title={rg.users.join(", ")}
                            >
                                <span>{rg.emoji}</span>
                                <span className="font-medium">{rg.count}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Reaction picker (appears on hover) */}
                <div className="hidden group-hover:flex items-center gap-0.5 mt-1">
                    {REACTION_EMOJIS.map((emoji) => (
                        <button
                            key={emoji}
                            onClick={() => handleReaction(emoji)}
                            className="w-6 h-6 rounded hover:bg-zinc-700 flex items-center justify-center text-xs transition-colors"
                            title={`React with ${emoji}`}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

export function ChatSidebar() {
    const { data: session } = useSession()
    const currentUserId = session?.user?.id

    const messages = useRoomStore((s) => s.messages)
    const roomCode = useRoomStore((s) => s.roomCode)
    const participants = useRoomStore((s) => s.lobbyParticipants)

    const [input, setInput] = useState("")
    const [showMentions, setShowMentions] = useState(false)
    const [mentionFilter, setMentionFilter] = useState("")
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)

    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            const el = scrollRef.current
            // Only auto-scroll if user is near bottom
            const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
            if (isNearBottom) {
                el.scrollTop = el.scrollHeight
            }
        }
    }, [messages])

    const handleSend = useCallback(() => {
        if (!input.trim() || !roomCode || !currentUserId) return

        const socket = connectSocket()
        socket.emit("send-message", {
            roomCode,
            content: input.trim(),
            userId: currentUserId,
            username: session?.user?.name || "User",
            imageUrl: session?.user?.image || undefined,
        })

        setInput("")
        setShowMentions(false)
        inputRef.current?.focus()
    }, [input, roomCode, currentUserId, session?.user?.name, session?.user?.image])

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
        if (e.key === "Escape") {
            setShowMentions(false)
        }
    }

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value
        setInput(val)

        // Detect @mention
        const lastAtIdx = val.lastIndexOf("@")
        if (lastAtIdx >= 0 && (lastAtIdx === 0 || val[lastAtIdx - 1] === " ")) {
            const query = val.slice(lastAtIdx + 1)
            if (!query.includes(" ")) {
                setMentionFilter(query)
                setShowMentions(true)
                return
            }
        }
        setShowMentions(false)
    }

    function insertMention(name: string) {
        const lastAtIdx = input.lastIndexOf("@")
        const before = input.slice(0, lastAtIdx)
        setInput(`${before}@${name} `)
        setShowMentions(false)
        inputRef.current?.focus()
    }

    function insertEmoji(emoji: string) {
        setInput((prev) => prev + emoji)
        setEmojiPickerOpen(false)
        inputRef.current?.focus()
    }

    const filteredParticipants = participants.filter(
        (p) => p.name.toLowerCase().includes(mentionFilter.toLowerCase()) && p.userId !== currentUserId
    )

    const onlineCount = participants.length

    return (
        <div className="flex flex-col h-full bg-zinc-950">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-zinc-500" />
                    <h3 className="font-semibold text-white text-sm">Live Chat</h3>
                </div>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-medium text-zinc-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    {onlineCount} online
                </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                    <div ref={scrollRef} className="py-3 space-y-0.5" style={{ minHeight: "100%" }}>
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <div className="text-3xl mb-3">💬</div>
                                <p className="text-zinc-500 text-sm font-medium">No messages yet</p>
                                <p className="text-zinc-600 text-xs mt-1">Be the first to say something!</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <MessageBubble
                                    key={msg.id}
                                    message={msg}
                                    participants={participants}
                                    currentUserId={currentUserId}
                                />
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* @mention autocomplete */}
            {showMentions && filteredParticipants.length > 0 && (
                <div className="border-t border-zinc-800 bg-zinc-900 max-h-40 overflow-y-auto">
                    <div className="px-2 py-1.5 text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
                        Participants
                    </div>
                    {filteredParticipants.map((p) => (
                        <button
                            key={p.socketId}
                            onClick={() => insertMention(p.name)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-800 transition-colors text-left"
                        >
                            <Avatar className="w-5 h-5">
                                <AvatarImage src={p.avatar} />
                                <AvatarFallback className="bg-zinc-700 text-[8px] text-white">
                                    {p.name?.charAt(0)?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-white">{p.name}</span>
                            {p.role === "host" && (
                                <span className="text-[10px] text-[#ffd063]">HOST</span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Input bar */}
            <div className="p-3 border-t border-zinc-800 shrink-0">
                <div className="flex items-center gap-2">
                    {/* Emoji picker */}
                    <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-zinc-500 hover:text-white hover:bg-zinc-800 shrink-0"
                            >
                                <Smile className="w-4 h-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            side="top"
                            align="start"
                            className="w-[220px] p-2 bg-zinc-900 border-zinc-700"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-zinc-400">Pick an emoji</span>
                                <button
                                    onClick={() => setEmojiPickerOpen(false)}
                                    className="text-zinc-500 hover:text-white"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                                {QUICK_EMOJIS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        onClick={() => insertEmoji(emoji)}
                                        className="w-10 h-10 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-xl transition-colors"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-2 pt-2 border-t border-zinc-800">
                                <p className="text-[10px] text-zinc-600">
                                    Use ||text|| for spoilers
                                </p>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Send a message..."
                        className="h-9 text-sm bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-[#ffd063]/30 focus-visible:ring-1 focus-visible:border-[#ffd063]/30"
                    />

                    <Button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        size="icon"
                        className="h-9 w-9 bg-[#ffd063] hover:bg-[#ffda7a] text-black shrink-0 disabled:opacity-30"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
