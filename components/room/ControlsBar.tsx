"use client"

import { useState, useRef, useCallback } from "react"
import { useRoomStore, isHostSelector } from "@/store/useRoomStore"
import { useSession } from "next-auth/react"
import { connectSocket } from "@/lib/socket"
import { Link2, AlertCircle, Check, Upload, Film, Globe, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

type MediaTab = "youtube" | "direct" | "upload"

export function ControlsBar() {
    const { data: session } = useSession()
    const currentUserId = session?.user?.id
    const { roomCode, mediaUrl, mediaType } = useRoomStore()
    const isHost = useRoomStore((state) => isHostSelector(state, currentUserId))

    const { toast } = useToast()
    const [activeTab, setActiveTab] = useState<MediaTab>("youtube")
    const [urlInput, setUrlInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState<number | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    function handleSetMedia(e: React.FormEvent) {
        e.preventDefault()
        if (!urlInput.trim() || !roomCode) return

        if (activeTab === "youtube") {
            if (!urlInput.includes("youtube.com") && !urlInput.includes("youtu.be")) {
                toast({ title: "Invalid URL", description: "Please paste a valid YouTube link.", variant: "destructive" })
                return
            }
            emitMedia(urlInput, "youtube", "YouTube Video")
        } else {
            // Direct URL — accept anything
            emitMedia(urlInput, "direct", "Direct Video")
        }

        setUrlInput("")
        toast({ title: "Media updated", description: "Loading video for all participants..." })
    }

    function emitMedia(url: string, type: string, title: string) {
        useRoomStore.getState().setMedia(url, type as any, title)
        const socket = connectSocket()
        socket.emit("set-media", { roomCode, url, type, title })
    }

    const handleFileUpload = useCallback(async (file: File) => {
        if (!roomCode) return

        // Validate
        const maxSize = 2 * 1024 * 1024 * 1024 // 2GB
        if (file.size > maxSize) {
            toast({ title: "File too large", description: "Maximum file size is 2GB.", variant: "destructive" })
            return
        }

        const validExts = [".mp4", ".mkv", ".webm", ".mov", ".avi"]
        const ext = "." + file.name.split(".").pop()?.toLowerCase()
        if (!validExts.includes(ext)) {
            toast({ title: "Invalid file", description: `Supported formats: ${validExts.join(", ")}`, variant: "destructive" })
            return
        }

        // Play immediately for the host via a local blob URL (no upload wait)
        const blobUrl = URL.createObjectURL(file)
        useRoomStore.getState().setMedia(blobUrl, "upload", file.name)
        toast({ title: "Playing locally", description: `Uploading for others: ${file.name}` })

        setIsLoading(true)
        setUploadProgress(0)

        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("roomCode", roomCode)

            const xhr = new XMLHttpRequest()
            xhr.open("POST", "/api/upload")

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    setUploadProgress(Math.round((e.loaded / e.total) * 100))
                }
            }

            const result = await new Promise<{ url: string; filename: string }>((resolve, reject) => {
                xhr.onload = () => {
                    if (xhr.status === 200 || xhr.status === 201) {
                        resolve(JSON.parse(xhr.responseText))
                    } else {
                        try {
                            const err = JSON.parse(xhr.responseText)
                            reject(new Error(err.error || "Upload failed"))
                        } catch {
                            reject(new Error("Upload failed"))
                        }
                    }
                }
                xhr.onerror = () => reject(new Error("Upload failed"))
                xhr.send(formData)
            })

            // Switch host to server URL too, and broadcast to all participants
            useRoomStore.getState().setMedia(result.url, "upload", file.name)
            const socket = connectSocket()
            socket.emit("set-media", { roomCode, url: result.url, type: "upload", title: file.name })
            URL.revokeObjectURL(blobUrl)
            toast({ title: "Upload complete!", description: `Now sharing: ${file.name}` })
        } catch (err: any) {
            toast({ title: "Upload failed", description: err.message, variant: "destructive" })
            // Keep the blob URL playing locally even if upload fails
        } finally {
            setIsLoading(false)
            setUploadProgress(null)
        }
    }, [roomCode, toast])

    function handleDrop(e: React.DragEvent) {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFileUpload(file)
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) handleFileUpload(file)
    }

    function handleForceSync() {
        if (!roomCode || !isHost) return
        toast({ title: "Syncing...", description: "Forcing all participants to sync to your timestamp." })
    }

    const tabs: { id: MediaTab; label: string; icon: React.ReactNode }[] = [
        { id: "youtube", label: "YouTube", icon: <Film className="w-3.5 h-3.5" /> },
        { id: "direct", label: "Direct URL", icon: <Globe className="w-3.5 h-3.5" /> },
        { id: "upload", label: "Upload", icon: <Upload className="w-3.5 h-3.5" /> },
    ]

    const currentMediaLabel = mediaType === "youtube" ? "YouTube" : mediaType === "direct" ? "Direct Video" : mediaType === "upload" ? "Uploaded File" : null

    return (
        <div className="w-full bg-zinc-950 border-t border-zinc-800 p-4 shrink-0 z-20">
            <div className="flex items-center justify-between">
                {/* Left side: Sync Status */}
                <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                        <span className="text-sm font-medium text-zinc-300">Live Sync</span>
                    </div>
                    {!isHost && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800">
                            <AlertCircle className="w-4 h-4 text-[#00a6ff]" />
                            <span className="text-xs text-zinc-400">Host controls</span>
                        </div>
                    )}
                </div>

                {/* Center: Host Controls */}
                <div className="flex-1 max-w-2xl mx-4">
                    {isHost ? (
                        <div className="space-y-2">
                            {/* Tabs */}
                            <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-0.5 w-fit mx-auto">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === tab.id
                                            ? "bg-zinc-800 text-white shadow-sm"
                                            : "text-zinc-500 hover:text-zinc-300"
                                            }`}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab content */}
                            {activeTab === "upload" ? (
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${isDragging
                                        ? "border-[#ffd063] bg-[#ffd063]/5"
                                        : "border-zinc-700 hover:border-zinc-500 bg-zinc-900/50"
                                        }`}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".mp4,.mkv,.webm,.mov,.avi"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />

                                    {uploadProgress !== null ? (
                                        <div className="space-y-2">
                                            <Loader2 className="w-5 h-5 text-[#ffd063] animate-spin mx-auto" />
                                            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-[#ffd063] to-[#00a6ff] rounded-full transition-all duration-300"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-zinc-400">{uploadProgress}% uploaded</p>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5 text-zinc-500 mx-auto mb-1" />
                                            <p className="text-xs text-zinc-400">
                                                Drag & drop <span className="text-zinc-300">.mp4 .mkv .webm</span> or click to browse
                                            </p>
                                            <p className="text-[10px] text-zinc-600 mt-1">Max 2GB</p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <form onSubmit={handleSetMedia} className="flex w-full gap-2">
                                    <div className="relative flex-1">
                                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                        <Input
                                            value={urlInput}
                                            onChange={(e) => setUrlInput(e.target.value)}
                                            placeholder={
                                                activeTab === "youtube"
                                                    ? "Paste YouTube link..."
                                                    : "Paste any video URL (mp4, m3u8, etc.)..."
                                            }
                                            className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-[#ffd063]/50"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={isLoading || !urlInput.trim()}
                                        className="bg-zinc-800 text-white hover:bg-zinc-700 hover:text-white"
                                    >
                                        {isLoading ? "..." : "Load"}
                                    </Button>
                                </form>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center">
                            {mediaUrl ? (
                                <span className="text-sm font-semibold text-white bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
                                    Playing {currentMediaLabel || "Video"}
                                </span>
                            ) : (
                                <span className="text-sm text-zinc-500">Waiting for host to pick a video...</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Right side: Tools */}
                <div className="flex items-center gap-3 shrink-0">
                    {isHost && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleForceSync}
                            className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white gap-2"
                        >
                            <Check className="w-4 h-4" /> Force Sync
                        </Button>
                    )}
                    <div className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800">
                        <span className="text-xs font-medium text-zinc-400">1.0x</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
