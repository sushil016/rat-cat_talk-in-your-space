"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Mic, MicOff, ArrowLeft } from "lucide-react"
import { connectSocket } from "@/lib/socket"

// World dimensions
const WORLD_W = 2200
const WORLD_H = 1500
const SPEED = 4
const PLAYER_SIZE = 40
const EMIT_MS = 80

interface SpacePlayer {
    socketId: string
    userId: string
    name: string
    avatar?: string
    x: number
    y: number
    isMuted: boolean
    color: string
}

interface Zone {
    id: string
    label: string
    icon: string
    description: string
    x: number
    y: number
    w: number
    h: number
    bg: string
    border: string
    action: string
}

const ZONES: Zone[] = [
    {
        id: "watch",
        label: "Watch Together",
        icon: "🎬",
        description: "Watch movies & videos in sync",
        x: 80, y: 60, w: 920, h: 600,
        bg: "rgba(255,208,99,0.06)",
        border: "#ffd063",
        action: "watch",
    },
    {
        id: "chill",
        label: "Chill Zone",
        icon: "🎤",
        description: "Voice & video hangout",
        x: 80, y: 760, w: 720, h: 660,
        bg: "rgba(0,166,255,0.06)",
        border: "#00a6ff",
        action: "chill",
    },
    {
        id: "gaming",
        label: "Gaming Room",
        icon: "🎮",
        description: "Screen share & play games",
        x: 1160, y: 60, w: 960, h: 1360,
        bg: "rgba(168,85,247,0.06)",
        border: "#a855f7",
        action: "gaming",
    },
]

interface Furniture {
    x: number
    y: number
    w: number
    h: number
    emoji: string
    label?: string
    solid: boolean
}

const FURNITURE: Furniture[] = [
    // ── Watch Together ──
    { x: 330, y: 90, w: 320, h: 56, emoji: "📺", label: "Screen", solid: true },
    // Row 1 chairs
    { x: 150, y: 240, w: 46, h: 46, emoji: "🪑", solid: true },
    { x: 218, y: 240, w: 46, h: 46, emoji: "🪑", solid: true },
    { x: 286, y: 240, w: 46, h: 46, emoji: "🪑", solid: true },
    { x: 354, y: 240, w: 46, h: 46, emoji: "🪑", solid: true },
    { x: 422, y: 240, w: 46, h: 46, emoji: "🪑", solid: true },
    { x: 490, y: 240, w: 46, h: 46, emoji: "🪑", solid: true },
    // Row 2 chairs
    { x: 150, y: 320, w: 46, h: 46, emoji: "🪑", solid: true },
    { x: 218, y: 320, w: 46, h: 46, emoji: "🪑", solid: true },
    { x: 286, y: 320, w: 46, h: 46, emoji: "🪑", solid: true },
    { x: 354, y: 320, w: 46, h: 46, emoji: "🪑", solid: true },
    { x: 422, y: 320, w: 46, h: 46, emoji: "🪑", solid: true },
    { x: 490, y: 320, w: 46, h: 46, emoji: "🪑", solid: true },
    // Snack table
    { x: 820, y: 280, w: 72, h: 72, emoji: "🍿", solid: false },
    { x: 820, y: 370, w: 72, h: 72, emoji: "🥤", solid: false },
    { x: 130, y: 450, w: 40, h: 60, emoji: "🌿", solid: false },
    { x: 870, y: 460, w: 40, h: 60, emoji: "🌿", solid: false },

    // ── Chill Zone ──
    { x: 128, y: 810, w: 170, h: 54, emoji: "🛋️", solid: true },
    { x: 520, y: 810, w: 170, h: 54, emoji: "🛋️", solid: true },
    { x: 128, y: 1270, w: 170, h: 54, emoji: "🛋️", solid: true },
    { x: 520, y: 1270, w: 170, h: 54, emoji: "🛋️", solid: true },
    { x: 310, y: 1020, w: 84, h: 84, emoji: "☕", solid: false },
    { x: 150, y: 1060, w: 40, h: 60, emoji: "🌿", solid: false },
    { x: 650, y: 1060, w: 40, h: 60, emoji: "🌿", solid: false },
    { x: 310, y: 880, w: 200, h: 54, emoji: "🛋️", solid: true },

    // ── Gaming Room ──
    // Desk row 1
    { x: 1210, y: 100, w: 140, h: 52, emoji: "🖥️", solid: true },
    { x: 1400, y: 100, w: 140, h: 52, emoji: "🖥️", solid: true },
    { x: 1590, y: 100, w: 140, h: 52, emoji: "🖥️", solid: true },
    { x: 1780, y: 100, w: 140, h: 52, emoji: "🖥️", solid: true },
    { x: 1230, y: 174, w: 48, h: 48, emoji: "🪑", solid: true },
    { x: 1420, y: 174, w: 48, h: 48, emoji: "🪑", solid: true },
    { x: 1610, y: 174, w: 48, h: 48, emoji: "🪑", solid: true },
    { x: 1800, y: 174, w: 48, h: 48, emoji: "🪑", solid: true },
    // Desk row 2
    { x: 1210, y: 500, w: 140, h: 52, emoji: "🖥️", solid: true },
    { x: 1400, y: 500, w: 140, h: 52, emoji: "🖥️", solid: true },
    { x: 1590, y: 500, w: 140, h: 52, emoji: "🖥️", solid: true },
    { x: 1780, y: 500, w: 140, h: 52, emoji: "🖥️", solid: true },
    { x: 1230, y: 574, w: 48, h: 48, emoji: "🪑", solid: true },
    { x: 1420, y: 574, w: 48, h: 48, emoji: "🪑", solid: true },
    { x: 1610, y: 574, w: 48, h: 48, emoji: "🪑", solid: true },
    { x: 1800, y: 574, w: 48, h: 48, emoji: "🪑", solid: true },
    // Console area
    { x: 1220, y: 900, w: 220, h: 110, emoji: "🎮", solid: true },
    { x: 1265, y: 1050, w: 170, h: 54, emoji: "🛋️", solid: true },
    { x: 1520, y: 900, w: 220, h: 110, emoji: "🕹️", solid: true },
    { x: 1565, y: 1050, w: 170, h: 54, emoji: "🛋️", solid: true },
    { x: 1380, y: 790, w: 40, h: 60, emoji: "🌿", solid: false },
    { x: 1960, y: 790, w: 40, h: 60, emoji: "🌿", solid: false },
]

