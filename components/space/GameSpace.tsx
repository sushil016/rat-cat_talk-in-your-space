"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Peer from "simple-peer"
import { connectSocket } from "@/lib/socket"

// World constants
const WORLD_W = 3200
const WORLD_H = 2200
const SPEED = 5
const PLAYER_SIZE = 40
const EMIT_MS = 80
const PROXIMITY_THRESHOLD = 180  // world-px radius
const SPEAKING_THRESHOLD = 15    // audio analyser avg for speaking indicator

const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    // TURN fallback — required for symmetric NAT in production
    { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
]

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

interface Zone {
    id: string
    label: string
    description: string
    x: number
    y: number
    w: number
    h: number
    bg: string
    border: string
    action: string
}

interface SpaceObject {
    id: string
    kind: "wall" | "desk" | "screen" | "table" | "seat" | "stage" | "board" | "terminal" | "plant" | "light"
    x: number
    y: number
    w: number
    h: number
    label?: string
    solid: boolean
    color?: string
    rotate?: number
}

interface ProximityPeer {
    peer: Peer.Instance
    socketId: string
    userId: string
    audioElement?: HTMLAudioElement
    analyser?: AnalyserNode
    audioCtx?: AudioContext
    remoteStream?: MediaStream
}

const CODING_ZONES: Zone[] = [
    {
        id: "standup",
        label: "Standup Atrium",
        description: "Gather, plan, and find collaborators",
        x: 120, y: 110, w: 920, h: 560,
        bg: "rgba(255,208,99,0.06)",
        border: "#ffd063",
        action: "stay",
    },
    {
        id: "pairing",
        label: "Pair Programming Pods",
        description: "Small desks for focused coding talk",
        x: 1130, y: 100, w: 1260, h: 760,
        bg: "rgba(0,166,255,0.06)",
        border: "#00a6ff",
        action: "stay",
    },
    {
        id: "review",
        label: "Review Theater",
        description: "Open demos, tutorials, or recorded sessions",
        x: 2480, y: 140, w: 580, h: 850,
        bg: "rgba(125,211,252,0.05)",
        border: "#7dd3fc",
        action: "watch",
    },
    {
        id: "algorithm",
        label: "Algorithm Lab",
        description: "DSA, LeetCode, and Codeforces workstations",
        x: 1050, y: 1100, w: 1080, h: 850,
        bg: "rgba(34,197,94,0.05)",
        border: "#22c55e",
        action: "stay",
    },
    {
        id: "quiet",
        label: "Quiet Debug Booths",
        description: "Lower traffic corners for deep work",
        x: 2300, y: 1220, w: 760, h: 760,
        bg: "rgba(148,163,184,0.05)",
        border: "#94a3b8",
        action: "stay",
    },
]

const CHILL_ZONES: Zone[] = [
    {
        id: "plaza",
        label: "Social Plaza",
        description: "Open space for arrivals and public conversation",
        x: 120, y: 110, w: 920, h: 620,
        bg: "rgba(255,208,99,0.06)",
        border: "#ffd063",
        action: "stay",
    },
    {
        id: "watch",
        label: "Watch Hall",
        description: "Movies, videos, and shared playback",
        x: 1130, y: 100, w: 1240, h: 780,
        bg: "rgba(0,166,255,0.06)",
        border: "#00a6ff",
        action: "watch",
    },
    {
        id: "game",
        label: "Game Lounge",
        description: "Group talk, game planning, and hangout pods",
        x: 2440, y: 140, w: 620, h: 900,
        bg: "rgba(168,85,247,0.06)",
        border: "#a855f7",
        action: "stay",
    },
    {
        id: "cafe",
        label: "Cafe Booths",
        description: "Small groups with nearby voice",
        x: 250, y: 1180, w: 780, h: 720,
        bg: "rgba(251,146,60,0.05)",
        border: "#fb923c",
        action: "stay",
    },
    {
        id: "terrace",
        label: "Quiet Terrace",
        description: "Low-noise corners for side conversations",
        x: 1320, y: 1130, w: 1420, h: 760,
        bg: "rgba(34,197,94,0.05)",
        border: "#22c55e",
        action: "stay",
    },
]

const SHARED_WALLS: SpaceObject[] = [
    { id: "north-wall", kind: "wall", x: 60, y: 60, w: 3080, h: 34, solid: true },
    { id: "south-wall", kind: "wall", x: 60, y: 2106, w: 3080, h: 34, solid: true },
    { id: "west-wall", kind: "wall", x: 60, y: 60, w: 34, h: 2080, solid: true },
    { id: "east-wall", kind: "wall", x: 3106, y: 60, w: 34, h: 2080, solid: true },
    { id: "left-divider", kind: "wall", x: 1070, y: 80, w: 28, h: 740, solid: true },
    { id: "top-hall", kind: "wall", x: 1180, y: 850, w: 840, h: 26, solid: true },
    { id: "right-divider", kind: "wall", x: 2410, y: 100, w: 28, h: 840, solid: true },
    { id: "right-hall", kind: "wall", x: 2440, y: 980, w: 520, h: 26, solid: true },
    { id: "lower-left", kind: "wall", x: 310, y: 1040, w: 700, h: 28, solid: true },
    { id: "lower-left-drop", kind: "wall", x: 310, y: 1040, w: 28, h: 570, solid: true },
    { id: "lower-left-return", kind: "wall", x: 338, y: 1584, w: 490, h: 28, solid: true },
    { id: "lower-left-leg", kind: "wall", x: 828, y: 1584, w: 28, h: 470, solid: true },
    { id: "center-drop", kind: "wall", x: 1250, y: 1040, w: 28, h: 610, solid: true },
    { id: "center-return", kind: "wall", x: 1278, y: 1624, w: 840, h: 28, solid: true },
    { id: "center-up", kind: "wall", x: 2050, y: 1020, w: 28, h: 625, solid: true },
    { id: "center-ledge", kind: "wall", x: 1460, y: 1010, w: 600, h: 26, solid: true },
    { id: "right-booth-left", kind: "wall", x: 2700, y: 1240, w: 28, h: 820, solid: true },
    { id: "right-booth-top", kind: "wall", x: 2700, y: 1240, w: 410, h: 28, solid: true },
]

