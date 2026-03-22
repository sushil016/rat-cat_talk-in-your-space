"use client"

import React, { useEffect, useRef, useCallback, useState } from "react"
import { useSession } from "next-auth/react"
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, Phone } from "lucide-react"
import Peer from "simple-peer"
import { useRoomStore } from "@/store/useRoomStore"
import { connectSocket } from "@/lib/socket"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
]

interface PeerConnection {
    peer: Peer.Instance
    socketId: string
    userId: string
    name: string
    audioElement?: HTMLAudioElement
    analyser?: AnalyserNode
    audioCtx?: AudioContext
}

export function VoiceChannel() {
    const { data: session } = useSession()
    const roomCode = useRoomStore((s) => s.roomCode)
    const voicePeers = useRoomStore((s) => s.voicePeers)
    const isVoiceConnected = useRoomStore((s) => s.isVoiceConnected)
    const isVoiceMuted = useRoomStore((s) => s.isVoiceMuted)
    const isVoiceDeafened = useRoomStore((s) => s.isVoiceDeafened)
    const {
        setVoiceConnected,
        setVoiceMuted,
        setVoiceDeafened,
        addVoicePeer,
        removeVoicePeer,
        updateVoicePeer,
        clearVoicePeers,
    } = useRoomStore()

    const peersRef = useRef<Map<string, PeerConnection>>(new Map())
    const localStreamRef = useRef<MediaStream | null>(null)
    const speakingIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Connect to voice
    const joinVoice = useCallback(async () => {
        if (!roomCode || !session?.user?.id || isVoiceConnected) return

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: false,
            })
            localStreamRef.current = stream

            const socket = connectSocket()

            // Tell others we joined voice
            socket.emit("voice-join", {
                roomCode,
                userId: session.user.id,
                name: session.user.name || "User",
            })

            // When a new peer joins, we (as an existing member) create an initiator peer
            socket.on("voice-peer-joined", (data: { socketId: string; userId: string; name: string }) => {
                if (peersRef.current.has(data.socketId)) return
                createPeer(data.socketId, data.userId, data.name, stream, true)
                addVoicePeer({
                    socketId: data.socketId,
                    userId: data.userId,
                    name: data.name,
                    isMuted: false,
                    isDeafened: false,
                    isSpeaking: false,
                })
            })

            // When we receive a signal from a peer
            socket.on("voice-signal", (data: { fromSocketId: string; signal: any }) => {
                const conn = peersRef.current.get(data.fromSocketId)
                if (conn) {
                    conn.peer.signal(data.signal)
                } else {
                    // We don't know this peer yet — they initiated. Create a non-initiator peer.
                    const newConn = createPeer(data.fromSocketId, "", "", stream, false)
                    newConn.peer.signal(data.signal)
                }
            })

            // When a peer leaves
            socket.on("voice-peer-left", (data: { socketId: string }) => {
                destroyPeer(data.socketId)
                removeVoicePeer(data.socketId)
            })

            // Mute state updates from others
            socket.on("voice-mute-update", (data: {
                socketId: string
                userId: string
                isMuted: boolean
                isDeafened: boolean
            }) => {
                updateVoicePeer(data.socketId, {
                    isMuted: data.isMuted,
                    isDeafened: data.isDeafened,
                })
            })

            setVoiceConnected(true)

            // Start voice activity detection for local stream
            startVoiceActivityDetection(stream)

        } catch (err: any) {
            console.error("Voice join failed:", err)
        }
    }, [roomCode, session?.user, isVoiceConnected, setVoiceConnected, addVoicePeer, removeVoicePeer, updateVoicePeer])

    // Create a peer connection
    function createPeer(
        socketId: string,
        userId: string,
        name: string,
        stream: MediaStream,
        initiator: boolean
    ): PeerConnection {
        const socket = connectSocket()
        const peer = new Peer({
            initiator,
            stream,
            trickle: true,
            config: { iceServers: ICE_SERVERS },
        })

        peer.on("signal", (signal) => {
            socket.emit("voice-signal", {
                roomCode,
                targetSocketId: socketId,
                signal,
            })
        })

        peer.on("stream", (remoteStream) => {
            const audio = new Audio()
            audio.srcObject = remoteStream
            audio.autoplay = true
            audio.volume = 1.0

            const conn = peersRef.current.get(socketId)
            if (conn) {
                conn.audioElement = audio

                // Set up analyser for remote voice activity
                try {
                    const audioCtx = new AudioContext()
                    const source = audioCtx.createMediaStreamSource(remoteStream)
                    const analyser = audioCtx.createAnalyser()
                    analyser.fftSize = 512
                    analyser.smoothingTimeConstant = 0.4
                    source.connect(analyser)
                    conn.analyser = analyser
                    conn.audioCtx = audioCtx
                } catch {
                    // audiocontext might not be available
                }
            }
        })

        peer.on("error", (err) => {
            console.error(`Peer error (${socketId}):`, err)
            destroyPeer(socketId)
            removeVoicePeer(socketId)
        })

        peer.on("close", () => {
            destroyPeer(socketId)
            removeVoicePeer(socketId)
        })

        const conn: PeerConnection = { peer, socketId, userId, name }
        peersRef.current.set(socketId, conn)
        return conn
    }

    // Destroy a peer connection
    function destroyPeer(socketId: string) {
        const conn = peersRef.current.get(socketId)
        if (conn) {
            conn.peer.destroy()
            if (conn.audioElement) {
                conn.audioElement.pause()
                conn.audioElement.srcObject = null
            }
            if (conn.audioCtx) {
                conn.audioCtx.close().catch(() => { })
            }
            peersRef.current.delete(socketId)
        }
    }

    // Voice activity detection for local mic
    function startVoiceActivityDetection(stream: MediaStream) {
        try {
            const audioCtx = new AudioContext()
            const source = audioCtx.createMediaStreamSource(stream)
            const analyser = audioCtx.createAnalyser()
            analyser.fftSize = 512
            analyser.smoothingTimeConstant = 0.4
            source.connect(analyser)

            const dataArray = new Uint8Array(analyser.frequencyBinCount)

            speakingIntervalRef.current = setInterval(() => {
                analyser.getByteFrequencyData(dataArray)
                const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length

                // Also check remote peers' speaking state
                peersRef.current.forEach((conn) => {
                    if (conn.analyser) {
                        const remoteData = new Uint8Array(conn.analyser.frequencyBinCount)
                        conn.analyser.getByteFrequencyData(remoteData)
                        const remoteAvg = remoteData.reduce((a, b) => a + b, 0) / remoteData.length
                        updateVoicePeer(conn.socketId, { isSpeaking: remoteAvg > 20 })
                    }
                })
            }, 150)
        } catch {
            // silent
        }
    }

    // Leave voice
    const leaveVoice = useCallback(() => {
        const socket = connectSocket()
        socket.emit("voice-leave", { roomCode })

        // Clean up all peers
        peersRef.current.forEach((conn) => {
            conn.peer.destroy()
            if (conn.audioElement) {
                conn.audioElement.pause()
                conn.audioElement.srcObject = null
            }
            if (conn.audioCtx) {
                conn.audioCtx.close().catch(() => { })
            }
        })
        peersRef.current.clear()

        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop())
            localStreamRef.current = null
        }

        // Stop speaking detection
        if (speakingIntervalRef.current) {
            clearInterval(speakingIntervalRef.current)
        }

        socket.off("voice-peer-joined")
        socket.off("voice-signal")
        socket.off("voice-peer-left")
        socket.off("voice-mute-update")

        clearVoicePeers()
        setVoiceConnected(false)
        setVoiceMuted(false)
        setVoiceDeafened(false)
    }, [roomCode, clearVoicePeers, setVoiceConnected, setVoiceMuted, setVoiceDeafened])

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (!localStreamRef.current) return
        const newMuted = !isVoiceMuted
        localStreamRef.current.getAudioTracks().forEach((t) => {
            t.enabled = !newMuted
        })
        setVoiceMuted(newMuted)

        const socket = connectSocket()
        socket.emit("voice-mute-update", {
            roomCode,
            userId: session?.user?.id,
            isMuted: newMuted,
            isDeafened: isVoiceDeafened,
        })
    }, [isVoiceMuted, isVoiceDeafened, roomCode, session?.user?.id, setVoiceMuted])

    // Toggle deafen
    const toggleDeafen = useCallback(() => {
        const newDeafened = !isVoiceDeafened
        peersRef.current.forEach((conn) => {
            if (conn.audioElement) {
                conn.audioElement.volume = newDeafened ? 0 : 1
            }
        })
        setVoiceDeafened(newDeafened)

        // Also mute self when deafened
        if (newDeafened && !isVoiceMuted) {
            localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = false })
            setVoiceMuted(true)
        }

        const socket = connectSocket()
        socket.emit("voice-mute-update", {
            roomCode,
            userId: session?.user?.id,
            isMuted: newDeafened ? true : isVoiceMuted,
            isDeafened: newDeafened,
        })
    }, [isVoiceDeafened, isVoiceMuted, roomCode, session?.user?.id, setVoiceDeafened, setVoiceMuted])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isVoiceConnected) {
                leaveVoice()
            }
        }
    }, [])

    // Auto-join voice when entering watch room
    useEffect(() => {
        if (roomCode && session?.user?.id && !isVoiceConnected) {
            // Delay slightly to let socket connect first
            const timeout = setTimeout(() => {
                joinVoice()
            }, 1500)
            return () => clearTimeout(timeout)
        }
    }, [roomCode, session?.user?.id])

    const peersList = Array.from(voicePeers.values())

    return (
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-zinc-900 border border-zinc-800">
            {/* Voice activity avatars */}
            {isVoiceConnected && peersList.length > 0 && (
                <div className="flex items-center -space-x-1.5 mr-1">
                    {peersList.slice(0, 4).map((peer) => (
                        <div key={peer.socketId} className="relative">
                            <Avatar className={`w-6 h-6 border-2 transition-colors ${peer.isSpeaking
                                    ? "border-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]"
                                    : peer.isMuted
                                        ? "border-red-500/50"
                                        : "border-zinc-700"
                                }`}>
                                <AvatarFallback className="bg-zinc-800 text-[8px] text-white">
                                    {peer.name?.charAt(0)?.toUpperCase() || "?"}
                                </AvatarFallback>
                            </Avatar>
                            {peer.isMuted && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 flex items-center justify-center">
                                    <MicOff className="w-1.5 h-1.5 text-white" />
                                </div>
                            )}
                            {peer.isSpeaking && !peer.isMuted && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                            )}
                        </div>
                    ))}
                    {peersList.length > 4 && (
                        <span className="text-[9px] text-zinc-500 ml-1">+{peersList.length - 4}</span>
                    )}
                </div>
            )}

            {!isVoiceConnected ? (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={joinVoice}
                    className="h-7 px-2.5 text-green-400 hover:text-green-300 hover:bg-green-500/10 text-xs gap-1.5"
                >
                    <Phone className="w-3.5 h-3.5" />
                    Join Voice
                </Button>
            ) : (
                <>
                    {/* Mute */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleMute}
                        className={`h-7 w-7 rounded-full ${isVoiceMuted
                                ? "text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20"
                                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                            }`}
                        title={isVoiceMuted ? "Unmute" : "Mute"}
                    >
                        {isVoiceMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    </Button>

                    {/* Deafen */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleDeafen}
                        className={`h-7 w-7 rounded-full ${isVoiceDeafened
                                ? "text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20"
                                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                            }`}
                        title={isVoiceDeafened ? "Undeafen" : "Deafen"}
                    >
                        {isVoiceDeafened ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </Button>

                    {/* Disconnect */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={leaveVoice}
                        className="h-7 w-7 rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        title="Disconnect voice"
                    >
                        <PhoneOff className="w-3.5 h-3.5" />
                    </Button>
                </>
            )}
        </div>
    )
}
