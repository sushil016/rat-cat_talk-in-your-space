"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useEffect, useState } from "react"
import { Users, Radio, Mic, Film, Smile, MonitorPlay } from "lucide-react"

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
}

function RoomCodeAnimation() {
  const [code, setCode] = useState("ABC123")
  const codes = ["ABC123", "XYZ789", "RAT42K", "MOV007", "SYN101"]

  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      index = (index + 1) % codes.length
      setCode(codes[index])
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-3 mt-4">
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700">
        <span className="text-xs text-zinc-500">Room:</span>
        <motion.span
          key={code}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-sm text-[#ffd063] font-bold tracking-wider"
        >
          {code}
        </motion.span>
      </div>
      <div className="flex -space-x-2">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.15 }}
            className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ffd063]/20 to-[#00a6ff]/20 border-2 border-zinc-900 flex items-center justify-center"
          >
            <span className="text-[10px]">👤</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function SyncPulse() {
  return (
    <div className="flex items-center gap-3 mt-4">
      <div className="relative">
        <div className="w-3 h-3 rounded-full bg-emerald-500" />
        <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 sync-pulse" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-emerald-400 font-medium">±100ms sync</span>
        <span className="text-xs text-zinc-500">Auto-correction every 3s</span>
      </div>
    </div>
  )
}

function VoiceChatIndicator() {
  const [levels, setLevels] = useState([3, 5, 2, 7, 4])

  useEffect(() => {
    const interval = setInterval(() => {
      setLevels(levels.map(() => Math.floor(Math.random() * 8) + 1))
    }, 300)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-end gap-0.5 h-6 mt-4">
      {levels.map((level, i) => (
        <motion.div
          key={i}
          animate={{ height: level * 3 }}
          transition={{ duration: 0.15 }}
          className="w-1.5 rounded-full bg-gradient-to-t from-[#00a6ff] to-[#ffd063]"
        />
      ))}
      <span className="text-xs text-zinc-500 ml-2">Speaking...</span>
    </div>
  )
}

function MediaTypeAnimation() {
  const types = [
    { label: "YouTube", color: "text-red-400" },
    { label: "MP4", color: "text-[#00a6ff]" },
    { label: "MKV", color: "text-emerald-400" },
    { label: "HLS", color: "text-[#ffd063]" },
  ]

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {types.map((type, i) => (
        <motion.span
          key={type.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.15 }}
          className={`px-2.5 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded-md font-mono ${type.color}`}
        >
          {type.label}
        </motion.span>
      ))}
    </div>
  )
}

function EmojiReactions() {
  const emojis = ["🔥", "❤️", "😂", "👏", "🍿"]
  const [active, setActive] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % emojis.length)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2 mt-4">
      {emojis.map((emoji, i) => (
        <motion.span
          key={i}
          animate={{
            scale: i === active ? 1.4 : 1,
            y: i === active ? -6 : 0,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="text-xl cursor-pointer"
        >
          {emoji}
        </motion.span>
      ))}
    </div>
  )
}

export function BentoGrid() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything you need for the perfect{" "}
            <span className="gradient-text">watch party</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            From room creation to synchronized playback with voice chat — RatCat handles it all.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {/* Watch Rooms */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-2 group relative p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-[#ffd063]/30 hover:scale-[1.02] transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#ffd063]/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="p-2 rounded-lg bg-[#ffd063]/10 w-fit mb-4">
                  <Users className="w-5 h-5 text-[#ffd063]" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Watch Rooms</h3>
                <p className="text-zinc-400 text-sm">
                  Create a room instantly, share the link, and bring up to 50 friends together.
                </p>
              </div>
            </div>
            <RoomCodeAnimation />
          </motion.div>

          {/* Sync Engine */}
          <motion.div
            variants={itemVariants}
            className="group relative p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/30 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-2 rounded-lg bg-emerald-500/10 w-fit mb-4">
              <Radio className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Sync Engine</h3>
            <p className="text-zinc-400 text-sm">Ultra-low latency sync via WebSocket + WebRTC.</p>
            <SyncPulse />
          </motion.div>

          {/* Voice & Text Chat */}
          <motion.div
            variants={itemVariants}
            className="group relative p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-[#00a6ff]/30 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#00a6ff]/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-2 rounded-lg bg-[#00a6ff]/10 w-fit mb-4">
              <Mic className="w-5 h-5 text-[#00a6ff]" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Voice & Text Chat</h3>
            <p className="text-zinc-400 text-sm">Discord-style always-on voice, push-to-talk, text with reactions.</p>
            <VoiceChatIndicator />
          </motion.div>

          {/* Media Sources */}
          <motion.div
            variants={itemVariants}
            className="group relative p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-[#00a6ff]/30 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#00a6ff]/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-2 rounded-lg bg-[#00a6ff]/10 w-fit mb-4">
              <Film className="w-5 h-5 text-[#00a6ff]" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Any Media Source</h3>
            <p className="text-zinc-400 text-sm">YouTube, uploaded files (.mp4, .mkv), direct URLs, and more.</p>
            <MediaTypeAnimation />
          </motion.div>

          {/* Reactions */}
          <motion.div
            variants={itemVariants}
            className="group relative p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-[#ffd063]/30 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#ffd063]/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-2 rounded-lg bg-[#ffd063]/10 w-fit mb-4">
              <Smile className="w-5 h-5 text-[#ffd063]" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Reactions & Fun</h3>
            <p className="text-zinc-400 text-sm">Floating emojis, chat bubbles, countdown timers, and polls.</p>
            <EmojiReactions />
          </motion.div>

          {/* HD Playback */}
          <motion.div
            variants={itemVariants}
            className="group relative p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-[#ffd063]/30 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#ffd063]/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-2 rounded-lg bg-[#ffd063]/10 w-fit mb-4">
              <MonitorPlay className="w-5 h-5 text-[#ffd063]" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Cinema-Quality Playback</h3>
            <p className="text-zinc-400 text-sm">1080p to 4K, subtitles, multiple audio tracks, keyboard shortcuts.</p>
            <div className="flex items-center gap-2 mt-4">
              <span className="px-2 py-1 text-xs bg-zinc-800 rounded text-[#ffd063] border border-zinc-700">4K</span>
              <span className="px-2 py-1 text-xs bg-zinc-800 rounded text-zinc-400 border border-zinc-700">HDR</span>
              <span className="px-2 py-1 text-xs bg-zinc-800 rounded text-zinc-400 border border-zinc-700">SRT</span>
              <span className="px-2 py-1 text-xs bg-zinc-800 rounded text-zinc-400 border border-zinc-700">PiP</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