const CODING_OBJECTS: SpaceObject[] = [
    ...SHARED_WALLS,
    { id: "standup-board", kind: "board", x: 270, y: 210, w: 500, h: 90, label: "SPRINT BOARD", solid: true, color: "#ffd063" },
    { id: "resource-board", kind: "terminal", x: 260, y: 420, w: 560, h: 150, label: "ROOM LINK", solid: true, color: "#00a6ff" },
    ...Array.from({ length: 10 }, (_, i) => ({
        id: `pair-desk-a-${i}`,
        kind: "desk" as const,
        x: 1220 + (i % 5) * 205,
        y: 210 + Math.floor(i / 5) * 270,
        w: 150,
        h: 86,
        label: i % 2 === 0 ? "PAIR" : "REVIEW",
        solid: true,
        color: "#00a6ff",
    })),
    ...Array.from({ length: 10 }, (_, i) => ({
        id: `algo-terminal-${i}`,
        kind: "terminal" as const,
        x: 1160 + (i % 5) * 175,
        y: 1240 + Math.floor(i / 5) * 250,
        w: 118,
        h: 92,
        label: i % 2 === 0 ? "DSA" : "CF",
        solid: true,
        color: "#22c55e",
    })),
    { id: "review-screen", kind: "screen", x: 2600, y: 260, w: 340, h: 160, label: "WATCH", solid: true, color: "#7dd3fc" },
    { id: "review-stage", kind: "stage", x: 2570, y: 520, w: 400, h: 200, label: "DEMO FLOOR", solid: true, color: "#7dd3fc" },
    { id: "debug-booth-1", kind: "desk", x: 2410, y: 1380, w: 220, h: 120, label: "DEBUG", solid: true, color: "#94a3b8" },
    { id: "debug-booth-2", kind: "desk", x: 2780, y: 1560, w: 220, h: 120, label: "QUIET", solid: true, color: "#94a3b8" },
    { id: "plant-a", kind: "plant", x: 910, y: 260, w: 70, h: 70, solid: false, color: "#22c55e" },
    { id: "plant-b", kind: "plant", x: 2180, y: 1760, w: 70, h: 70, solid: false, color: "#22c55e" },
]

const CHILL_OBJECTS: SpaceObject[] = [
    ...SHARED_WALLS,
    { id: "main-screen", kind: "screen", x: 1430, y: 220, w: 620, h: 180, label: "WATCH SCREEN", solid: true, color: "#00a6ff" },
    { id: "watch-stage", kind: "stage", x: 1330, y: 540, w: 820, h: 180, label: "WATCH FLOOR", solid: true, color: "#00a6ff" },
    ...Array.from({ length: 12 }, (_, i) => ({
        id: `sofa-${i}`,
        kind: "seat" as const,
        x: 1260 + (i % 4) * 230,
        y: 760 + Math.floor(i / 4) * 100,
        w: 150,
        h: 58,
        label: "",
        solid: true,
        color: "#ffd063",
    })),
    ...Array.from({ length: 8 }, (_, i) => ({
        id: `cafe-table-${i}`,
        kind: "table" as const,
        x: 390 + (i % 4) * 145,
        y: 1290 + Math.floor(i / 4) * 260,
        w: 92,
        h: 92,
        label: "CHAT",
        solid: true,
        color: "#fb923c",
    })),
    { id: "game-table-1", kind: "table", x: 2580, y: 310, w: 250, h: 150, label: "GAME TABLE", solid: true, color: "#a855f7" },
    { id: "game-table-2", kind: "table", x: 2580, y: 610, w: 250, h: 150, label: "LOUNGE", solid: true, color: "#a855f7" },
    { id: "terrace-seat-1", kind: "seat", x: 1430, y: 1290, w: 320, h: 74, label: "TERRACE", solid: true, color: "#22c55e" },
    { id: "terrace-seat-2", kind: "seat", x: 1870, y: 1480, w: 320, h: 74, label: "SIDE TALK", solid: true, color: "#22c55e" },
    { id: "terrace-seat-3", kind: "seat", x: 2280, y: 1690, w: 320, h: 74, label: "QUIET", solid: true, color: "#22c55e" },
    { id: "plaza-table", kind: "stage", x: 330, y: 320, w: 460, h: 190, label: "PUBLIC PLAZA", solid: true, color: "#ffd063" },
    { id: "plant-c", kind: "plant", x: 900, y: 550, w: 70, h: 70, solid: false, color: "#22c55e" },
    { id: "plant-d", kind: "plant", x: 2920, y: 1110, w: 70, h: 70, solid: false, color: "#22c55e" },
]

const ZONE_STATUS_OPTIONS: Record<string, string[]> = {
    // Coding zones
    standup:   ["Planning sprint", "Looking for a pair", "Reviewing PRs", "Stand-up ready", "Need help 🙋"],
    pairing:   ["Pair programming", "Code review", "Mob programming", "Teaching", "Learning"],
    review:    ["Presenting demo", "Watching review", "Giving feedback", "Just observing"],
    algorithm: ["LeetCode · Arrays", "LeetCode · DP", "LeetCode · Trees", "Codeforces · Graph", "System Design", "Binary Search"],
    quiet:     ["Deep focus 🎯", "Debugging", "Reading docs", "Refactoring", "Stuck 😅"],
    // Chill zones
    plaza:     ["Just arrived", "Looking to chat 👋", "Open mic", "AFK brb", "Taking a break"],
    watch:     ["Watching movie", "Picking next video", "Open to suggestions", "Hype 🔥"],
    game:      ["Playing games 🎮", "Looking for players", "Spectating", "GG EZ"],
    cafe:      ["Coffee chat ☕", "Casual talk", "Venting 😂", "Life updates"],
    terrace:   ["Quiet mode 🤫", "Vibing 🎵", "Thinking...", "Meditating 🧘"],
}

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

function getSpaceZones(isCodingRoom: boolean): Zone[] {
    return isCodingRoom ? CODING_ZONES : CHILL_ZONES
}

function getSpaceObjects(isCodingRoom: boolean): SpaceObject[] {
    return isCodingRoom ? CODING_OBJECTS : CHILL_OBJECTS
}

