import { createServer } from "http"
import { Server } from "socket.io"

const httpServer = createServer()
const io = new Server(httpServer, {
    cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
    },
})

interface RoomParticipant {
    socketId: string
    participantId: string
    userId?: string
    name: string
    avatar?: string
    role: string
    isReady: boolean
}

interface ChatMessage {
    id: string
    content: string
    type: "text" | "reaction" | "system"
    userId: string
    username: string
    imageUrl?: string
    createdAt: string
    reactions: { emoji: string; userId: string; username: string }[]
}

// In-memory room state
const rooms = new Map<string, Map<string, RoomParticipant>>()

// In-memory chat store per room (capped at 200 messages)
const MAX_CHAT_MESSAGES = 200
const roomChats = new Map<string, ChatMessage[]>()

// ── Space (2D world) state ──
interface SpacePlayer {
    socketId: string
    userId: string
    name: string
    avatar?: string
    x: number
    y: number
    isMuted: boolean
    color: string
    status?: string
    activeZoneId?: string
}
const spacePlayers = new Map<string, Map<string, SpacePlayer>>() // roomCode → (userId → SpacePlayer)

function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

io.on("connection", (socket) => {
    console.log(`🔌 Connected: ${socket.id}`)

    // Join a room
    socket.on("join-room", (data: {
        roomCode: string
        participantId: string
        userId?: string
        name: string
        avatar?: string
        role: string
    }) => {
        const { roomCode, participantId, userId, name, avatar, role } = data

        socket.join(roomCode)

        if (!rooms.has(roomCode)) {
            rooms.set(roomCode, new Map())
        }

        rooms.get(roomCode)!.set(socket.id, {
            socketId: socket.id,
            participantId,
            userId,
            name,
            avatar,
            role,
            isReady: role === "host",
        })

        const participants = Array.from(rooms.get(roomCode)!.values())
        io.to(roomCode).emit("participants-update", participants)
        socket.to(roomCode).emit("user-joined", { name, role, participantId })

        // Send chat history to the joining user
        const chatHistory = roomChats.get(roomCode) || []
        socket.emit("chat-history", chatHistory)

        // System message
        if (!roomChats.has(roomCode)) {
            roomChats.set(roomCode, [])
        }
        const systemMsg: ChatMessage = {
            id: generateMessageId(),
            content: `${name} joined the room`,
            type: "system",
            userId: userId || participantId,
            username: name,
            createdAt: new Date().toISOString(),
            reactions: [],
        }
        roomChats.get(roomCode)!.push(systemMsg)
        io.to(roomCode).emit("new-message", systemMsg)

        console.log(`👤 ${name} joined room ${roomCode} (${participants.length} total)`)
    })

    // Chat: send message
    socket.on("send-message", (data: {
        roomCode: string
        content: string
        userId: string
        username: string
        imageUrl?: string
    }) => {
        const { roomCode, content, userId, username, imageUrl } = data
        if (!content.trim()) return

        const message: ChatMessage = {
            id: generateMessageId(),
            content: content.trim(),
            type: "text",
            userId,
            username,
            imageUrl,
            createdAt: new Date().toISOString(),
            reactions: [],
        }

        if (!roomChats.has(roomCode)) {
            roomChats.set(roomCode, [])
        }
        const chat = roomChats.get(roomCode)!
        chat.push(message)

        // Cap at MAX_CHAT_MESSAGES
        if (chat.length > MAX_CHAT_MESSAGES) {
            chat.splice(0, chat.length - MAX_CHAT_MESSAGES)
        }

        io.to(roomCode).emit("new-message", message)
        console.log(`💬 [${roomCode}] ${username}: ${content.slice(0, 50)}`)
    })

    // Chat: add reaction to a message
    socket.on("send-reaction", (data: {
        roomCode: string
        messageId: string
        emoji: string
        userId: string
        username: string
    }) => {
        const { roomCode, messageId, emoji, userId, username } = data
        const chat = roomChats.get(roomCode)
        if (!chat) return

        const msg = chat.find(m => m.id === messageId)
        if (!msg) return

        // Toggle: if already reacted with this emoji, remove it
        const existingIdx = msg.reactions.findIndex(
            r => r.emoji === emoji && r.userId === userId
        )
        if (existingIdx >= 0) {
            msg.reactions.splice(existingIdx, 1)
        } else {
            msg.reactions.push({ emoji, userId, username })
        }

        io.to(roomCode).emit("message-reaction-update", {
            messageId,
            reactions: msg.reactions,
        })
    })

    // Floating emoji reaction on video player
    socket.on("floating-reaction", (data: {
        roomCode: string
        emoji: string
        userId: string
        username: string
    }) => {
        io.to(data.roomCode).emit("floating-emoji", {
            id: generateMessageId(),
            emoji: data.emoji,
            userId: data.userId,
            username: data.username,
            timestamp: Date.now(),
        })
    })

    // Set media (Host only)
    socket.on("set-media", (data: { roomCode: string, url: string, type: string, title?: string }) => {
        io.to(data.roomCode).emit("media-changed", {
            url: data.url,
            type: data.type,
            title: data.title
        })
        console.log(`📺 Media changed in ${data.roomCode}: ${data.url}`)
    })

    // Play / Pause (Host)
    socket.on("toggle-play", (data: { roomCode: string, isPlaying: boolean, currentTime: number }) => {
        socket.to(data.roomCode).emit("play-state-changed", {
            isPlaying: data.isPlaying,
            currentTime: data.currentTime
        })
    })

    // Seek / periodic sync (Host)
    socket.on("sync-time", (data: { roomCode: string, currentTime: number, isPlaying: boolean }) => {
        socket.to(data.roomCode).emit("time-sync", {
            currentTime: data.currentTime,
            isPlaying: data.isPlaying,
            timestamp: Date.now()
        })
    })

    // Lobby readiness
    socket.on("toggle-ready", (data: { roomCode: string }) => {
        const { roomCode } = data
        const roomParticipants = rooms.get(roomCode)
        if (!roomParticipants) return

        const participant = roomParticipants.get(socket.id)
        if (!participant) return

        participant.isReady = !participant.isReady
        roomParticipants.set(socket.id, participant)

        const participants = Array.from(roomParticipants.values())
        io.to(roomCode).emit("participants-update", participants)

        const allReady = participants.every((p) => p.isReady)
        if (allReady && participants.length >= 2) {
            io.to(roomCode).emit("everyone-ready")
        }
    })

    // ============= VOICE CHAT (WebRTC Signaling) =============

    // Voice: join voice channel
    socket.on("voice-join", (data: { roomCode: string; userId: string; name: string }) => {
        // Notify all other peers in the room that this user wants to connect
        socket.to(data.roomCode).emit("voice-peer-joined", {
            socketId: socket.id,
            userId: data.userId,
            name: data.name,
        })
        console.log(`🎤 ${data.name} joined voice in ${data.roomCode}`)
    })

    // Voice: relay WebRTC signal (offer/answer/ICE candidates)
    socket.on("voice-signal", (data: {
        roomCode: string
        targetSocketId: string
        signal: any
    }) => {
        io.to(data.targetSocketId).emit("voice-signal", {
            fromSocketId: socket.id,
            signal: data.signal,
        })
    })

    // Voice: leave voice channel
    socket.on("voice-leave", (data: { roomCode: string }) => {
        socket.to(data.roomCode).emit("voice-peer-left", {
            socketId: socket.id,
        })
    })

    // Voice: mute/deafen state update
    socket.on("voice-mute-update", (data: {
        roomCode: string
        userId: string
        isMuted: boolean
        isDeafened: boolean
    }) => {
        socket.to(data.roomCode).emit("voice-mute-update", {
            socketId: socket.id,
            userId: data.userId,
            isMuted: data.isMuted,
            isDeafened: data.isDeafened,
        })
    })

    // ============= END VOICE CHAT =============

    // ============= SPACE (2D world) =============

    socket.on("space-join", (data: {
        roomCode: string
        userId: string
        name: string
        avatar?: string
        x: number
        y: number
        isMuted: boolean
        color: string
    }) => {
        const { roomCode, userId, name, avatar, x, y, isMuted, color } = data
        socket.join(`space:${roomCode}`)

        if (!spacePlayers.has(roomCode)) spacePlayers.set(roomCode, new Map())
        spacePlayers.get(roomCode)!.set(userId, { socketId: socket.id, userId, name, avatar, x, y, isMuted, color })

        // Send current players list to the joining user
        const players = Array.from(spacePlayers.get(roomCode)!.values())
        socket.emit("space-players", players)

        // Notify others
        const newPlayer: SpacePlayer = { socketId: socket.id, userId, name, avatar, x, y, isMuted, color }
        socket.to(`space:${roomCode}`).emit("space-player-moved", newPlayer)

        console.log(`🗺️  ${name} joined space ${roomCode} (${players.length} total)`)
    })

    socket.on("space-move", (data: {
        roomCode: string
        userId: string
        name: string
        avatar?: string
        x: number
        y: number
        isMuted: boolean
        color: string
    }) => {
        const { roomCode, userId, name, avatar, x, y, isMuted, color } = data
        const room = spacePlayers.get(roomCode)
        if (!room) return

        const existing = room.get(userId)
        const updated: SpacePlayer = { socketId: socket.id, userId, name, avatar, x, y, isMuted, color }
        room.set(userId, updated)

        if (existing) {
            socket.to(`space:${roomCode}`).emit("space-player-moved", updated)
        }
    })

    socket.on("space-leave", (data: { roomCode: string; userId: string }) => {
        handleSpaceLeave(socket.id, data.roomCode, data.userId)
    })

    // ============= END SPACE =============

    // ============= SPACE VOICE (proximity) =============

    socket.on("space-voice-join", (data: { roomCode: string; userId: string; name: string }) => {
        socket.to(`space:${data.roomCode}`).emit("space-voice-peer-joined", {
            socketId: socket.id,
            userId: data.userId,
            name: data.name,
        })
    })

    socket.on("space-voice-signal", (data: { roomCode: string; targetSocketId: string; signal: any }) => {
        io.to(data.targetSocketId).emit("space-voice-signal", {
            fromSocketId: socket.id,
            signal: data.signal,
        })
    })

    socket.on("space-voice-leave", (data: { roomCode: string }) => {
        socket.to(`space:${data.roomCode}`).emit("space-voice-peer-left", {
            socketId: socket.id,
        })
    })

    socket.on("space-camera-state", (data: { roomCode: string; cameraOn: boolean }) => {
        socket.to(`space:${data.roomCode}`).emit("space-camera-state", {
            socketId: socket.id,
            cameraOn: data.cameraOn,
        })
    })

    // Set player status (zone activity)
    socket.on("space-set-status", (data: { roomCode: string; userId: string; status: string; activeZoneId?: string }) => {
        const { roomCode, userId, status, activeZoneId } = data
        const room = spacePlayers.get(roomCode)
        if (!room) return
        const player = room.get(userId)
        if (!player) return
        player.status = status || undefined
        player.activeZoneId = activeZoneId
        room.set(userId, player)
        io.to(`space:${roomCode}`).emit("space-player-moved", player)
    })

    // ============= END SPACE VOICE =============

    // Start the room
    socket.on("start-room", (data: { roomCode: string }) => {
        io.to(data.roomCode).emit("room-started")
    })

    // Leave room
    socket.on("leave-room", (data: { roomCode: string }) => {
        handleLeave(socket, data.roomCode)
    })

    // Disconnect
    socket.on("disconnect", () => {
        for (const [roomCode, participants] of rooms.entries()) {
            if (participants.has(socket.id)) {
                socket.to(roomCode).emit("voice-peer-left", { socketId: socket.id })
                handleLeave(socket, roomCode)
            }
        }
        // Clean up space players
        for (const [roomCode, players] of spacePlayers.entries()) {
            for (const [userId, p] of players.entries()) {
                if (p.socketId === socket.id) {
                    io.to(`space:${roomCode}`).emit("space-voice-peer-left", { socketId: socket.id })
                    handleSpaceLeave(socket.id, roomCode, userId)
                    break
                }
            }
        }
    })
})

