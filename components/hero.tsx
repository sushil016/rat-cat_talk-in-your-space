"use client"

import { useEffect, useState } from "react"
import { ArrowRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { motion } from "framer-motion"

const words = ["code", "watch", "vibe", "explore"]

const floatingEmojis = ["🔥", "❤️", "😂", "🍿", "🎬", "👏", "😍", "🎉"]

const stats = [
    { value: "2D", label: "virtual spaces", tag: "WORLDS" },
    { value: "<50ms", label: "sync latency", tag: "REAL-TIME" },
    { value: "Proximity", label: "voice chat", tag: "VOICE" },
    { value: "Instant", label: "pair programming", tag: "CODING" },
]

function AnimatedSphere() {
    return (
        <div className="relative w-full h-full">
            {/* Core glow */}
            <div style={{
                position: "absolute",
                inset: "15%",
                borderRadius: "50%",
                background: "radial-gradient(circle at 40% 40%, rgba(255,208,99,0.18) 0%, rgba(0,166,255,0.12) 50%, transparent 75%)",
                filter: "blur(2px)",
            }} />
            {/* Outer ring 1 */}
            <div style={{
                position: "absolute",
                inset: "5%",
                borderRadius: "50%",
                border: "1px solid rgba(255,208,99,0.12)",
                animation: "spin-slow 20s linear infinite",
            }} />
            {/* Outer ring 2 */}
            <div style={{
                position: "absolute",
                inset: "18%",
                borderRadius: "50%",
                border: "1px solid rgba(0,166,255,0.10)",
                animation: "spin-slow 15s linear infinite reverse",
            }} />
            {/* Orbit dot yellow */}
            <div style={{
                position: "absolute",
                inset: "5%",
                borderRadius: "50%",
                animation: "spin-slow 20s linear infinite",
            }}>
                <div style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#ffd063",
                    boxShadow: "0 0 12px #ffd063",
                    transform: "translateY(-50%)",
                }} />
            </div>
            {/* Orbit dot blue */}
            <div style={{
                position: "absolute",
                inset: "18%",
                borderRadius: "50%",
                animation: "spin-slow 15s linear infinite reverse",
            }}>
                <div style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#00a6ff",
                    boxShadow: "0 0 10px #00a6ff",
                    transform: "translateX(-50%)",
                }} />
            </div>
            {/* Centre pulse */}
            <div style={{
                position: "absolute",
                inset: "38%",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,208,99,0.25) 0%, transparent 70%)",
                animation: "pulse-sphere 3s ease-in-out infinite",
            }} />
        </div>
    )
}

function FloatingEmojis() {
    const [emojis, setEmojis] = useState<Array<{ id: number; emoji: string; x: number; delay: number }>>([])

    useEffect(() => {
        let id = 0
        const interval = setInterval(() => {
            const emoji = floatingEmojis[Math.floor(Math.random() * floatingEmojis.length)]
            setEmojis(prev => {
                const updated = [...prev, { id: id++, emoji, x: Math.random() * 100, delay: Math.random() * 0.5 }]
                return updated.length > 12 ? updated.slice(-12) : updated
            })
        }, 900)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {emojis.map((item) => (
                <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 100, scale: 0.5 }}
                    animate={{ opacity: [0, 1, 1, 0], y: -320, scale: [0.5, 1, 1, 0.3] }}
                    transition={{ duration: 4, delay: item.delay, ease: "easeOut" }}
                    className="absolute text-2xl"
                    style={{ left: `${item.x}%`, bottom: "10%" }}
                    onAnimationComplete={() => setEmojis(prev => prev.filter(e => e.id !== item.id))}
                >
                    {item.emoji}
                </motion.div>
            ))}
        </div>
    )
}

