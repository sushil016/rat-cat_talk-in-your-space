"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Sparkles, Lock, Users, ArrowRight, Loader2, Code2, Clapperboard, Globe2, LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"

const roomTypes = [
    {
        id: "coding",
        name: "Coding",
        icon: Code2,
        description: "Web-dev, DSA, GitHub, LeetCode, or Codeforces rooms",
        gradient: "from-[#00a6ff]/20 to-cyan-500/10",
        border: "border-[#00a6ff]/30",
        activeBorder: "border-[#00a6ff]",
    },
    {
        id: "chill",
        name: "Chill",
        icon: Clapperboard,
        description: "Gaming chill rooms, movie chill rooms, and casual hangouts",
        gradient: "from-[#ffd063]/20 to-[#00a6ff]/20",
        border: "border-[#ffd063]/30",
        activeBorder: "border-[#ffd063]",
    },
]

const maxParticipantOptions = [10, 25, 50]

export default function CreateRoomPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [name, setName] = useState("")
    const [password, setPassword] = useState("")
    const [maxParticipants, setMaxParticipants] = useState(10)
    const [roomType, setRoomType] = useState<"coding" | "chill">("chill")
    const [resourceUrl, setResourceUrl] = useState("")
    const [isPublic, setIsPublic] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) return

        setIsLoading(true)
        try {
            const res = await fetch("/api/rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    password: password || null,
                    maxParticipants,
                    roomType,
                    resourceUrl: resourceUrl.trim() || null,
                    isPublic,
                }),
            })

            if (res.ok) {
                const room = await res.json()
                toast({
                    title: "Space created!",
                    description: `Code: ${room.code} — share it with friends`,
                })
                router.push(`/rooms/${room.code}/space`)
            } else {
                const err = await res.json()
                toast({ title: "Error", description: err.error, variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "Failed to create room", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl font-bold text-white mb-2">Create Space</h1>
                <p className="text-zinc-400 mb-8">Choose a coding or chill room, then invite people into a shared 3D space.</p>

                <form onSubmit={handleCreate} className="space-y-8">
                    {/* Room Name */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white text-lg flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-[#ffd063]" />
                                Room Details
                            </CardTitle>
                            <CardDescription className="text-zinc-400">
                                Give your space a name
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-zinc-300">Room Name *</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Friday Night Hangout"
                                    maxLength={60}
                                    className="h-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-[#ffd063]/50"
                                    required
                                />
                            </div>
                            <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-800/40 p-4">
                                <div className="flex items-start gap-3">
                                    <Globe2 className="mt-0.5 h-5 w-5 text-[#00a6ff]" />
                                    <div>
                                        <Label htmlFor="isPublic" className="text-zinc-200">Public space</Label>
                                        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                                            Public spaces appear for logged-in users and in Recent Public Rooms on the landing page.
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    id="isPublic"
                                    checked={isPublic}
                                    onCheckedChange={setIsPublic}
                                    className="data-[state=checked]:bg-[#00a6ff]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-zinc-300 flex items-center gap-2">
                                    <Lock className="w-3.5 h-3.5" />
                                    Password (optional)
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Leave empty for open access"
                                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-[#ffd063]/50"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Space Type */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white text-lg flex items-center gap-2">
                                <Code2 className="w-5 h-5 text-[#00a6ff]" />
                                Space Type
                            </CardTitle>
                            <CardDescription className="text-zinc-400">
                                Coding and chill spaces both open into the shared character map.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {roomTypes.map((type) => {
                                    const Icon = type.icon
                                    return (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setRoomType(type.id as "coding" | "chill")}
                                            className={`p-4 rounded-xl border-2 transition-all text-left bg-gradient-to-br ${type.gradient} ${roomType === type.id ? type.activeBorder : type.border
                                                }`}
                                        >
                                            <Icon className="mb-3 h-6 w-6 text-white" />
                                            <span className="text-sm font-semibold text-white block">{type.name}</span>
                                            <span className="text-xs text-zinc-400 block mt-1 leading-relaxed">{type.description}</span>
                                        </button>
                                    )
                                })}
                            </div>

                            {roomType === "coding" && (
                                <div className="space-y-2">
                                    <Label htmlFor="resourceUrl" className="text-zinc-300 flex items-center gap-2">
                                        <LinkIcon className="w-3.5 h-3.5" />
                                        Coding link (optional)
                                    </Label>
                                    <Input
                                        id="resourceUrl"
                                        value={resourceUrl}
                                        onChange={(e) => setResourceUrl(e.target.value)}
                                        placeholder="https://github.com/org/repo or https://leetcode.com/problems/..."
                                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-[#00a6ff]/50"
                                    />
                                    <p className="text-xs text-zinc-500">
                                        Supports GitHub, LeetCode, and Codeforces links for coding together.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Max Participants */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white text-lg flex items-center gap-2">
                                <Users className="w-5 h-5 text-[#00a6ff]" />
                                Max Participants
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-3">
                                {maxParticipantOptions.map((opt) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setMaxParticipants(opt)}
                                        className={`p-4 rounded-xl border-2 transition-all text-center ${maxParticipants === opt
                                                ? "border-[#00a6ff] bg-[#00a6ff]/10 text-white"
                                                : "border-zinc-800 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
                                            }`}
                                    >
                                        <span className="text-2xl font-bold block">{opt}</span>
                                        <span className="text-xs mt-1 block">
                                            {opt === 10 ? "Small" : opt === 25 ? "Medium" : "Large"}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <Button
                        type="submit"
                        disabled={isLoading || !name.trim()}
                        className="w-full h-14 text-lg bg-gradient-to-r from-[#ffd063] to-[#ffda7a] text-black font-semibold hover:brightness-110 border-0 rounded-xl"
                    >
                        {isLoading ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating...</>
                        ) : (
                            <>Create Space <ArrowRight className="w-5 h-5 ml-2" /></>
                        )}
                    </Button>
                </form>
            </motion.div>
        </div>
    )
}