const PLAYER_COLORS = ["#ffd063", "#00a6ff", "#a855f7", "#ec4899", "#10b981", "#f97316", "#06b6d4", "#f43f5e"]

function deriveColor(id: string): string {
    let h = 0
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
    return PLAYER_COLORS[Math.abs(h) % PLAYER_COLORS.length]
}

function getInitial(name: string): string {
    return name?.charAt(0)?.toUpperCase() || "?"
}

function isInZone(px: number, py: number, zone: Zone): boolean {
    return px >= zone.x && px <= zone.x + zone.w && py >= zone.y && py <= zone.y + zone.h
}

function checkFurnitureCollision(nx: number, ny: number): boolean {
    const half = PLAYER_SIZE / 2
    for (const f of FURNITURE) {
        if (!f.solid) continue
        if (
            nx + half > f.x + 6 &&
            nx - half < f.x + f.w - 6 &&
            ny + half > f.y + 6 &&
            ny - half < f.y + f.h - 6
        ) return true
    }
    return false
}

// ── Player Avatar (other players) ──
function OtherPlayer({ player }: { player: SpacePlayer }) {
    return (
        <div
            style={{
                position: "absolute",
                left: player.x - PLAYER_SIZE / 2,
                top: player.y - PLAYER_SIZE / 2,
                width: PLAYER_SIZE,
                height: PLAYER_SIZE,
            }}
        >
            {/* Name tag */}
            <div style={{
                position: "absolute",
                bottom: "calc(100% + 4px)",
                left: "50%",
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 4,
            }}>
                {player.isMuted && <span style={{ fontSize: 10 }}>🔇</span>}
                <div style={{
                    background: "rgba(0,0,0,0.85)",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 10,
                    border: `1px solid ${player.color}60`,
                }}>
                    {player.name}
                </div>
            </div>
            {/* Avatar */}
            <div style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: `radial-gradient(circle at 35% 35%, ${player.color}, ${player.color}88)`,
                border: `2px solid ${player.color}`,
                boxShadow: `0 0 10px ${player.color}60`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
                color: "#000",
                overflow: "hidden",
            }}>
                {player.avatar
                    ? <img src={player.avatar} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : getInitial(player.name)}
            </div>
        </div>
    )
}

