import { create } from "zustand"

export interface LobbyParticipant {
    socketId: string
    participantId: string
    userId?: string
    name: string
    avatar?: string
    role: string
    isReady: boolean
}

export interface ChatReaction {
    emoji: string
    userId: string
    username: string
}

export interface ChatMessage {
    id: string
    content: string
    type: "text" | "reaction" | "system"
    userId: string
    username: string
    imageUrl?: string
    createdAt: string
    reactions: ChatReaction[]
}

export interface FloatingEmoji {
    id: string
    emoji: string
    userId: string
    username: string
    x: number // random horizontal position (0-100%)
    timestamp: number
}

export interface VoicePeerState {
    socketId: string
    userId: string
    name: string
    isMuted: boolean
    isDeafened: boolean
    isSpeaking: boolean
}

export interface RoomState {
    // Room info
    roomId: string | null
    roomCode: string | null
    roomName: string | null
    roomTheme: "rat_den" | "cat_lounge" | "neutral" | null
    roomStatus: "waiting" | "live" | "ended" | null

    // Media state
    mediaUrl: string | null
    mediaType: "youtube" | "upload" | "direct" | null
    mediaTitle: string | null
    isPlaying: boolean
    currentTime: number
    playbackRate: number

    // Lobby participants (real-time from socket)
    lobbyParticipants: LobbyParticipant[]
    everyoneReady: boolean

    // Chat
    messages: ChatMessage[]

    // Floating emojis
    floatingEmojis: FloatingEmoji[]

    // Voice chat
    voicePeers: Map<string, VoicePeerState>
    isVoiceConnected: boolean
    isVoiceMuted: boolean
    isVoiceDeafened: boolean

    // Actions
    setRoom: (data: {
        roomId: string
        roomCode: string
        roomName: string
        roomTheme?: string
        roomStatus?: string
    }) => void
    clearRoom: () => void
    setRoomStatus: (status: "waiting" | "live" | "ended") => void
    setMedia: (url: string, type: "youtube" | "upload" | "direct", title: string) => void
    setPlaying: (isPlaying: boolean) => void
    setCurrentTime: (time: number) => void
    setPlaybackRate: (rate: number) => void
    setLobbyParticipants: (participants: LobbyParticipant[]) => void
    setEveryoneReady: (ready: boolean) => void
    addMessage: (message: ChatMessage) => void
    setMessages: (messages: ChatMessage[]) => void
    updateMessageReactions: (messageId: string, reactions: ChatReaction[]) => void
    addFloatingEmoji: (emoji: FloatingEmoji) => void
    removeFloatingEmoji: (id: string) => void
    // Voice
    setVoiceConnected: (connected: boolean) => void
    setVoiceMuted: (muted: boolean) => void
    setVoiceDeafened: (deafened: boolean) => void
    addVoicePeer: (peer: VoicePeerState) => void
    removeVoicePeer: (socketId: string) => void
    updateVoicePeer: (socketId: string, updates: Partial<VoicePeerState>) => void
    clearVoicePeers: () => void
}

export const useRoomStore = create<RoomState>((set) => ({
    // Room info
    roomId: null,
    roomCode: null,
    roomName: null,
    roomTheme: null,
    roomStatus: null,

    // Media state
    mediaUrl: null,
    mediaType: null,
    mediaTitle: null,
    isPlaying: false,
    currentTime: 0,
    playbackRate: 1,

    // Lobby
    lobbyParticipants: [],
    everyoneReady: false,

    // Chat
    messages: [],

    // Floating emojis
    floatingEmojis: [],

    // Voice
    voicePeers: new Map(),
    isVoiceConnected: false,
    isVoiceMuted: false,
    isVoiceDeafened: false,

    // Actions
    setRoom: ({ roomId, roomCode, roomName, roomTheme, roomStatus }) =>
        set({
            roomId,
            roomCode,
            roomName,
            roomTheme: (roomTheme as RoomState["roomTheme"]) || "neutral",
            roomStatus: (roomStatus as RoomState["roomStatus"]) || "waiting",
        }),

    clearRoom: () =>
        set({
            roomId: null,
            roomCode: null,
            roomName: null,
            roomTheme: null,
            roomStatus: null,
            mediaUrl: null,
            mediaType: null,
            mediaTitle: null,
            isPlaying: false,
            currentTime: 0,
            playbackRate: 1,
            lobbyParticipants: [],
            everyoneReady: false,
            messages: [],
            floatingEmojis: [],
            voicePeers: new Map(),
            isVoiceConnected: false,
            isVoiceMuted: false,
            isVoiceDeafened: false,
        }),

    setRoomStatus: (status) => set({ roomStatus: status }),
    setMedia: (url, type, title) =>
        set({ mediaUrl: url, mediaType: type, mediaTitle: title }),
    setPlaying: (isPlaying) => set({ isPlaying }),
    setCurrentTime: (time) => set({ currentTime: time }),
    setPlaybackRate: (rate) => set({ playbackRate: rate }),
    setLobbyParticipants: (participants) => set({ lobbyParticipants: participants }),
    setEveryoneReady: (ready) => set({ everyoneReady: ready }),
    addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
    setMessages: (messages) => set({ messages }),
    updateMessageReactions: (messageId, reactions) =>
        set((state) => ({
            messages: state.messages.map((m) =>
                m.id === messageId ? { ...m, reactions } : m
            ),
        })),
    addFloatingEmoji: (emoji) =>
        set((state) => ({ floatingEmojis: [...state.floatingEmojis, emoji] })),
    removeFloatingEmoji: (id) =>
        set((state) => ({
            floatingEmojis: state.floatingEmojis.filter((e) => e.id !== id),
        })),
    // Voice
    setVoiceConnected: (connected) => set({ isVoiceConnected: connected }),
    setVoiceMuted: (muted) => set({ isVoiceMuted: muted }),
    setVoiceDeafened: (deafened) => set({ isVoiceDeafened: deafened }),
    addVoicePeer: (peer) =>
        set((state) => {
            const newMap = new Map(state.voicePeers)
            newMap.set(peer.socketId, peer)
            return { voicePeers: newMap }
        }),
    removeVoicePeer: (socketId) =>
        set((state) => {
            const newMap = new Map(state.voicePeers)
            newMap.delete(socketId)
            return { voicePeers: newMap }
        }),
    updateVoicePeer: (socketId, updates) =>
        set((state) => {
            const newMap = new Map(state.voicePeers)
            const existing = newMap.get(socketId)
            if (existing) {
                newMap.set(socketId, { ...existing, ...updates })
            }
            return { voicePeers: newMap }
        }),
    clearVoicePeers: () => set({ voicePeers: new Map() }),
}))

export const isHostSelector = (state: RoomState, currentUserId: string | undefined): boolean => {
    if (!currentUserId) return false
    const p = state.lobbyParticipants.find(p => p.userId === currentUserId)
    return p?.role === "host"
}