function handleSpaceLeave(socketId: string, roomCode: string, userId: string) {
    const room = spacePlayers.get(roomCode)
    if (!room) return
    room.delete(userId)
    if (room.size === 0) spacePlayers.delete(roomCode)
    io.to(`space:${roomCode}`).emit("space-player-left", userId)
    console.log(`🗺️  ${userId} left space ${roomCode}`)
}

function handleLeave(socket: ReturnType<typeof io.of>["sockets"] extends Map<string, infer S> ? S : never, roomCode: string) {
    const roomParticipants = rooms.get(roomCode)
    if (!roomParticipants) return

    const participant = roomParticipants.get(socket.id)
    roomParticipants.delete(socket.id)
    socket.leave(roomCode)

    if (roomParticipants.size === 0) {
        rooms.delete(roomCode)
        // Keep chat history for a bit even when room empties
        // (it will be cleaned up when the room is garbage-collected)
    } else {
        const participants = Array.from(roomParticipants.values())
        io.to(roomCode).emit("participants-update", participants)
        if (participant) {
            socket.to(roomCode).emit("user-left", { name: participant.name })

            // System message
            const chat = roomChats.get(roomCode)
            if (chat) {
                const systemMsg: ChatMessage = {
                    id: generateMessageId(),
                    content: `${participant.name} left the room`,
                    type: "system",
                    userId: participant.userId || participant.participantId,
                    username: participant.name,
                    createdAt: new Date().toISOString(),
                    reactions: [],
                }
                chat.push(systemMsg)
                io.to(roomCode).emit("new-message", systemMsg)
            }
        }
    }
}

const PORT = parseInt(process.env.SOCKET_PORT || "3001")
httpServer.listen(PORT, () => {
    console.log(`🚀 Socket.io server running on port ${PORT}`)
})
