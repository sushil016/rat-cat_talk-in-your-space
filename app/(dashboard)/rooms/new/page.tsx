"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Sparkles, Lock, Users, Palette, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

const themes = [
    {
        id: "rat_den",
        name: "Rat Den",
        emoji: "🐀",
        description: "Dark & moody, underground vibes",
        gradient: "from-orange-500/20 to-amber-600/20",
        border: "border-orange-500/30",
        activeBorder: "border-orange-500",
    },
    {
        id: "cat_lounge",
        name: "Cat Lounge",
        emoji: "🐱",
        description: "Cozy & warm, chill atmosphere",
        gradient: "from-purple-500/20 to-pink-500/20",
        border: "border-purple-500/30",
        activeBorder: "border-purple-500",
    },
    {
        id: "neutral",
        name: "Neutral",
        emoji: "🎬",
        description: "Clean & minimal, cinema mode",
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
    const [theme, setTheme] = useState("neutral")
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
                    theme,
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
                <p className="text-zinc-400 mb-8">Set up your virtual gaming space</p>

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

                    {/* Theme */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white text-lg flex items-center gap-2">
                                <Palette className="w-5 h-5 text-purple-400" />
                                Room Theme
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {themes.map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setTheme(t.id)}
                                        className={`p-4 rounded-xl border-2 transition-all text-left bg-gradient-to-br ${t.gradient} ${theme === t.id ? t.activeBorder : t.border
                                            }`}
                                    >
                                        <span className="text-2xl block mb-2">{t.emoji}</span>
                                        <span className="text-sm font-semibold text-white block">{t.name}</span>
                                        <span className="text-xs text-zinc-400 block mt-1">{t.description}</span>
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
