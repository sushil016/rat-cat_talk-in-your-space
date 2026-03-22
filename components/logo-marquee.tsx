"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

const platforms = [
  { name: "YouTube", icon: "▶", color: "#FF0033" },
  { name: "Google Drive", icon: "📁", color: "#4285F4" },
  { name: "Dropbox", icon: "📦", color: "#0061FF" },
  { name: "Vimeo", icon: "🎥", color: "#1AB7EA" },
  { name: "MP4", icon: "🎬", color: "#FFEF4D" },
  { name: "MKV", icon: "📀", color: "#9146FF" },
  { name: "HLS", icon: "📡", color: "#00D4AA" },
  { name: "WebM", icon: "🌐", color: "#FF6B35" },
]

export function LogoMarquee() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="relative py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0" style={{ backgroundColor: "#212226" }} />

      {/* Subtle top/bottom borders */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" />

      {/* Glow effects */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: "rgba(255, 239, 77, 0.03)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="relative text-center mb-12"
      >
        <p className="text-xs uppercase tracking-[0.25em] font-semibold mb-3" style={{ color: "rgba(255, 239, 77, 0.6)" }}>
          Supported Sources
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "#FFEF4D" }}>
          From anywhere. Play everything.
        </h2>
      </motion.div>

      <div className="relative">
        {/* Gradient fade edges */}
        <div
          className="absolute left-0 top-0 bottom-0 w-40 z-20 pointer-events-none"
          style={{
            background: "linear-gradient(to right, #212226 0%, transparent 100%)",
          }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-40 z-20 pointer-events-none"
          style={{
            background: "linear-gradient(to left, #212226 0%, transparent 100%)",
          }}
        />

        {/* Marquee track */}
        <div className="flex gap-6 w-max" style={{ animation: "marquee-slow 35s linear infinite" }}>
          {[...platforms, ...platforms].map((platform, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05, y: -4 }}
              transition={{ duration: 0.3 }}
              className="relative group cursor-pointer"
            >
              {/* Glow on hover */}
              <div
                className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"
                style={{ backgroundColor: `${platform.color}15` }}
              />

              <div
                className="relative flex items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-sm transition-all duration-300"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  borderColor: "rgba(255, 255, 255, 0.08)",
                }}
              >
                {/* Icon container */}
                <div
                  className="relative w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all duration-300"
                  style={{
                    backgroundColor: `${platform.color}15`,
                    color: platform.color,
                    border: `1px solid ${platform.color}30`,
                  }}
                >
                  <span className="opacity-80">{platform.icon}</span>

                  {/* Pulse ring on hover */}
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      boxShadow: `0 0 20px ${platform.color}40`,
                    }}
                  />
                </div>

                {/* Platform name */}
                <div className="flex flex-col gap-0.5">
                  <span
                    className="font-semibold text-sm tracking-wide transition-colors duration-300"
                    style={{ color: "rgba(255, 255, 255, 0.85)" }}
                  >
                    {platform.name}
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-wider opacity-50"
                    style={{ color: platform.color }}
                  >
                    Supported
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee-slow {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  )
}