function checkObjectCollision(nx: number, ny: number, objects: SpaceObject[]): boolean {
    const half = PLAYER_SIZE / 2
    for (const f of objects) {
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

// ── Local video preview (self-camera in world space) ──
function LocalVideoInWorld({ stream, color }: { stream: MediaStream; color: string }) {
    const ref = useRef<HTMLVideoElement>(null)
    useEffect(() => {
        if (ref.current) ref.current.srcObject = stream
    }, [stream])
    return (
        <video
            ref={ref}
            autoPlay
            muted
            playsInline
            style={{
                position: "absolute",
                bottom: "calc(100% + 30px)",
                left: "50%",
                transform: "translateX(-50%)",
                width: 60,
                height: 60,
                borderRadius: "50%",
                objectFit: "cover",
                border: `2px solid ${color}`,
                boxShadow: `0 0 8px ${color}80`,
            }}
        />
    )
}

function Object3D({ item }: { item: SpaceObject }) {
    const color = item.color || "#94a3b8"
    const isWall = item.kind === "wall"
    const radius = isWall ? 8 : item.kind === "plant" || item.kind === "table" ? 999 : 14
    const height = isWall ? 18 : item.kind === "screen" || item.kind === "board" ? 28 : 20
    const topGradient = isWall
        ? "linear-gradient(180deg, #d8dde6, #aeb7c5)"
        : `linear-gradient(145deg, ${color}55, rgba(255,255,255,0.08) 48%, rgba(0,0,0,0.42))`
    const sideGradient = isWall
        ? "linear-gradient(180deg, #7b8494, #505866)"
        : `linear-gradient(180deg, ${color}44, rgba(0,0,0,0.55))`

    return (
        <div
            style={{
                position: "absolute",
                left: item.x,
                top: item.y,
                width: item.w,
                height: item.h,
                transform: item.rotate ? `rotate(${item.rotate}deg)` : undefined,
                transformOrigin: "center",
                pointerEvents: "none",
                zIndex: isWall ? 40 : 25,
            }}
        >
            <div style={{
                position: "absolute",
                inset: 0,
                borderRadius: radius,
                background: topGradient,
                border: isWall ? "1px solid rgba(255,255,255,0.7)" : `1px solid ${color}80`,
                boxShadow: isWall
                    ? "0 16px 26px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.9)"
                    : `0 18px 28px rgba(0,0,0,0.42), 0 0 18px ${color}18, inset 0 1px 0 rgba(255,255,255,0.22)`,
            }} />
            <div style={{
                position: "absolute",
                left: 8,
                right: 8,
                bottom: -height,
                height,
                borderRadius: `0 0 ${Math.min(radius, 14)}px ${Math.min(radius, 14)}px`,
                background: sideGradient,
                filter: "brightness(0.82)",
            }} />
            {!isWall && item.label && (
                <div style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#f8fafc",
                    fontSize: item.kind === "terminal" ? 13 : 12,
                    fontWeight: 800,
                    letterSpacing: 1.4,
                    textTransform: "uppercase",
                    textShadow: "0 1px 10px rgba(0,0,0,0.7)",
                    fontFamily: item.kind === "terminal" ? "monospace" : "inherit",
                }}>
                    {item.label}
                </div>
            )}
            {item.kind === "terminal" && (
                <div style={{
                    position: "absolute",
                    left: 16,
                    right: 16,
                    bottom: 12,
                    display: "grid",
                    gap: 4,
                }}>
                    {[0, 1, 2].map((line) => (
                        <div key={line} style={{
                            width: `${82 - line * 18}%`,
                            height: 3,
                            borderRadius: 4,
                            background: `${color}cc`,
                            opacity: 0.72,
                        }} />
                    ))}
                </div>
            )}
            {item.kind === "screen" && (
                <div style={{
                    position: "absolute",
                    inset: 14,
                    borderRadius: 10,
                    background: "linear-gradient(135deg, rgba(0,0,0,0.72), rgba(14,165,233,0.18))",
                    border: "1px solid rgba(255,255,255,0.18)",
                }} />
            )}
        </div>
    )
}