// ── Minimap ──
function Minimap({ pos, others, myColor }: { pos: { x: number; y: number }; others: SpacePlayer[]; myColor: string }) {
    const SCALE = 0.075
    const W = Math.round(WORLD_W * SCALE)
    const H = Math.round(WORLD_H * SCALE)
    return (
        <div style={{
            position: "absolute",
            bottom: 76,
            right: 16,
            width: W,
            height: H,
            background: "rgba(0,0,0,0.75)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
            overflow: "hidden",
            zIndex: 100,
        }}>
            {ZONES.map(z => (
                <div key={z.id} style={{
                    position: "absolute",
                    left: z.x * SCALE,
                    top: z.y * SCALE,
                    width: z.w * SCALE,
                    height: z.h * SCALE,
                    background: z.bg,
                    border: `1px solid ${z.border}60`,
                    borderRadius: 2,
                }} />
            ))}
            {others.map(p => (
                <div key={p.userId} style={{
                    position: "absolute",
                    left: p.x * SCALE - 3,
                    top: p.y * SCALE - 3,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: p.color,
                }} />
            ))}
            <div style={{
                position: "absolute",
                left: pos.x * SCALE - 4,
                top: pos.y * SCALE - 4,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: myColor,
                boxShadow: `0 0 4px ${myColor}`,
            }} />
        </div>
    )
}

