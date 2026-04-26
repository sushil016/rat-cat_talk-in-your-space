"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"

const steps = [
  {
    number: "01",
    title: "You create a Coding or Chill room",
    description:
      "Pick the room type. Add a GitHub repo link for coding rooms or a YouTube link for chill rooms. One click, one code.",
    scene: "SPACE",
    hint: "coding or chill.",
  },
  {
    number: "02",
    title: "Friends join the 2D space",
    description:
      "Share the room code or link. Everyone spawns in the virtual space and can move around with WASD or arrow keys.",
    scene: "POST",
    hint: "walk around. explore.",
  },
  {
    number: "03",
    title: "Walk up to people and just talk",
    description:
      "Proximity voice activates automatically when you move close to someone. Volume fades as you walk away — no buttons.",
    scene: "SYNC",
    hint: "no channels. just move.",
  },
  {
    number: "04",
    title: "Enter a zone. Do stuff together.",
    description:
      "Step into the Watch Hall to sync a video, the Pair Programming Pods to open a GitHub repo, or just chill at the café.",
    scene: "CHILL",
    hint: "press E to enter.",
  },
]

function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState("")
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const startTimeout = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(startTimeout)
  }, [delay])

  useEffect(() => {
    if (!started) return
    if (displayed.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayed(text.slice(0, displayed.length + 1))
      }, 45)
      return () => clearTimeout(timeout)
    }
  }, [displayed, started, text])

  return (
    <span>
      {displayed}
      <span className="animate-pulse">|</span>
    </span>
  )
}

function SceneIndicator({ scene }: { scene: string }) {
  const colors: Record<string, string> = {
    POST: "#FF0033",
    SPACE: "#FFEF4D",
    SYNC: "#22c55e",
    CHILL: "#00a6ff",
  }
  return (
    <div
      className="text-[10px] uppercase tracking-[0.3em] font-semibold px-3 py-1 rounded-full"
      style={{
        color: colors[scene] ?? "#fff",
        backgroundColor: `${colors[scene] ?? "#fff"}15`,
        border: `1px solid ${colors[scene] ?? "#fff"}30`,
      }}
    >
      {scene}
    </div>
  )
}

export function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-32 px-4 relative overflow-hidden" style={{ backgroundColor: "#161615" }}>
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: "rgba(255, 239, 77, 0.02)" }}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-24"
      >
        <p className="text-xs uppercase tracking-[0.3em] mb-4 font-semibold" style={{ color: "rgba(255,239,77,0.5)" }}>
          Simple by design
        </p>
        <h2 className="text-4xl sm:text-5xl font-bold text-white">
          Four steps.{" "}
          <span style={{ color: "rgba(255,255,255,0.25)" }}>That&apos;s it.</span>
        </h2>
      </motion.div>

      {/* Steps */}
      <div className="max-w-3xl mx-auto">
        {steps.map((step, index) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex gap-8 mb-20 last:mb-0 group"
          >
            {/* Number */}
            <div className="flex-shrink-0 w-16 text-right">
              <span
                className="text-5xl font-bold leading-none transition-colors duration-500"
                style={{ color: "rgba(255,255,255,0.08)", fontFamily: "var(--font-display, monospace)" }}
              >
                {step.number}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className="absolute left-[4.5rem] top-16 bottom-0 w-px -translate-x-1/2"
                style={{
                  background: "linear-gradient(to bottom, rgba(255,239,77,0.15), transparent)",
                }}
              />
            )}

            {/* Content */}
            <div className="flex-1 pt-2">
              {/* Scene tag */}
              <div className="flex items-center gap-3 mb-4">
                <SceneIndicator scene={step.scene} />
                <span className="text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>
                  {step.hint}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3 leading-snug">
                <TypewriterText text={step.title} delay={isInView ? index * 200 + 400 : 999999} />
              </h3>

              {/* Description */}
              <p className="text-sm leading-relaxed max-w-lg" style={{ color: "rgba(255,255,255,0.4)" }}>
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom tagline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="text-center mt-24"
      >
        <p
          className="text-sm uppercase tracking-[0.4em]"
          style={{ color: "rgba(255,239,77,0.3)" }}
        >
          Walk in. Talk. Create. Watch together.
        </p>
      </motion.div>
    </section>
  )
}