// ── Other player avatar ──
function OtherPlayer({
    player,
    isSpeaking,
    isNearby,
    remoteStream,
    hasCamera,
}: {
    player: SpacePlayer
    isSpeaking: boolean
    isNearby: boolean
    remoteStream?: MediaStream
    hasCamera: boolean
}) {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (videoRef.current && remoteStream) {
            videoRef.current.srcObject = remoteStream
        }
    }, [remoteStream])

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
            {/* Peer camera bubble */}
            {isNearby && hasCamera && remoteStream && (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{
                        position: "absolute",
                        bottom: "calc(100% + 30px)",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: `2px solid ${player.color}`,
                        boxShadow: `0 0 8px ${player.color}80`,
                    }}
                />
            )}

            {/* Status badge */}
            {player.status && (
                <div style={{
                    position: "absolute",
                    bottom: "calc(100% + 28px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    whiteSpace: "nowrap",
                    background: `${player.color}22`,
                    border: `1px solid ${player.color}55`,
                    color: player.color,
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 99,
                    backdropFilter: "blur(4px)",
                    maxWidth: 160,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}>
                    {player.status}
                </div>
            )}

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
                {player.isMuted && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }} />}
                {isNearby && !player.isMuted && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />}
                <div style={{
                    background: "rgba(0,0,0,0.85)",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 10,
                    border: `1px solid ${isNearby ? player.color + "80" : player.color + "30"}`,
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
                border: isSpeaking ? `3px solid #22c55e` : `2px solid ${player.color}`,
                boxShadow: isSpeaking
                    ? `0 0 16px rgba(34,197,94,0.7), 0 0 6px rgba(34,197,94,0.4)`
                    : isNearby
                        ? `0 0 12px ${player.color}60`
                        : `0 0 6px ${player.color}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
                color: "#000",
                overflow: "hidden",
                transition: "border 0.15s, box-shadow 0.15s",
            }}>
                {player.avatar
                    ? <img src={player.avatar} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : getInitial(player.name)}
            </div>
        </div>
    )
}

// ── Camera Corner Overlay ──
function CameraCorner({
    localStream,
    cameraOn,
    isMuted,
    localSpeaking,
    userName,
    myColor,
    peerStreams,
    peersWithCamera,
    nearbySocketIds,
    speakingPeers,
    others,
}: {
    localStream: MediaStream | null
    cameraOn: boolean
    isMuted: boolean
    localSpeaking: boolean
    userName: string
    myColor: string
    peerStreams: Map<string, MediaStream>
    peersWithCamera: Set<string>
    nearbySocketIds: Set<string>
    speakingPeers: Set<string>
    others: SpacePlayer[]
}) {
    const localVideoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (localVideoRef.current && localStream && cameraOn) {
            localVideoRef.current.srcObject = localStream
        }
    }, [localStream, cameraOn])

    const remoteTiles = Array.from(nearbySocketIds).filter(
        sid => peersWithCamera.has(sid) && peerStreams.has(sid)
    )

    const hasTiles = cameraOn || remoteTiles.length > 0
    if (!hasTiles) return null

    return (
        <div style={{
            position: "absolute",
            bottom: 76,
            right: 180,
            zIndex: 300,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            alignItems: "flex-end",
            maxHeight: "50vh",
            overflowY: "auto",
        }}>
            {/* Local camera tile */}
            {cameraOn && (
                <div style={{
                    position: "relative",
                    width: 144,
                    height: 100,
                    borderRadius: 10,
                    overflow: "hidden",
                    background: "#111",
                    border: `2px solid ${localSpeaking ? "#22c55e" : myColor + "60"}`,
                    boxShadow: localSpeaking ? "0 0 10px rgba(34,197,94,0.5)" : "0 2px 12px rgba(0,0,0,0.6)",
                    flexShrink: 0,
                    transition: "border 0.15s, box-shadow 0.15s",
                }}>
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
                    />
                    {/* Name + mic */}
                    <div style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: "4px 6px",
                        background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                    }}>
                        {isMuted && (
                            <span style={{ fontSize: 10, color: "#ef4444" }}>🎙️✗</span>
                        )}
                        <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "white",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                        }}>{userName} (you)</span>
                    </div>
                    {localSpeaking && (
                        <div style={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#22c55e",
                            boxShadow: "0 0 6px #22c55e",
                            animation: "pulse 1s ease-in-out infinite",
                        }} />
                    )}
                </div>
            )}

            {/* Remote camera tiles */}
            {remoteTiles.map(sid => (
                <RemoteCameraTile
                    key={sid}
                    socketId={sid}
                    stream={peerStreams.get(sid)!}
                    isSpeaking={speakingPeers.has(sid)}
                    player={others.find(p => p.socketId === sid)}
                />
            ))}
        </div>
    )
}

function RemoteCameraTile({
    socketId,
    stream,
    isSpeaking,
    player,
}: {
    socketId: string
    stream: MediaStream
    isSpeaking: boolean
    player?: SpacePlayer
}) {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream
        }
    }, [stream])

    const displayName = player?.name || "User"
    const color = player?.color || "#00a6ff"

    return (
        <div style={{
            position: "relative",
            width: 144,
            height: 100,
            borderRadius: 10,
            overflow: "hidden",
            background: "#111",
            border: `2px solid ${isSpeaking ? "#22c55e" : color + "60"}`,
            boxShadow: isSpeaking ? "0 0 10px rgba(34,197,94,0.5)" : "0 2px 12px rgba(0,0,0,0.6)",
            flexShrink: 0,
            transition: "border 0.15s, box-shadow 0.15s",
        }}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "4px 6px",
                background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                display: "flex",
                alignItems: "center",
                gap: 4,
            }}>
                {player?.isMuted && (
                    <span style={{ fontSize: 10, color: "#ef4444" }}>🎙️✗</span>
                )}
                <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "white",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                }}>{displayName}</span>
            </div>
            {isSpeaking && (
                <div style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#22c55e",
                    boxShadow: "0 0 6px #22c55e",
                }} />
            )}
        </div>
    )
}

// ── Minimap ──
function Minimap({
    pos,
    others,
    myColor,
    zones,
}: {
    pos: { x: number; y: number }
    others: SpacePlayer[]
    myColor: string
    zones: Zone[]
}) {
    const SCALE = 0.052
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
            {zones.map(z => (
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
    roomType,
    resourceUrl,
    userId,
    userName,
    userAvatar,
}: {
    roomCode: string
    roomId: string
    roomType?: string
    resourceUrl?: string
    userId: string
    userName: string
    userAvatar?: string
}) {
    const router = useRouter()

    // Movement / world refs
    const rafRef = useRef<number>(0)
    const keysRef = useRef(new Set<string>())
    const posRef = useRef({ x: 640, y: 700 })
    const lastEmitRef = useRef(0)
    const lastProxCheckRef = useRef(0)
    const activeZoneRef = useRef<Zone | null>(null)
    const isMutedRef = useRef(false)

    // Proximity voice refs
    const othersRef = useRef<SpacePlayer[]>([])
    const proximityPeersRef = useRef(new Map<string, ProximityPeer>())
    const inProximityRef = useRef(new Set<string>())
    const localStreamRef = useRef<MediaStream | null>(null)
    const speakingIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const localAnalyserRef = useRef<AnalyserNode | null>(null)

    // Zoom
    const zoomRef = useRef(1.0)

    // State
    const [pos, setPos] = useState({ x: 640, y: 700 })
    const [others, setOthers] = useState<SpacePlayer[]>([])
    const [activeZone, setActiveZone] = useState<Zone | null>(null)
    const [isMuted, setIsMuted] = useState(false)
    const [cameraOn, setCameraOn] = useState(false)
    const [hasVideoCapability, setHasVideoCapability] = useState(false)
    const [speakingPeers, setSpeakingPeers] = useState(new Set<string>())
    const [nearbySocketIds, setNearbySocketIds] = useState(new Set<string>())
    const [peerStreams, setPeerStreams] = useState(new Map<string, MediaStream>())
    const [peersWithCamera, setPeersWithCamera] = useState(new Set<string>())
    const [zoom, setZoom] = useState(1.0)
    const [localSpeaking, setLocalSpeaking] = useState(false)
    const [myStatus, setMyStatus] = useState("")
    const [statusInput, setStatusInput] = useState("")
    const [showCustomInput, setShowCustomInput] = useState(false)
    const [vp, setVp] = useState({
        w: typeof window !== "undefined" ? window.innerWidth : 1280,
        h: typeof window !== "undefined" ? window.innerHeight : 800,
    })

    const myColor = deriveColor(userId)
    const isCodingRoom = roomType === "coding"
    const zones = getSpaceZones(isCodingRoom)
    const spaceObjects = getSpaceObjects(isCodingRoom)
    const currentSpaceName = isCodingRoom ? "Coding Space" : "Chill Space"

    // Keep othersRef in sync for game loop
    useEffect(() => {
        othersRef.current = others
    }, [others])

    // ── Proximity peer helpers ──

    const destroyProximityPeer = useCallback((socketId: string) => {
        const conn = proximityPeersRef.current.get(socketId)
        if (!conn) return
        conn.peer.destroy()
        if (conn.audioElement) {
            conn.audioElement.pause()
            conn.audioElement.srcObject = null
        }
        if (conn.audioCtx) conn.audioCtx.close().catch(() => { })
        proximityPeersRef.current.delete(socketId)
        setPeerStreams(prev => { const n = new Map(prev); n.delete(socketId); return n })
        setPeersWithCamera(prev => { const n = new Set(prev); n.delete(socketId); return n })
    }, [])

    const createProximityPeer = useCallback((
        socketId: string,
        uid: string,
        stream: MediaStream,
        initiator: boolean,
    ) => {
        if (proximityPeersRef.current.has(socketId)) return

        const socket = connectSocket()
        const peer = new Peer({
            initiator,
            stream,
            trickle: true,
            config: { iceServers: ICE_SERVERS },
        })

        const peerEntry: ProximityPeer = { peer, socketId, userId: uid }
        proximityPeersRef.current.set(socketId, peerEntry)

        peer.on("signal", (signal) => {
            socket.emit("space-voice-signal", { roomCode, targetSocketId: socketId, signal })
        })

        peer.on("stream", (remoteStream) => {
            const conn = proximityPeersRef.current.get(socketId)
            if (!conn) return

            conn.remoteStream = remoteStream
            setPeerStreams(prev => new Map(prev).set(socketId, remoteStream))

            const audio = new Audio()
            audio.srcObject = remoteStream
            audio.autoplay = true
            conn.audioElement = audio

            // Update initial volume based on current distance
            const other = othersRef.current.find(p => p.socketId === socketId)
            if (other) {
                const dx = posRef.current.x - other.x
                const dy = posRef.current.y - other.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                audio.volume = Math.max(0, 1 - dist / PROXIMITY_THRESHOLD)
            }

            // Voice activity detection
            try {
                const audioCtx = new AudioContext()
                const source = audioCtx.createMediaStreamSource(remoteStream)
                const analyser = audioCtx.createAnalyser()
                analyser.fftSize = 512
                analyser.smoothingTimeConstant = 0.4
                source.connect(analyser)
                conn.analyser = analyser
                conn.audioCtx = audioCtx
            } catch { }
        })

        peer.on("error", () => destroyProximityPeer(socketId))
        peer.on("close", () => destroyProximityPeer(socketId))
    }, [roomCode, destroyProximityPeer])

    // Stable refs for game loop access
    const createProximityPeerRef = useRef(createProximityPeer)
    const destroyProximityPeerRef = useRef(destroyProximityPeer)
    useEffect(() => { createProximityPeerRef.current = createProximityPeer }, [createProximityPeer])
    useEffect(() => { destroyProximityPeerRef.current = destroyProximityPeer }, [destroyProximityPeer])

    // ── Speaking detection ──
    useEffect(() => {
        speakingIntervalRef.current = setInterval(() => {
            const speaking = new Set<string>()
            proximityPeersRef.current.forEach((conn, socketId) => {
                if (conn.analyser) {
                    const data = new Uint8Array(conn.analyser.frequencyBinCount)
                    conn.analyser.getByteFrequencyData(data)
                    const avg = data.reduce((a, b) => a + b, 0) / data.length
                    if (avg > SPEAKING_THRESHOLD) speaking.add(socketId)
                }
            })
            setSpeakingPeers(speaking)

            // Local speaking detection
            if (localAnalyserRef.current) {
                const data = new Uint8Array(localAnalyserRef.current.frequencyBinCount)
                localAnalyserRef.current.getByteFrequencyData(data)
                const avg = data.reduce((a, b) => a + b, 0) / data.length
                setLocalSpeaking(avg > SPEAKING_THRESHOLD)
            }
        }, 200)
        return () => { if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current) }
    }, [])

    // ── Viewport resize ──
    useEffect(() => {
        function resize() { setVp({ w: window.innerWidth, h: window.innerHeight }) }
        window.addEventListener("resize", resize)
        return () => window.removeEventListener("resize", resize)
    }, [])

    // ── Zoom via trackpad pinch or ctrl+scroll ──
    useEffect(() => {
        function onWheel(e: WheelEvent) {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault()
                const delta = e.deltaY > 0 ? -0.08 : 0.08
                setZoom(prev => {
                    const next = Math.max(0.35, Math.min(2.5, parseFloat((prev + delta).toFixed(2))))
                    zoomRef.current = next
                    return next
                })
            }
        }
        window.addEventListener("wheel", onWheel, { passive: false })
        return () => window.removeEventListener("wheel", onWheel)
    }, [])

    // ── Socket + voice setup ──
    useEffect(() => {
        const socket = connectSocket()

        // Space position events
        socket.emit("space-join", {
            roomCode, userId,
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

        // Request media: audio + video (video disabled by default)
        const initMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                    video: { width: 320, height: 240, facingMode: "user" },
                })
                stream.getVideoTracks().forEach(t => { t.enabled = false })
                localStreamRef.current = stream
                setHasVideoCapability(true)
                socket.emit("space-voice-join", { roomCode, userId, name: userName })
                // Wire up local analyser for speaking detection
                try {
                    const actx = new AudioContext()
                    const src = actx.createMediaStreamSource(stream)
                    const analyser = actx.createAnalyser()
                    analyser.fftSize = 512
                    analyser.smoothingTimeConstant = 0.4
                    src.connect(analyser)
                    localAnalyserRef.current = analyser
                } catch { }
            } catch {
                // Video denied — try audio only
                try {
                    const audioStream = await navigator.mediaDevices.getUserMedia({
                        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                    })
                    localStreamRef.current = audioStream
                    socket.emit("space-voice-join", { roomCode, userId, name: userName })
                    try {
                        const actx = new AudioContext()
                        const src = actx.createMediaStreamSource(audioStream)
                        const analyser = actx.createAnalyser()
                        analyser.fftSize = 512
                        analyser.smoothingTimeConstant = 0.4
                        src.connect(analyser)
                        localAnalyserRef.current = analyser
                    } catch { }
                } catch { /* no mic */ }
            }
        }
        initMedia()

        // Clear stale proximity voice listeners before re-registering
        socket.off("space-voice-peer-joined")
        socket.off("space-voice-signal")
        socket.off("space-voice-peer-left")
        socket.off("space-camera-state")

        // Proximity voice events
        socket.on("space-voice-peer-joined", (_data: { socketId: string; userId: string; name: string }) => {
            // No-op: proximity check in game loop handles actual connection
        })

        socket.on("space-voice-signal", (data: { fromSocketId: string; signal: any }) => {
            const conn = proximityPeersRef.current.get(data.fromSocketId)
            if (conn) {
                conn.peer.signal(data.signal)
            } else if (localStreamRef.current) {
                // They initiated — create non-initiator peer
                createProximityPeerRef.current(data.fromSocketId, "", localStreamRef.current, false)
                proximityPeersRef.current.get(data.fromSocketId)?.peer.signal(data.signal)
            }
        })

        socket.on("space-voice-peer-left", (data: { socketId: string }) => {
            destroyProximityPeerRef.current(data.socketId)
            inProximityRef.current.delete(data.socketId)
            setNearbySocketIds(prev => { const n = new Set(prev); n.delete(data.socketId); return n })
        })

        socket.on("space-camera-state", (data: { socketId: string; cameraOn: boolean }) => {
            setPeersWithCamera(prev => {
                const n = new Set(prev)
                if (data.cameraOn) n.add(data.socketId)
                else n.delete(data.socketId)
                return n
            })
        })

        return () => {
            socket.emit("space-leave", { roomCode, userId })
            socket.emit("space-voice-leave", { roomCode })
            socket.off("space-players")
            socket.off("space-player-moved")
            socket.off("space-player-left")
            socket.off("space-voice-peer-joined")
            socket.off("space-voice-signal")
            socket.off("space-voice-peer-left")
            socket.off("space-camera-state")

            // Cleanup all peer connections
            proximityPeersRef.current.forEach(conn => {
                conn.peer.destroy()
                if (conn.audioElement) { conn.audioElement.pause(); conn.audioElement.srcObject = null }
                if (conn.audioCtx) conn.audioCtx.close().catch(() => { })
            })
            proximityPeersRef.current.clear()

            localStreamRef.current?.getTracks().forEach(t => t.stop())
            localStreamRef.current = null
        }
    }, [roomCode, userId, userName, userAvatar, myColor])

    // ── Game loop ──
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

                if (!checkObjectCollision(nx, ny, spaceObjects)) {
                    x = nx; y = ny
                } else if (!checkObjectCollision(nx, y, spaceObjects)) {
                    x = nx
                } else if (!checkObjectCollision(x, ny, spaceObjects)) {
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

            // ── Proximity voice check (every 100ms) ──
            const ts = Date.now()
            if (ts - lastProxCheckRef.current > 100 && localStreamRef.current) {
                lastProxCheckRef.current = ts
                const { x: px, y: py } = posRef.current
                const nowInProximity = new Set<string>()

                for (const p of othersRef.current) {
                    const ddx = px - p.x
                    const ddy = py - p.y
                    const dist = Math.sqrt(ddx * ddx + ddy * ddy)

                    if (dist < PROXIMITY_THRESHOLD) {
                        nowInProximity.add(p.socketId)

                        // Deterministic initiator: lower userId string initiates
                        if (!proximityPeersRef.current.has(p.socketId) && userId < p.userId) {
                            createProximityPeerRef.current(p.socketId, p.userId, localStreamRef.current!, true)
                        }

                        // Scale volume with distance (1.0 at 0px, 0.0 at threshold)
                        const conn = proximityPeersRef.current.get(p.socketId)
                        if (conn?.audioElement) {
                            conn.audioElement.volume = Math.max(0, 1 - dist / PROXIMITY_THRESHOLD)
                        }
                    }
                }

                // Disconnect players who left proximity
                for (const sid of inProximityRef.current) {
                    if (!nowInProximity.has(sid)) {
                        destroyProximityPeerRef.current(sid)
                    }
                }

                inProximityRef.current = nowInProximity
                setNearbySocketIds(new Set(nowInProximity))
            }

            // Zone detection
            const inZone = zones.find(z => isInZone(x, y, z)) ?? null
            if (inZone?.id !== activeZoneRef.current?.id) {
                activeZoneRef.current = inZone
                setActiveZone(inZone)
            }

            rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(rafRef.current)
    }, [roomCode, userId, userName, userAvatar, myColor, zones, spaceObjects])

    // ── Key handlers ──
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase()
            keysRef.current.add(key)
            if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) e.preventDefault()
            if (key === "e" && activeZoneRef.current) handleEnterZone(activeZoneRef.current)
            // Zoom with keyboard
            if (key === "=" || key === "+") {
                e.preventDefault()
                setZoom(prev => { const n = Math.min(2.5, parseFloat((prev + 0.1).toFixed(2))); zoomRef.current = n; return n })
            }
            if (key === "-") {
                e.preventDefault()
                setZoom(prev => { const n = Math.max(0.35, parseFloat((prev - 0.1).toFixed(2))); zoomRef.current = n; return n })
            }
            if (key === "0") {
                e.preventDefault()
                setZoom(1.0); zoomRef.current = 1.0
            }
        }
        const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase())
        window.addEventListener("keydown", down)
        window.addEventListener("keyup", up)
        return () => {
            window.removeEventListener("keydown", down)
            window.removeEventListener("keyup", up)
        }
    }, [])

    function emitStatus(status: string, zoneId?: string) {
        const socket = connectSocket()
        socket.emit("space-set-status", { roomCode, userId, status, activeZoneId: zoneId })
        setMyStatus(status)
    }

    function handleEnterZone(zone: Zone) {
        if (zone.action === "watch") {
            router.push(`/rooms/${roomId}/watch`)
        } else if (zone.id === "pairing") {
            if (resourceUrl) {
                window.open(resourceUrl, "_blank", "noopener,noreferrer")
            } else {
                router.push(`/rooms/${roomId}/watch`)
            }
        } else {
            setActiveZone(null)
            activeZoneRef.current = null
        }
    }

    function handlePickStatus(chip: string) {
        const zone = activeZoneRef.current
        emitStatus(chip, zone?.id)
        setStatusInput("")
        setShowCustomInput(false)
    }

    function handleCustomStatus(e: React.FormEvent) {
        e.preventDefault()
        if (!statusInput.trim()) return
        const zone = activeZoneRef.current
        emitStatus(statusInput.trim(), zone?.id)
        setStatusInput("")
        setShowCustomInput(false)
    }

    function clearStatus() {
        emitStatus("", undefined)
    }

    function toggleMute() {
        const newMuted = !isMuted
        setIsMuted(newMuted)
        isMutedRef.current = newMuted
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !newMuted })
        }
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

    function toggleCamera() {
        if (!localStreamRef.current) return
        const videoTracks = localStreamRef.current.getVideoTracks()
        if (videoTracks.length === 0) return
        const newState = !cameraOn
        videoTracks.forEach(t => { t.enabled = newState })
        setCameraOn(newState)
        const socket = connectSocket()
        socket.emit("space-camera-state", { roomCode, cameraOn: newState })
    }

    // Camera transform — account for zoom level
    const visibleW = vp.w / zoom
    const visibleH = vp.h / zoom
    const camX = Math.max(0, Math.min(Math.max(0, WORLD_W - visibleW), pos.x - visibleW / 2))
    const camY = Math.max(0, Math.min(Math.max(0, WORLD_H - visibleH), pos.y - visibleH / 2))

    return (
        <div style={{ width: vp.w, height: vp.h, overflow: "hidden", position: "relative", background: "#06070a" }}>

            {/* ── World ── */}
            <div style={{
                position: "absolute",
                width: WORLD_W,
                height: WORLD_H,
                transformOrigin: "0 0",
                transform: `scale(${zoom}) translate(${-camX}px, ${-camY}px)`,
                backgroundImage: `
                    radial-gradient(circle at 18% 22%, ${isCodingRoom ? "rgba(0,166,255,0.12)" : "rgba(255,208,99,0.11)"}, transparent 26%),
                    radial-gradient(circle at 74% 72%, ${isCodingRoom ? "rgba(34,197,94,0.10)" : "rgba(168,85,247,0.10)"}, transparent 24%),
                    linear-gradient(rgba(255,255,255,0.026) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.026) 1px, transparent 1px)
                `,
                backgroundSize: "100% 100%, 100% 100%, 80px 80px, 80px 80px",
                backgroundColor: isCodingRoom ? "#071016" : "#100d13",
            }}>
                <div style={{
                    position: "absolute",
                    left: 60,
                    top: 60,
                    width: WORLD_W - 120,
                    height: WORLD_H - 120,
                    borderRadius: 72,
                    background: "linear-gradient(135deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))",
                    boxShadow: "inset 0 0 140px rgba(0,0,0,0.56)",
                    pointerEvents: "none",
                }} />

                {/* Zones */}
                {zones.map(zone => {
                    const isActive = activeZone?.id === zone.id
                    return (
                        <div key={zone.id} style={{
                            position: "absolute",
                            left: zone.x, top: zone.y,
                            width: zone.w, height: zone.h,
                            background: isActive ? zone.bg.replace("0.05", "0.1").replace("0.06", "0.12") : zone.bg,
                            border: `1px solid ${isActive ? zone.border : zone.border + "45"}`,
                            borderRadius: 30,
                            transition: "all 0.2s",
                            boxShadow: isActive ? `inset 0 0 90px ${zone.border}18, 0 0 34px ${zone.border}24` : "inset 0 0 40px rgba(0,0,0,0.18)",
                        }}>
                            <div style={{ position: "absolute", top: 20, left: 24 }}>
                                <div style={{ color: "#fff", fontWeight: 800, fontSize: 18, lineHeight: 1.2, letterSpacing: 0.3 }}>{zone.label}</div>
                                <div style={{ color: "rgba(255,255,255,0.48)", fontSize: 12, marginTop: 4 }}>{zone.description}</div>
                            </div>
                            <div style={{
                                position: "absolute",
                                inset: 22,
                                borderRadius: 22,
                                border: `1px dashed ${zone.border}32`,
                                pointerEvents: "none",
                            }} />
                        </div>
                    )
                })}

                <div style={{
                    position: "absolute",
                    left: 1420,
                    top: 925,
                    width: 280,
                    height: 90,
                    borderRadius: 999,
                    background: "rgba(0,0,0,0.35)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255,255,255,0.45)",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    pointerEvents: "none",
                }}>
                    Nearby voice area
                </div>

                {/* Room objects */}
                {spaceObjects.map((item) => (
                    <Object3D key={item.id} item={item} />
                ))}

                {resourceUrl && isCodingRoom && (
                    <div style={{
                        position: "absolute",
                        left: 300,
                        top: 465,
                        width: 480,
                        height: 40,
                        borderRadius: 10,
                        background: "rgba(0,0,0,0.4)",
                        border: "1px solid rgba(0,166,255,0.25)",
                        color: "#7dd3fc",
                        fontSize: 13,
                        fontFamily: "monospace",
                        display: "flex",
                        alignItems: "center",
                        padding: "0 14px",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        pointerEvents: "none",
                        zIndex: 35,
                    }}>
                        {resourceUrl}
                    </div>
                )}

                {!isCodingRoom && (
                    <div style={{
                        position: "absolute",
                        left: 1460,
                        top: 268,
                        width: 560,
                        height: 118,
                        borderRadius: 14,
                        background: "linear-gradient(135deg, rgba(0,166,255,0.22), rgba(255,208,99,0.12))",
                        border: "1px solid rgba(255,255,255,0.16)",
                        boxShadow: "0 0 30px rgba(0,166,255,0.18)",
                        zIndex: 36,
                        pointerEvents: "none",
                    }}>
                        <div style={{
                            position: "absolute",
                            inset: 18,
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 12,
                        }}>
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} style={{
                                    borderRadius: 10,
                                    background: i % 2 === 0 ? "rgba(255,208,99,0.26)" : "rgba(0,166,255,0.24)",
                                }} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Other players */}
                {others.map(p => (
                    <OtherPlayer
                        key={p.userId}
                        player={p}
                        isSpeaking={speakingPeers.has(p.socketId)}
                        isNearby={nearbySocketIds.has(p.socketId)}
                        remoteStream={peerStreams.get(p.socketId)}
                        hasCamera={peersWithCamera.has(p.socketId)}
                    />
                ))}

                {/* Proximity hearing ring */}
                <div style={{
                    position: "absolute",
                    left: pos.x - PROXIMITY_THRESHOLD,
                    top: pos.y - PROXIMITY_THRESHOLD,
                    width: PROXIMITY_THRESHOLD * 2,
                    height: PROXIMITY_THRESHOLD * 2,
                    borderRadius: "50%",
                    border: nearbySocketIds.size > 0
                        ? "1px dashed rgba(34,197,94,0.25)"
                        : "1px dashed rgba(255,255,255,0.08)",
                    pointerEvents: "none",
                    zIndex: 5,
                    transition: "border-color 0.3s",
                }} />

                {/* Local player */}
                <div style={{
                    position: "absolute",
                    left: pos.x - PLAYER_SIZE / 2,
                    top: pos.y - PLAYER_SIZE / 2,
                    width: PLAYER_SIZE,
                    height: PLAYER_SIZE,
                    zIndex: 20,
                }}>
                    {/* Self camera preview in world */}
                    {cameraOn && localStreamRef.current && (
                        <LocalVideoInWorld stream={localStreamRef.current} color={myColor} />
                    )}

                    {/* My status badge */}
                    {myStatus && (
                        <div style={{
                            position: "absolute",
                            bottom: "calc(100% + 28px)",
                            left: "50%",
                            transform: "translateX(-50%)",
                            whiteSpace: "nowrap",
                            background: `${myColor}22`,
                            border: `1px solid ${myColor}66`,
                            color: myColor,
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 99,
                            cursor: "pointer",
                            maxWidth: 160,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                            onClick={clearStatus}
                            title="Click to clear status"
                        >
                            {myStatus} ×
                        </div>
                    )}

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
                        {isMuted && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }} />}
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
                    Leave Space
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
                    <span style={{ color: isCodingRoom ? "#00a6ff" : "#ffd063" }}>{currentSpaceName}</span>
                    <span style={{ opacity: 0.4 }}>|</span>
                    <span>{1 + others.length} online</span>
                    {nearbySocketIds.size > 0 && (
                        <>
                            <span style={{ opacity: 0.4 }}>|</span>
                            <span style={{ color: "#22c55e", fontSize: 12 }}>
                                {nearbySocketIds.size} nearby
                            </span>
                        </>
                    )}
                </div>

                {resourceUrl && (
                    <a
                        href={resourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            pointerEvents: "auto",
                            maxWidth: 300,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            padding: "7px 16px",
                            borderRadius: 100,
                            background: "rgba(0,166,255,0.12)",
                            border: "1px solid rgba(0,166,255,0.35)",
                            color: "#7dd3fc",
                            fontSize: 13,
                            fontWeight: 600,
                            textDecoration: "none",
                        }}
                    >
                        Open coding link
                    </a>
                )}
            </div>

            {/* ── HUD: Zone enter prompt + Status Picker ── */}
            {activeZone && (
                <div style={{
                    position: "absolute",
                    bottom: 90,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 200,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    maxWidth: "min(680px, 90vw)",
                    width: "100%",
                }}>
                    {/* Status chips card */}
                    {ZONE_STATUS_OPTIONS[activeZone.id] && (
                        <div style={{
                            width: "100%",
                            background: "rgba(0,0,0,0.88)",
                            border: `1px solid ${activeZone.border}40`,
                            borderRadius: 18,
                            padding: "14px 18px",
                            boxShadow: `0 0 32px ${activeZone.border}20`,
                            backdropFilter: "blur(12px)",
                        }}>
                            <div style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: activeZone.border,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                marginBottom: 10,
                            }}>
                                What are you up to?
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: showCustomInput ? 10 : 0 }}>
                                {ZONE_STATUS_OPTIONS[activeZone.id].map((chip) => (
                                    <button
                                        key={chip}
                                        onClick={() => handlePickStatus(chip)}
                                        style={{
                                            padding: "5px 12px",
                                            borderRadius: 99,
                                            background: myStatus === chip ? `${activeZone.border}30` : "rgba(255,255,255,0.06)",
                                            border: `1px solid ${myStatus === chip ? activeZone.border : "rgba(255,255,255,0.12)"}`,
                                            color: myStatus === chip ? activeZone.border : "rgba(255,255,255,0.75)",
                                            fontSize: 12,
                                            fontWeight: myStatus === chip ? 700 : 500,
                                            cursor: "pointer",
                                            transition: "all 0.15s",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {chip}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setShowCustomInput(v => !v)}
                                    style={{
                                        padding: "5px 12px",
                                        borderRadius: 99,
                                        background: "rgba(255,255,255,0.04)",
                                        border: "1px dashed rgba(255,255,255,0.2)",
                                        color: "rgba(255,255,255,0.45)",
                                        fontSize: 12,
                                        cursor: "pointer",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    Custom...
                                </button>
                                {myStatus && (
                                    <button
                                        onClick={clearStatus}
                                        style={{
                                            padding: "5px 10px",
                                            borderRadius: 99,
                                            background: "rgba(239,68,68,0.1)",
                                            border: "1px solid rgba(239,68,68,0.25)",
                                            color: "#ef4444",
                                            fontSize: 12,
                                            cursor: "pointer",
                                        }}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            {showCustomInput && (
                                <form onSubmit={handleCustomStatus} style={{ display: "flex", gap: 6, marginTop: 8 }}>
                                    <input
                                        autoFocus
                                        value={statusInput}
                                        onChange={e => setStatusInput(e.target.value)}
                                        placeholder="Type your status..."
                                        maxLength={48}
                                        style={{
                                            flex: 1,
                                            background: "rgba(255,255,255,0.06)",
                                            border: `1px solid ${activeZone.border}50`,
                                            borderRadius: 10,
                                            padding: "6px 12px",
                                            color: "white",
                                            fontSize: 13,
                                            outline: "none",
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        style={{
                                            padding: "6px 16px",
                                            borderRadius: 10,
                                            background: `${activeZone.border}30`,
                                            border: `1px solid ${activeZone.border}`,
                                            color: activeZone.border,
                                            fontSize: 12,
                                            fontWeight: 700,
                                            cursor: "pointer",
                                        }}
                                    >
                                        Set
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Enter zone button */}
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
                        }}
                    >
                        <span>{activeZone.action === "watch" ? "Enter" : "Use"} {activeZone.label}</span>
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
                {/* Mute */}
                <button
                    onClick={toggleMute}
                    title={isMuted ? "Unmute" : "Mute"}
                    style={{
                        width: 78, height: 42,
                        borderRadius: 999,
                        background: isMuted ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)",
                        border: `1px solid ${isMuted ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.15)"}`,
                        color: isMuted ? "#ef4444" : "rgba(255,255,255,0.7)",
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                >
                    <span style={{ fontSize: 11, fontWeight: 800 }}>{isMuted ? "MIC OFF" : "MIC"}</span>
                </button>

                {/* Camera (only shown if video capability available) */}
                {hasVideoCapability && (
                    <button
                        onClick={toggleCamera}
                        title={cameraOn ? "Turn off camera" : "Turn on camera"}
                        style={{
                            width: 82, height: 42,
                            borderRadius: 999,
                            background: cameraOn ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)",
                            border: `1px solid ${cameraOn ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.15)"}`,
                            color: cameraOn ? "#22c55e" : "rgba(255,255,255,0.7)",
                            cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                    >
                        <span style={{ fontSize: 11, fontWeight: 800 }}>{cameraOn ? "CAM" : "CAM OFF"}</span>
                    </button>
                )}

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
                    &nbsp;&nbsp;·&nbsp;&nbsp;
                    <strong style={{ color: "rgba(255,255,255,0.35)" }}>Voice activates when nearby</strong>
                    &nbsp;&nbsp;·&nbsp;&nbsp;
                    Zoom <strong style={{ color: "rgba(255,255,255,0.55)" }}>+/-</strong> or pinch
                </div>

                {/* Zoom controls */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                        onClick={() => setZoom(prev => { const n = Math.max(0.35, parseFloat((prev - 0.1).toFixed(2))); zoomRef.current = n; return n })}
                        style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            color: "rgba(255,255,255,0.7)",
                            cursor: "pointer", fontSize: 16, lineHeight: 1,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                    >−</button>
                    <span style={{
                        fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)",
                        minWidth: 36, textAlign: "center", fontFamily: "monospace",
                    }}>{Math.round(zoom * 100)}%</span>
                    <button
                        onClick={() => setZoom(prev => { const n = Math.min(2.5, parseFloat((prev + 0.1).toFixed(2))); zoomRef.current = n; return n })}
                        style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            color: "rgba(255,255,255,0.7)",
                            cursor: "pointer", fontSize: 16, lineHeight: 1,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                    >+</button>
                </div>
            </div>

            {/* ── Camera Corner Overlay ── */}
            <CameraCorner
                localStream={localStreamRef.current}
                cameraOn={cameraOn}
                isMuted={isMuted}
                localSpeaking={localSpeaking && !isMuted}
                userName={userName}
                myColor={myColor}
                peerStreams={peerStreams}
                peersWithCamera={peersWithCamera}
                nearbySocketIds={nearbySocketIds}
                speakingPeers={speakingPeers}
                others={others}
            />

            {/* ── Minimap ── */}
            <Minimap pos={pos} others={others} myColor={myColor} zones={zones} />

        </div>
    )
}