export function Hero() {
    const { data: session } = useSession()
    const [isVisible, setIsVisible] = useState(false)
    const [wordIndex, setWordIndex] = useState(0)

    useEffect(() => { setIsVisible(true) }, [])

    useEffect(() => {
        const id = setInterval(() => setWordIndex(prev => (prev + 1) % words.length), 2500)
        return () => clearInterval(id)
    }, [])

    return (
        <section className="relative min-h-screen flex flex-col justify-center overflow-hidden" style={{ backgroundColor: "#0d0d0f" }}>
            {/* Animated sphere — right side */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] lg:w-[700px] lg:h-[700px] opacity-50 pointer-events-none">
                <AnimatedSphere />
            </div>

            {/* Subtle grid lines */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity: 0.25 }}>
                {[...Array(8)].map((_, i) => (
                    <div key={`h-${i}`} className="absolute h-px" style={{ background: "rgba(255,255,255,0.08)", top: `${12.5 * (i + 1)}%`, left: 0, right: 0 }} />
                ))}
                {[...Array(12)].map((_, i) => (
                    <div key={`v-${i}`} className="absolute w-px" style={{ background: "rgba(255,255,255,0.08)", left: `${8.33 * (i + 1)}%`, top: 0, bottom: 0 }} />
                ))}
            </div>

            {/* Floating Emojis */}
            <FloatingEmojis />

            <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 py-32 lg:py-40">
                {/* Eyebrow */}
                {/* <div className={`mb-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                    <span className="inline-flex items-center gap-3 text-sm font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
                        <span className="w-8 h-px inline-block" style={{ background: "rgba(255,208,99,0.5)" }} />
                        Your virtual space to hang out, build, and watch
                    </span>
                </div> */}

                {/* Main headline */}
                <div className="mb-12">
                    <h1 className={`font-display leading-[0.92] tracking-tight transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                        style={{ fontSize: "clamp(3rem,11vw,9rem)", color: "white" }}>
                        <span className="block">A space to</span>
                        <span className="block">
                            <span className="relative inline-block">
                                <span key={wordIndex} className="inline-flex" style={{ color: "#ffd063" }}>
                                    {words[wordIndex].split("").map((char, i) => (
                                        <span
                                            key={`${wordIndex}-${i}`}
                                            className="inline-block animate-char-in"
                                            style={{ animationDelay: `${i * 55}ms` }}
                                        >
                                            {char}
                                        </span>
                                    ))}
                                </span>
                                {/* Underline accent */}
                                <span className="absolute -bottom-2 left-0 right-0 h-2 rounded-full" style={{ background: "rgba(255,208,99,0.15)" }} />
                            </span>
                            <span style={{ color: "rgba(255,255,255,0.6)" }}> together.</span>
                        </span>
                    </h1>
                </div>

                {/* Description + CTAs two-column */}
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-end">
                    <p className={`text-xl lg:text-2xl leading-relaxed max-w-xl transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                        style={{ color: "rgba(255,255,255,0.45)" }}>
                        Walk up to people. Talk with proximity voice. Sync a YouTube video or pair program on a GitHub repo — all inside a 2D world you can actually move around in.
                    </p>

                    {/* CTAs */}
                    <div className={`flex flex-col sm:flex-row items-start gap-4 transition-all duration-700 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                        <Link href={session ? "/rooms/new" : "/sign-up"}>
                            <Button
                                size="lg"
                                className="shimmer-btn rounded-full px-8 h-14 text-base font-semibold border-0 group"
                                style={{ background: "#ffd063", color: "#000" }}
                            >
                                Create a Space
                                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </Link>
                        <Link href={session ? "/rooms" : "/sign-in"}>
                            <Button
                                size="lg"
                                className="h-14 px-8 text-base rounded-full font-medium"
                                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}
                            >
                                <Play className="w-4 h-4 mr-2" />
                                Browse Spaces
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats marquee — full width */}
            <div className={`absolute bottom-20 left-0 right-0 transition-all duration-700 delay-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
                <div className="flex gap-16 marquee whitespace-nowrap">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="flex gap-16">
                            {stats.map((stat) => (
                                <div key={`${stat.tag}-${i}`} className="flex items-baseline gap-4">
                                    <span className="font-display" style={{ fontSize: "clamp(2rem,4vw,3.5rem)", color: "white" }}>{stat.value}</span>
                                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                                        {stat.label}
                                        <span className="block font-mono text-xs mt-0.5" style={{ color: "rgba(255,208,99,0.5)", letterSpacing: "0.1em" }}>{stat.tag}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
