"use client"

import { motion, useInView, useReducedMotion } from "framer-motion"
import { useRef } from "react"

const platforms = [
  { name: "YouTube", accent: "#FF0033", label: "YT" },
  { name: "Google Drive", accent: "#4285F4", label: "GD" },
  { name: "Dropbox", accent: "#0061FF", label: "DB" },
  { name: "Vimeo", accent: "#1AB7EA", label: "VM" },
  { name: "MP4", accent: "#FFEF4D", label: "M4" },
  { name: "MKV", accent: "#9146FF", label: "MK" },
  { name: "HLS", accent: "#00D4AA", label: "HL" },
  { name: "WebM", accent: "#FF6B35", label: "WB" },
]

export function LogoMarquee() {
  const ref = useRef<HTMLElement | null>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const prefersReducedMotion = useReducedMotion()
  const marqueeClass = prefersReducedMotion ? "" : "animate-marquee"

  return (
    <section
      ref={ref}
      className="relative overflow-hidden border-y border-white/8 bg-[#1b1c20] py-16 sm:py-20"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,239,77,0.05),transparent_42%)]" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.45 }}
        className="relative mx-auto mb-10 max-w-3xl px-4 text-center sm:mb-12"
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/45">
          Works With Your Media
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Drop in links or files from the platforms you already use.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
          No noisy dashboard here. Just bring the video source you have, and RatCat keeps playback clean and in sync.
        </p>
      </motion.div>

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#1b1c20] to-transparent sm:w-32" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#1b1c20] to-transparent sm:w-32" />

        <div className={`flex w-max gap-4 px-4 ${marqueeClass}`}>
          {[...platforms, ...platforms].map((platform, index) => (
            <div
              key={`${platform.name}-${index}`}
              className="flex min-w-[176px] items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-sm"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tracking-[0.14em]"
                style={{
                  color: platform.accent,
                  borderColor: `${platform.accent}40`,
                  backgroundColor: `${platform.accent}12`,
                }}
              >
                {platform.label}
              </div>

              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: platform.accent }}
                />
                <span className="truncate text-sm font-medium text-white/84">
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
