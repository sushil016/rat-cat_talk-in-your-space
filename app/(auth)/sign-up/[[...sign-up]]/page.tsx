"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Github, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function SignUpPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [name, setName] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        // Register the user first
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        })

        if (!res.ok) {
            const data = await res.json()
            alert(data.error || "Registration failed")
            setIsLoading(false)
            return
        }

        // Then sign in with credentials
        await signIn("credentials", {
            email,
            password,
            callbackUrl: "/dashboard",
        })
        setIsLoading(false)
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md p-8 rounded-2xl bg-zinc-900 border border-zinc-800"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffd063] to-[#00a6ff] flex items-center justify-center">
                            <span className="text-black font-bold text-lg">🐱</span>
                        </div>
                    </Link>
                    <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
                    <p className="text-sm text-zinc-400">Join RatCat and start watching together</p>
                </div>

                {/* OAuth Providers */}
                <div className="space-y-3 mb-6">
                    <Button
                        variant="outline"
                        className="w-full h-12 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                        onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
                    >
                        <Github size={18} className="mr-3" />
                        Continue with GitHub
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full h-12 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                        onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
                    >
                        <MessageCircle size={18} className="mr-3 text-[#5865F2]" />
                        Continue with Discord
                    </Button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-6">
                    <Separator className="flex-1 bg-zinc-800" />
                    <span className="text-xs text-zinc-500 uppercase">or</span>
                    <Separator className="flex-1 bg-zinc-800" />
                </div>

                {/* Registration Form */}
                <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-zinc-300">Name</Label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            className="h-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-[#ffd063]/50"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-zinc-300">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="h-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-[#ffd063]/50"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-zinc-300">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="h-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-[#ffd063]/50"
                            required
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-gradient-to-r from-[#ffd063] to-[#ffda7a] text-black font-medium hover:brightness-110 border-0"
                    >
                        {isLoading ? "Creating account..." : "Create Account"}
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm text-zinc-500">
                    Already have an account?{" "}
                    <Link href="/sign-in" className="text-[#ffd063] hover:text-[#ffda7a] transition-colors">
                        Sign in
                    </Link>
                </p>
            </motion.div>
        </div>
    )
}