// ── Main component ──
export function GameSpace({
    roomCode,
    roomId,
    userId,
    userName,
    userAvatar,
}: {
    roomCode: string
    roomId: string
    userId: string
    userName: string
    userAvatar?: string
}) {
    const router = useRouter()
    const rafRef = useRef<number>(0)
    const keysRef = useRef(new Set<string>())
    const posRef = useRef({ x: 640, y: 700 })
    const lastEmitRef = useRef(0)
    const activeZoneRef = useRef<Zone | null>(null)
    const isMutedRef = useRef(false)

    const [pos, setPos] = useState({ x: 640, y: 700 })
    const [others, setOthers] = useState<SpacePlayer[]>([])
    const [activeZone, setActiveZone] = useState<Zone | null>(null)
    const [isMuted, setIsMuted] = useState(false)
    const [vp, setVp] = useState({ w: typeof window !== "undefined" ? window.innerWidth : 1280, h: typeof window !== "undefined" ? window.innerHeight : 800 })

    const myColor = deriveColor(userId)

    // Viewport resize
    useEffect(() => {
        function resize() { setVp({ w: window.innerWidth, h: window.innerHeight }) }
        window.addEventListener("resize", resize)
        return () => window.removeEventListener("resize", resize)
    }, [])

    // Socket connection
    useEffect(() => {
        const socket = connectSocket()

        socket.emit("space-join", {
            roomCode,
            userId,
            name: userName,
            avatar: userAvatar,
            x: posRef.current.x,
            y: posRef.current.y,
            isMuted: false,
            color: myColor,
        })

        socket.on("space-players", (players: SpacePlayer[]) => {
            setOthers(players.filter(p => p.userId !== userId))
        })

        socket.on("space-player-moved", (p: SpacePlayer) => {
            if (p.userId === userId) return
            setOthers(prev => [...prev.filter(x => x.userId !== p.userId), p])
        })

        socket.on("space-player-left", (leftUserId: string) => {
            setOthers(prev => prev.filter(p => p.userId !== leftUserId))
        })

        return () => {
            socket.emit("space-leave", { roomCode, userId })
            socket.off("space-players")
            socket.off("space-player-moved")
            socket.off("space-player-left")
        }
    }, [roomCode, userId, userName, userAvatar, myColor])

    // Game loop
    useEffect(() => {
        function tick() {
            const keys = keysRef.current
            let { x, y } = posRef.current
            const half = PLAYER_SIZE / 2

            const dx = (keys.has("arrowleft") || keys.has("a")) ? -SPEED : (keys.has("arrowright") || keys.has("d")) ? SPEED : 0
            const dy = (keys.has("arrowup") || keys.has("w")) ? -SPEED : (keys.has("arrowdown") || keys.has("s")) ? SPEED : 0

            if (dx !== 0 || dy !== 0) {
                const nx = Math.max(half, Math.min(WORLD_W - half, x + dx))
                const ny = Math.max(half, Math.min(WORLD_H - half, y + dy))

                if (!checkFurnitureCollision(nx, ny)) {
                    x = nx; y = ny
                } else if (!checkFurnitureCollision(nx, y)) {
                    x = nx
                } else if (!checkFurnitureCollision(x, ny)) {
                    y = ny
                }

                posRef.current = { x, y }
                setPos({ x, y })

                const now = Date.now()
                if (now - lastEmitRef.current > EMIT_MS) {
                    lastEmitRef.current = now
                    const socket = connectSocket()
                    socket.emit("space-move", {
                        roomCode, userId,
                        name: userName,
                        avatar: userAvatar,
                        x, y,
                        isMuted: isMutedRef.current,
                        color: myColor,
                    })
                }
            }

            const inZone = ZONES.find(z => isInZone(x, y, z)) ?? null
            if (inZone?.id !== activeZoneRef.current?.id) {
                activeZoneRef.current = inZone
                setActiveZone(inZone)
            }

            rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(rafRef.current)
    }, [roomCode, userId, userName, userAvatar, myColor])

    // Key handlers
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase()
            keysRef.current.add(key)
            if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) e.preventDefault()
            if (key === "e" && activeZoneRef.current) handleEnterZone(activeZoneRef.current)
        }
        const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase())
        window.addEventListener("keydown", down)
        window.addEventListener("keyup", up)
        return () => {
            window.removeEventListener("keydown", down)
            window.removeEventListener("keyup", up)
        }
    }, [])

    function handleEnterZone(zone: Zone) {
        if (zone.action === "watch" || zone.action === "chill" || zone.action === "gaming") {
            router.push(`/rooms/${roomId}/watch`)
        }
    }

    function toggleMute() {
        const newMuted = !isMuted
        setIsMuted(newMuted)
        isMutedRef.current = newMuted
        const socket = connectSocket()
        socket.emit("space-move", {
            roomCode, userId,
            name: userName,
            avatar: userAvatar,
            x: posRef.current.x,
            y: posRef.current.y,
            isMuted: newMuted,
            color: myColor,
        })
    }

    // Camera
    const camX = Math.max(0, Math.min(WORLD_W - vp.w, pos.x - vp.w / 2))
    const camY = Math.max(0, Math.min(WORLD_H - vp.h, pos.y - vp.h / 2))

    return (
        <div style={{ width: vp.w, height: vp.h, overflow: "hidden", position: "relative", background: "#080808" }}>

            {/* ── World ── */}
            <div style={{
                position: "absolute",
                width: WORLD_W,
                height: WORLD_H,
                transform: `translate(${-camX}px, ${-camY}px)`,
                backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
                `,
                backgroundSize: "64px 64px",
                backgroundColor: "#0a0a0f",
            }}>

                {/* Zones */}
                {ZONES.map(zone => {
                    const isActive = activeZone?.id === zone.id
                    return (
                        <div key={zone.id} style={{
                            position: "absolute",
                            left: zone.x, top: zone.y,
                            width: zone.w, height: zone.h,
                            background: isActive
                                ? `${zone.bg.replace("0.06", "0.12")}`
                                : zone.bg,
                            border: `2px solid ${isActive ? zone.border : zone.border + "60"}`,
                            borderRadius: 24,
                            transition: "all 0.2s",
                            boxShadow: isActive ? `inset 0 0 80px ${zone.border}18, 0 0 30px ${zone.border}20` : "none",
                        }}>
                            {/* Zone header */}
                            <div style={{ position: "absolute", top: 18, left: 22, display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 32 }}>{zone.icon}</span>
                                <div>
                                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>{zone.label}</div>
                                    <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>{zone.description}</div>
                                </div>
                            </div>
                        </div>
                    )
                })}

                {/* Furniture */}
                {FURNITURE.map((f, i) => (
                    <div key={i} style={{
                        position: "absolute",
                        left: f.x, top: f.y,
                        width: f.w, height: f.h,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: Math.min(f.w, f.h) * 0.72,
                        userSelect: "none",
                        pointerEvents: "none",
                    }}>
                        {f.emoji}
                        {f.label && (
                            <div style={{
                                position: "absolute",
                                bottom: "100%",
                                left: "50%",
                                transform: "translateX(-50%)",
                                fontSize: 10,
                                color: "rgba(255,255,255,0.4)",
                                whiteSpace: "nowrap",
                                paddingBottom: 2,
                            }}>
                                {f.label}
                            </div>
                        )}
                    </div>
                ))}

                {/* Other players */}
                {others.map(p => <OtherPlayer key={p.userId} player={p} />)}

                {/* Local player */}
                <div style={{
                    position: "absolute",
                    left: pos.x - PLAYER_SIZE / 2,
                    top: pos.y - PLAYER_SIZE / 2,
                    width: PLAYER_SIZE,
                    height: PLAYER_SIZE,
                    zIndex: 20,
                }}>
                    {/* Name tag */}
                    <div style={{
                        position: "absolute",
                        bottom: "calc(100% + 4px)",
                        left: "50%",
                        transform: "translateX(-50%)",
                        whiteSpace: "nowrap",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                    }}>
                        {isMuted && <span style={{ fontSize: 10 }}>🔇</span>}
                        <div style={{
                            background: "rgba(0,0,0,0.9)",
                            color: "white",
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 10,
                            border: `1px solid ${myColor}80`,
                        }}>
                            {userName} (you)
                        </div>
                    </div>
                    {/* Avatar */}
                    <div style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        background: `radial-gradient(circle at 35% 35%, ${myColor}, ${myColor}88)`,
                        border: `3px solid ${myColor}`,
                        boxShadow: `0 0 16px ${myColor}80`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#000",
                        overflow: "hidden",
                    }}>
                        {userAvatar
                            ? <img src={userAvatar} alt={userName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : getInitial(userName)}
                    </div>
                </div>

            </div>
            {/* ── End World ── */}

            {/* ── HUD: Top bar ── */}
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0,
                padding: "14px 18px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "linear-gradient(to bottom, rgba(0,0,0,0.85) 60%, transparent)",
                zIndex: 200,
                pointerEvents: "none",
            }}>
                <button
                    onClick={() => router.push("/rooms")}
                    style={{
                        pointerEvents: "auto",
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 16px",
                        borderRadius: 100,
                        background: "rgba(0,0,0,0.6)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "rgba(255,255,255,0.75)",
                        fontSize: 13, fontWeight: 500,
                        cursor: "pointer",
                    }}
                >
                    <ArrowLeft size={14} /> Leave Space
                </button>

                <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "rgba(0,0,0,0.6)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 20,
                    padding: "7px 16px",
                    color: "rgba(255,255,255,0.55)",
                    fontSize: 13,
                }}>
                    <span style={{ fontFamily: "monospace", color: "#ffd063", fontWeight: 700, letterSpacing: 2 }}>{roomCode}</span>
                    <span style={{ opacity: 0.4 }}>|</span>
                    <span>{1 + others.length} online</span>
                </div>
            </div>

            {/* ── HUD: Zone enter prompt ── */}
            {activeZone && (
                <div style={{
                    position: "absolute",
                    bottom: 90,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 200,
                }}>
                    <button
                        onClick={() => handleEnterZone(activeZone)}
                        style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "13px 26px",
                            background: "rgba(0,0,0,0.9)",
                            border: `1.5px solid ${activeZone.border}`,
                            borderRadius: 50,
                            color: "white",
                            fontSize: 15, fontWeight: 600,
                            cursor: "pointer",
                            boxShadow: `0 0 24px ${activeZone.border}50`,
                            animation: "none",
                        }}
                    >
                        <span style={{ fontSize: 22 }}>{activeZone.icon}</span>
                        <span>Enter {activeZone.label}</span>
                        <kbd style={{
                            background: "rgba(255,255,255,0.12)",
                            padding: "2px 8px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontFamily: "monospace",
                            border: "1px solid rgba(255,255,255,0.2)",
                        }}>E</kbd>
                    </button>
                </div>
            )}

            {/* ── HUD: Bottom controls ── */}
            <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                padding: "16px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
                background: "linear-gradient(to top, rgba(0,0,0,0.85) 60%, transparent)",
                zIndex: 200,
            }}>
                <button
                    onClick={toggleMute}
                    title={isMuted ? "Unmute" : "Mute"}
                    style={{
                        width: 46, height: 46,
                        borderRadius: "50%",
                        background: isMuted ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)",
                        border: `1px solid ${isMuted ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.15)"}`,
                        color: isMuted ? "#ef4444" : "rgba(255,255,255,0.7)",
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                >
                    {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                <div style={{
                    color: "rgba(255,255,255,0.35)",
                    fontSize: 12,
                    padding: "8px 18px",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 20,
                    border: "1px solid rgba(255,255,255,0.07)",
                }}>
                    Move with <strong style={{ color: "rgba(255,255,255,0.55)" }}>WASD</strong> or <strong style={{ color: "rgba(255,255,255,0.55)" }}>Arrow Keys</strong>
                    &nbsp;&nbsp;·&nbsp;&nbsp;
                    Press <strong style={{ color: "rgba(255,255,255,0.55)" }}>E</strong> to enter a zone
                </div>
            </div>

            {/* ── Minimap ── */}
            <Minimap pos={pos} others={others} myColor={myColor} />

        </div>
    )
}
