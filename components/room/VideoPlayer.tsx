"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import YouTube from "react-youtube"
import type { YouTubePlayer } from "react-youtube"
import { useRoomStore, isHostSelector } from "@/store/useRoomStore"
import { useSession } from "next-auth/react"
import { connectSocket } from "@/lib/socket"

// Target discrepancy limit (seconds) before forcing a seek
const MAX_DESYNC_SECONDS = 1.0

function extractYouTubeId(url: string | null) {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|user\/\S+|watch\?v=|&v=|\?v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
}

export function VideoPlayer() {
    const { data: session } = useSession()
    const currentUserId = session?.user?.id

    const {
        roomCode,
        mediaUrl,
        mediaType,
        isPlaying,
        currentTime,
        setPlaying,
        setCurrentTime,
    } = useRoomStore()

    const isHost = useRoomStore((state) => isHostSelector(state, currentUserId))

    // YouTube player
    const [ytPlayer, setYtPlayer] = useState<YouTubePlayer | null>(null)
    const videoId = mediaType === "youtube" ? extractYouTubeId(mediaUrl) : null

    // HTML5 video player
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const isDirectOrUpload = mediaType === "direct" || mediaType === "upload"

    // Refs to avoid dependency cycles
    const isSeekingRef = useRef(false)
    const lastEmitTimeRef = useRef(0)
    const playerRef = useRef<YouTubePlayer | null>(null)

    // 1. Listen for socket sync events (Participants + Host mirroring)
    useEffect(() => {
        const socket = connectSocket()

        const handlePlayState = (data: { isPlaying: boolean; currentTime: number }) => {
            if (isHost) return

            setPlaying(data.isPlaying)
            setCurrentTime(data.currentTime)

            if (isDirectOrUpload && videoRef.current) {
                const vid = videoRef.current
                if (data.isPlaying) {
                    vid.play().catch(() => { })
                } else {
                    vid.pause()
                }
                if (Math.abs(vid.currentTime - data.currentTime) > MAX_DESYNC_SECONDS) {
                    vid.currentTime = data.currentTime
                }
            } else if (playerRef.current) {
                if (data.isPlaying) {
                    playerRef.current.playVideo()
                } else {
                    playerRef.current.pauseVideo()
                }
                const pTime = playerRef.current.getCurrentTime()
                if (Math.abs(pTime - data.currentTime) > MAX_DESYNC_SECONDS) {
                    playerRef.current.seekTo(data.currentTime, true)
                }
            }
        }

        const handleTimeSync = (data: { currentTime: number; isPlaying: boolean; timestamp: number }) => {
            if (isHost) return

            const latency = (Date.now() - data.timestamp) / 1000
            const targetTime = data.isPlaying ? data.currentTime + latency : data.currentTime

            if (isDirectOrUpload && videoRef.current) {
                const vid = videoRef.current
                if (Math.abs(vid.currentTime - targetTime) > MAX_DESYNC_SECONDS) {
                    isSeekingRef.current = true
                    vid.currentTime = targetTime
                    setTimeout(() => { isSeekingRef.current = false }, 500)
                }
            } else if (playerRef.current) {
                const pTime = playerRef.current.getCurrentTime()
                if (Math.abs(pTime - targetTime) > MAX_DESYNC_SECONDS) {
                    isSeekingRef.current = true
                    playerRef.current.seekTo(targetTime, true)
                    setTimeout(() => { isSeekingRef.current = false }, 500)
                }
            }
        }

        const handleMediaChanged = (data: { url: string; type: string; title?: string }) => {
            useRoomStore.getState().setMedia(data.url, data.type as any, data.title || "Video")
        }

        socket.on("play-state-changed", handlePlayState)
        socket.on("time-sync", handleTimeSync)
        socket.on("media-changed", handleMediaChanged)

        return () => {
            socket.off("play-state-changed", handlePlayState)
            socket.off("time-sync", handleTimeSync)
            socket.off("media-changed", handleMediaChanged)
        }
    }, [isHost, isDirectOrUpload, setPlaying, setCurrentTime])

    // 2. Periodic host sync broadcast
    useEffect(() => {
        if (!isHost || !roomCode) return

        const interval = setInterval(() => {
            let time: number | undefined
            let playing: boolean | undefined

            if (isDirectOrUpload && videoRef.current) {
                time = videoRef.current.currentTime
                playing = !videoRef.current.paused
            } else if (ytPlayer) {
                try {
                    const state = ytPlayer.getPlayerState()
                    time = ytPlayer.getCurrentTime()
                    playing = state === 1
                } catch { return }
            }

            if (time !== undefined && playing !== undefined) {
                setCurrentTime(time)
                const now = Date.now()
                if (now - lastEmitTimeRef.current > 2000) {
                    const socket = connectSocket()
                    socket.emit("sync-time", {
                        roomCode,
                        currentTime: time,
                        isPlaying: playing
                    })
                    lastEmitTimeRef.current = now
                }
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [isHost, ytPlayer, roomCode, isDirectOrUpload, setCurrentTime])

    // 3. HTML5 video event handlers (host only)
    const handleVideoPlay = useCallback(() => {
        if (!isHost || isSeekingRef.current || !roomCode) return
        setPlaying(true)
        const socket = connectSocket()
        socket.emit("toggle-play", {
            roomCode,
            isPlaying: true,
            currentTime: videoRef.current?.currentTime || 0
        })
    }, [isHost, roomCode, setPlaying])

    const handleVideoPause = useCallback(() => {
        if (!isHost || isSeekingRef.current || !roomCode) return
        setPlaying(false)
        const socket = connectSocket()
        socket.emit("toggle-play", {
            roomCode,
            isPlaying: false,
            currentTime: videoRef.current?.currentTime || 0
        })
    }, [isHost, roomCode, setPlaying])

    const handleVideoSeeked = useCallback(() => {
        if (!isHost || !roomCode) return
        const socket = connectSocket()
        socket.emit("sync-time", {
            roomCode,
            currentTime: videoRef.current?.currentTime || 0,
            isPlaying: !videoRef.current?.paused
        })
    }, [isHost, roomCode])

    // Reload HTML5 video whenever the URL changes (required when using <source>)
    useEffect(() => {
        if (isDirectOrUpload && videoRef.current && mediaUrl) {
            videoRef.current.load()
            videoRef.current.play().catch(() => { })
        }
    }, [mediaUrl, isDirectOrUpload])

    // YouTube handlers
    const onReady = (e: { target: YouTubePlayer }) => {
        setYtPlayer(e.target)
        playerRef.current = e.target
    }

    const onStateChange = (e: { target: YouTubePlayer; data: number }) => {
        if (!isHost || isSeekingRef.current || !roomCode) return

        const socket = connectSocket()
        const state = e.data

        if (state === 1) {
            setPlaying(true)
            socket.emit("toggle-play", {
                roomCode,
                isPlaying: true,
                currentTime: e.target.getCurrentTime()
            })
        } else if (state === 2) {
            setPlaying(false)
            socket.emit("toggle-play", {
                roomCode,
                isPlaying: false,
                currentTime: e.target.getCurrentTime()
            })
        }
    }

    // No media selected
    if (!mediaUrl) {
        return (
            <div className="w-full aspect-video bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center flex-col p-6 animate-pulse">
                <div className="w-16 h-16 rounded-full bg-zinc-800 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Video Selected</h3>
                {isHost ? (
                    <p className="text-zinc-500 text-center">Paste a link or upload a file in the controls below to start watching.</p>
                ) : (
                    <p className="text-zinc-500">Waiting for host to pick a video...</p>
                )}
            </div>
        )
    }

    // YouTube player
    if (videoId && mediaType === "youtube") {
        return (
            <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-zinc-800/60 relative group">
                <YouTube
                    videoId={videoId}
                    onReady={onReady}
                    onStateChange={onStateChange}
                    opts={{
                        width: "100%",
                        height: "100%",
                        playerVars: {
                            autoplay: 1,
                            controls: isHost ? 1 : 0,
                            modestbranding: 1,
                            rel: 0,
                            disablekb: isHost ? 0 : 1,
                        },
                    }}
                    className="w-full h-full absolute inset-0"
                    iframeClassName="w-full h-full"
                />
                {!isHost && (
                    <div className="absolute inset-0 z-10 pointer-events-none" />
                )}
            </div>
        )
    }

        // Determine MIME type for better browser compatibility
    function getMimeType(url: string | null): string | undefined {
        if (!url) return undefined
        const lower = url.toLowerCase().split("?")[0]
        if (lower.endsWith(".mp4")) return "video/mp4"
        if (lower.endsWith(".webm")) return "video/webm"
        if (lower.endsWith(".ogg") || lower.endsWith(".ogv")) return "video/ogg"
        if (lower.endsWith(".mov")) return "video/mp4; codecs=avc1" // hint browser to try H.264
        if (lower.endsWith(".mkv")) return "video/x-matroska"
        if (lower.endsWith(".avi")) return "video/x-msvideo"
        // blob URLs are fine without explicit type
        return undefined
    }

    const mimeType = getMimeType(mediaUrl)

    // HTML5 video player (direct URL / uploaded file / blob URL)
    return (
        <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-zinc-800/60 relative group">
            <video
                ref={videoRef}
                controls={isHost}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
                onSeeked={handleVideoSeeked}
            >
                <source src={mediaUrl ?? undefined} type={mimeType} />
                Your browser does not support this video format.
            </video>
            {!isHost && (
                <div className="absolute inset-0 z-10" style={{ pointerEvents: "none" }} />
            )}
            {!isHost && (
                <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
                    <div className={`w-2 h-2 rounded-full ${isPlaying ? "bg-green-500 animate-pulse" : "bg-zinc-500"}`} />
                    <span className="text-xs text-white/80 font-medium">
                        {isPlaying ? "Playing" : "Paused"} · Host controls
                    </span>
                </div>
            )}
        </div>
    )
}
