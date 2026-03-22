"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { Save, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"

interface ProfileData {
    id: string
    name: string | null
    username: string | null
    email: string | null
    image: string | null
    bio: string | null
    isNewUser: boolean
    createdAt: string
}

export default function ProfilePage() {
    const { data: session, update: updateSession } = useSession()
    const { toast } = useToast()
    const [profile, setProfile] = useState<ProfileData | null>(null)
    const [name, setName] = useState("")
    const [username, setUsername] = useState("")
    const [bio, setBio] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        fetchProfile()
    }, [])

    async function fetchProfile() {
        try {
            const res = await fetch("/api/profile")
            if (res.ok) {
                const data = await res.json()
                setProfile(data)
                setName(data.name || "")
                setUsername(data.username || "")
                setBio(data.bio || "")
            }
        } catch {
            toast({ title: "Error", description: "Failed to load profile", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        setIsSaving(true)
        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, username, bio }),
            })

            if (res.ok) {
                const updated = await res.json()
                setProfile(updated)
                await updateSession({ username: updated.username, isNewUser: false })
                toast({ title: "Profile updated ✨", description: "Your changes have been saved." })
            } else {
                const err = await res.json()
                toast({ title: "Error", description: err.error, variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "Failed to save", variant: "destructive" })
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-[#ffd063] animate-spin" />
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
                <p className="text-zinc-400 mb-8">Manage your RatCat identity</p>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Avatar className="w-20 h-20 border-2 border-zinc-700">
                                <AvatarImage src={profile?.image || undefined} alt={profile?.name || "User"} />
                                <AvatarFallback className="bg-gradient-to-br from-[#ffd063] to-[#00a6ff] text-black text-2xl font-bold">
                                    {profile?.name?.charAt(0)?.toUpperCase() || <User className="w-8 h-8" />}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-white text-xl">{profile?.name || "User"}</CardTitle>
                                <CardDescription className="text-zinc-400">
                                    {profile?.email}
                                </CardDescription>
                                {profile?.username && (
                                    <span className="text-sm text-[#ffd063]">@{profile.username}</span>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-zinc-300">Display Name</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your name"
                                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-[#ffd063]/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-zinc-300">Username</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
                                        <Input
                                            id="username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                                            placeholder="username"
                                            className="pl-8 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-[#ffd063]/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio" className="text-zinc-300">Bio</Label>
                                <Textarea
                                    id="bio"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell others about yourself..."
                                    maxLength={200}
                                    rows={3}
                                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-[#ffd063]/50 resize-none"
                                />
                                <p className="text-xs text-zinc-500 text-right">{bio.length}/200</p>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-gradient-to-r from-[#ffd063] to-[#ffda7a] text-black font-medium hover:brightness-110 border-0"
                                >
                                    {isSaving ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                                    ) : (
                                        <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Account Info */}
                <Card className="bg-zinc-900 border-zinc-800 mt-6">
                    <CardHeader>
                        <CardTitle className="text-white text-lg">Account</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                            <span className="text-sm text-zinc-400">Email</span>
                            <span className="text-sm text-white">{profile?.email}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                            <span className="text-sm text-zinc-400">Joined</span>
                            <span className="text-sm text-white">
                                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                                    month: "long", day: "numeric", year: "numeric"
                                }) : "—"}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-zinc-400">Auth Provider</span>
                            <span className="text-sm text-white capitalize">
                                {session?.user ? "OAuth" : "Email"}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
