"use client"

import { motion } from "framer-motion"
import { ArrowRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

const avatars = [
  "/professional-headshot-1.png",
  "/professional-headshot-2.png",
  "/professional-headshot-3.png",
  "/professional-headshot-4.png",
  "/professional-headshot-5.png",
]

const floatingEmojis = ["🔥", "❤️", "😂", "🍿", "🎬", "👏", "😍", "🎉"]

const textRevealVariants = {
  hidden: { y: "100%" },
  visible: (i: number) => ({
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      delay: i * 0.1,
    },
  }),
}

function FloatingEmojis() {
  const [emojis, setEmojis] = useState<Array<{ id: number; emoji: string; x: number; delay: number }>>([])

  useEffect(() => {
    let id = 0
    const interval = setInterval(() => {
      const emoji = floatingEmojis[Math.floor(Math.random() * floatingEmojis.length)]
      const x = Math.random() * 100
      const delay = Math.random() * 0.5
      setEmojis((prev) => {
        const updated = [...prev, { id: id++, emoji, x, delay }]
        if (updated.length > 12) return updated.slice(-12)
        return updated
      })
    }, 800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {emojis.map((item) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 100, scale: 0.5 }}
          animate={{ opacity: [0, 1, 1, 0], y: -300, scale: [0.5, 1, 1, 0.3] }}
          transition={{ duration: 4, delay: item.delay, ease: "easeOut" }}
          className="absolute text-2xl"
          style={{ left: `${item.x}%`, bottom: "10%" }}
          onAnimationComplete={() => {
            setEmojis((prev) => prev.filter((e) => e.id !== item.id))
          }}
        >
          {item.emoji}
        </motion.div>
      ))}
    </div>
  )
}

// function SyncIndicator() {
//   return (
//     <motion.div
//       initial={{ opacity: 0, scale: 0.8 }}
//       animate={{ opacity: 1, scale: 1 }}
//       transition={{ duration: 0.8, delay: 1.2 }}
//       className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-sm"
//     >
//       <div className="relative flex items-center gap-2">
//         <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-glow" />
//         <span className="text-sm text-emerald-400 font-medium">Synced</span>
//       </div>
//       <div className="w-px h-4 bg-zinc-700" />
//       <div className="flex items-center gap-1.5">
//         <span className="text-sm text-zinc-400">Latency:</span>
//         <motion.span
//           className="text-sm text-white font-mono font-medium"
//           animate={{ opacity: [1, 0.5, 1] }}
//           transition={{ duration: 2, repeat: Infinity }}
//         >
//           32ms
//         </motion.span>
//       </div>
//       <div className="w-px h-4 bg-zinc-700" />
//       <div className="flex items-center gap-1.5">
//         <span className="text-sm text-zinc-400">Viewers:</span>
//         <span className="text-sm text-[#00a6ff] font-medium">4</span>
//       </div>
//     </motion.div>
//   )
// }

export function Hero() {
  const { data: session } = useSession()

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-black pointer-events-none" />

      {/* Neon radial glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[#ffd063]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-[#00a6ff]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Emojis */}
      <FloatingEmojis />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ffd063]/10 border border-[#ffd063]/20 mb-8"
        >
          {/* <span className="text-base">✨</span> */}
          <span className="text-sm text-[#ffd063]">Free to use — No signup required</span>
        </motion.div>

        {/* Headline */}
        <h1
          className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight text-white mb-6"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          <span className="block overflow-hidden">
            <motion.span className="block" variants={textRevealVariants} initial="hidden" animate="visible" custom={0}>
              Create Space.
            </motion.span>
          </span>
          <span className="block overflow-hidden">
            <motion.span
              className="block gradient-text"
              variants={textRevealVariants}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              Chill, Watch in Sync.
            </motion.span>
          </span>
        </h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed"
        >
          Create a private watch space, share a YouTube link or upload any video, and enjoy perfectly synchronized
          playback with voice chat, text reactions, and subtitles.
        </motion.p>

        {/* Sync Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex justify-center mb-10"
        >
          {/* <SyncIndicator /> */}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link href={session ? "/dashboard" : "/sign-up"}>
            <Button
              size="lg"
              className="shimmer-btn bg-gradient-to-r from-[#ffd063] to-[#ffda7a] text-black hover:brightness-110 rounded-full px-8 h-13 text-base font-medium shadow-lg shadow-[#ffd063]/20 border-0"
            >
              Create a Room
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link href={session ? "/dashboard" : "/sign-in"}>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 h-13 text-base font-medium border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white hover:border-zinc-700 bg-transparent"
            >
              <Play className="mr-2 w-4 h-4" />
              Join a Room
            </Button>
          </Link>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col items-center gap-4"
        >
          {/* <div className="flex items-center -space-x-3">
            {avatars.map((avatar, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                className="relative"
              >
                <img
                  src={avatar || "/placeholder.svg"}
                  alt=""
                  className="w-10 h-10 rounded-full border-2 border-black object-cover"
                />
              </motion.div>
            ))}
          </div> */}
          <p className="text-sm text-zinc-500">
            <span className="text-[#ffd063] font-medium">1,000+</span> watch parties hosted this week
          </p>
        </motion.div>
      </div>
    </section>
  )
}
