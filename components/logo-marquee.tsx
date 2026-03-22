"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

const platforms = [
  { name: "YouTube", icon: "▶" },
  { name: "Google Drive", icon: "📁" },
  { name: "Dropbox", icon: "📦" },
  { name: "Vimeo", icon: "🎥" },
  { name: "MP4", icon: "🎬" },
  { name: "MKV", icon: "📀" },
  { name: "HLS", icon: "📡" },
  { name: "WebM", icon: "🌐" },
]

export function LogoMarquee() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-16 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <p className="text-sm text-zinc-500 uppercase tracking-wider font-medium">
          Works with your favorite platforms &amp; formats
        </p>
      </motion.div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee">
          {[...platforms, ...platforms].map((platform, index) => (
            <div
              key={index}
              className="flex items-center justify-center min-w-[180px] h-16 mx-8 opacity-50 hover:opacity-100 transition-all duration-300 group"
            >
              <div className="flex items-center gap-3 text-zinc-400 group-hover:text-[#ffd063] transition-colors">
                <div className="w-9 h-9 rounded-lg bg-zinc-900 group-hover:bg-[#ffd063]/10 border border-zinc-800 group-hover:border-[#ffd063]/20 flex items-center justify-center transition-all">
                  <span className="text-base">{platform.icon}</span>
                </div>
                <span className="font-medium text-sm">
                  {platform.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
