"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { UserPlus, UserCheck, UserX, Clock, Loader2, Search, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

interface FriendUser {
    id: string
    name: string | null
    username: string | null
    image: string | null
    bio?: string | null
}

interface FriendRequest {
    id: string
    user: FriendUser
    createdAt: string
}

export default function FriendsPage() {
    const { toast } = useToast()
    const [friends, setFriends] = useState<FriendUser[]>([])
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
    const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
    const [searchUsername, setSearchUsername] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)

    useEffect(() => {
        fetchFriends()
    }, [])

    async function fetchFriends() {
        try {
            const res = await fetch("/api/friends")
            if (res.ok) {
                const data = await res.json()
                setFriends(data.friends)
                setPendingRequests(data.pendingRequests)
                setSentRequests(data.sentRequests)
            }
        } catch {
            toast({ title: "Error", description: "Failed to load friends", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    async function sendFriendRequest(e: React.FormEvent) {
        e.preventDefault()
        if (!searchUsername.trim()) return
        setIsSending(true)
        try {
            const res = await fetch("/api/friends", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: searchUsername.trim() }),
            })
            const data = await res.json()
            if (res.ok) {
                toast({ title: "Request sent! 🎉", description: `Friend request sent to @${searchUsername}` })
                setSearchUsername("")
                fetchFriends()
            } else {
                toast({ title: "Error", description: data.error, variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "Failed to send request", variant: "destructive" })
        } finally {
            setIsSending(false)
        }
    }

    async function handleRequest(id: string, action: "accept" | "reject") {
        try {
            const res = await fetch(`/api/friends/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            })
            if (res.ok) {
                toast({
                    title: action === "accept" ? "Friend added! 🎉" : "Request declined",
                    description: action === "accept" ? "You're now friends!" : "Friend request rejected.",
                })
                fetchFriends()
            }
        } catch {
            toast({ title: "Error", description: "Failed to process request", variant: "destructive" })
        }
    }

    async function removeFriend(id: string) {
        try {
            await fetch(`/api/friends/${id}`, { method: "DELETE" })
            toast({ title: "Removed", description: "Friend removed." })
            fetchFriends()
        } catch {
            toast({ title: "Error", description: "Failed to remove", variant: "destructive" })
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
        <div className="max-w-3xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Friends</h1>
                        <p className="text-zinc-400">Connect with other RatCat users</p>
                    </div>
                    <Badge variant="outline" className="text-[#ffd063] border-[#ffd063]/30">
                        <Users className="w-3 h-3 mr-1" />
                        {friends.length} friends
                    </Badge>
                </div>

                {/* Add Friend */}
                <Card className="bg-zinc-900 border-zinc-800 mb-6">
                    <CardHeader>
                        <CardTitle className="text-white text-lg flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-[#ffd063]" />
                            Add Friend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={sendFriendRequest} className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <Input
                                    value={searchUsername}
                                    onChange={(e) => setSearchUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                                    placeholder="Enter username"
                                    className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-[#ffd063]/50"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isSending || !searchUsername.trim()}
                                className="bg-gradient-to-r from-[#ffd063] to-[#ffda7a] text-black font-medium hover:brightness-110 border-0"
                            >
                                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Request"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs defaultValue="friends" className="w-full">
                    <TabsList className="bg-zinc-900 border border-zinc-800 w-full">
                        <TabsTrigger value="friends" className="flex-1 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400">
                            Friends ({friends.length})
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="flex-1 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400">
                            Pending ({pendingRequests.length})
                        </TabsTrigger>
                        <TabsTrigger value="sent" className="flex-1 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400">
                            Sent ({sentRequests.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Friends List */}
                    <TabsContent value="friends" className="mt-4 space-y-2">
                        {friends.length === 0 ? (
                            <Card className="bg-zinc-900 border-zinc-800">
                                <CardContent className="py-8 text-center">
                                    <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                                    <p className="text-zinc-500 text-sm">No friends yet. Add someone to get started!</p>
                                </CardContent>
                            </Card>
                        ) : (
                            friends.map((friend) => (
                                <Card key={friend.id} className="bg-zinc-900 border-zinc-800">
                                    <CardContent className="py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10 border border-zinc-700">
                                                <AvatarImage src={friend.image || undefined} />
                                                <AvatarFallback className="bg-zinc-800 text-white text-sm">
                                                    {friend.name?.charAt(0)?.toUpperCase() || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium text-white">{friend.name || "User"}</p>
                                                {friend.username && (
                                                    <p className="text-xs text-[#ffd063]">@{friend.username}</p>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-zinc-500 hover:text-red-400"
                                            onClick={() => removeFriend(friend.id)}
                                        >
                                            <UserX className="w-4 h-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    {/* Pending Requests */}
                    <TabsContent value="pending" className="mt-4 space-y-2">
                        {pendingRequests.length === 0 ? (
                            <Card className="bg-zinc-900 border-zinc-800">
                                <CardContent className="py-8 text-center">
                                    <Clock className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                                    <p className="text-zinc-500 text-sm">No pending requests</p>
                                </CardContent>
                            </Card>
                        ) : (
                            pendingRequests.map((req) => (
                                <Card key={req.id} className="bg-zinc-900 border-zinc-800">
                                    <CardContent className="py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10 border border-zinc-700">
                                                <AvatarImage src={req.user.image || undefined} />
                                                <AvatarFallback className="bg-zinc-800 text-white text-sm">
                                                    {req.user.name?.charAt(0)?.toUpperCase() || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium text-white">{req.user.name || "User"}</p>
                                                {req.user.username && (
                                                    <p className="text-xs text-zinc-400">@{req.user.username}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                className="bg-[#ffd063] text-black hover:brightness-110 border-0"
                                                onClick={() => handleRequest(req.id, "accept")}
                                            >
                                                <UserCheck className="w-4 h-4 mr-1" /> Accept
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-zinc-400 hover:text-red-400"
                                                onClick={() => handleRequest(req.id, "reject")}
                                            >
                                                <UserX className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    {/* Sent Requests */}
                    <TabsContent value="sent" className="mt-4 space-y-2">
                        {sentRequests.length === 0 ? (
                            <Card className="bg-zinc-900 border-zinc-800">
                                <CardContent className="py-8 text-center">
                                    <Clock className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                                    <p className="text-zinc-500 text-sm">No sent requests</p>
                                </CardContent>
                            </Card>
                        ) : (
                            sentRequests.map((req) => (
                                <Card key={req.id} className="bg-zinc-900 border-zinc-800">
                                    <CardContent className="py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10 border border-zinc-700">
                                                <AvatarImage src={req.user.image || undefined} />
                                                <AvatarFallback className="bg-zinc-800 text-white text-sm">
                                                    {req.user.name?.charAt(0)?.toUpperCase() || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium text-white">{req.user.name || "User"}</p>
                                                {req.user.username && (
                                                    <p className="text-xs text-zinc-400">@{req.user.username}</p>
                                                )}
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-zinc-400 border-zinc-700">
                                            <Clock className="w-3 h-3 mr-1" /> Pending
                                        </Badge>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </motion.div>
        </div>
    )
}
