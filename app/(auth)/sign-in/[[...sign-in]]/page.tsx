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

export default function SignInPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleCredentialSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
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
                    <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
                    <p className="text-sm text-zinc-400">Sign in to your RatCat account</p>
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
                        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                    >
                        <svg className="w-[18px] h-[18px] mr-3" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
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

                {/* Credentials Form */}
                <form onSubmit={handleCredentialSignIn} className="space-y-4">
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
                        {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                </form>

                {/* Footer */}
                <p className="mt-6 text-center text-sm text-zinc-500">
                    Don&apos;t have an account?{" "}
                    <Link href="/sign-up" className="text-[#ffd063] hover:text-[#ffda7a] transition-colors">
                        Sign up
                    </Link>
                </p>
            </motion.div>
        </div>
    )
}
