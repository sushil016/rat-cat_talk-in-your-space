"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Code2, Film, MapPin, Mic2, Users2, Keyboard } from "lucide-react"

const features = [
  {
    icon: MapPin,
    color: "#ffd063",
    borderColor: "rgba(255,208,99,0.3)",
    bg: "rgba(255,208,99,0.06)",
    title: "2D Virtual Space",
    description:
      "Walk around a virtual office or lounge using WASD or arrow keys. Different zones have different vibes — standup areas, pair programming pods, and chill corners.",
    tags: ["WASD Movement", "Zone Detection", "Minimap"],
  },
  {
    icon: Mic2,
    color: "#22c55e",
    borderColor: "rgba(34,197,94,0.3)",
    bg: "rgba(34,197,94,0.06)",
    title: "Proximity Voice",
    description:
      "Voice chat activates automatically when you walk close to someone. Move away to fade out. No buttons, no joining channels — just walk up and talk.",
    tags: ["Auto-activates", "Volume by distance", "Camera bubbles"],
  },
  {
    icon: Code2,
    color: "#00a6ff",
    borderColor: "rgba(0,166,255,0.3)",
    bg: "rgba(0,166,255,0.06)",
    title: "Coding Rooms",
    description:
      "Create a coding-type room with a GitHub repo link. Walk into the Pair Programming Pods zone and press E to open the repo. Pair program, review PRs, or grind DSA together.",
    tags: ["GitHub link", "Pair Pods", "Algorithm Lab"],
  },
  {
    icon: Film,
    color: "#a855f7",
    borderColor: "rgba(168,85,247,0.3)",
    bg: "rgba(168,85,247,0.06)",
    title: "Watch Together",
    description:
      "Enter the Watch Hall or Review Theater and hit E to jump into the watch room. Everyone's video stays frame-perfect with auto-sync correction every few seconds.",
    tags: ["YouTube", "MP4 / MKV", "±100ms sync"],
  },
]

const steps = [
  {
    num: "01",
    label: "Create a Room",
    detail: "Pick Coding or Chill. Add a GitHub link for coding rooms.",
    color: "#ffd063",
  },
  {
    num: "02",
    label: "Share the link",
    detail: "Anyone with the code or link can join instantly.",
    color: "#00a6ff",
  },
  {
    num: "03",
    label: "Enter the Space",
    detail: "Navigate with WASD. Walk into zones to see what they do.",
    color: "#22c55e",
  },
  {
    num: "04",
    label: "Collaborate",
    detail: "Talk to nearby people, code together, or watch videos in sync.",
    color: "#a855f7",
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

export function ExploreFeatures() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const stepsRef = useRef(null)
  const stepsInView = useInView(stepsRef, { once: true, margin: "-80px" })

  return (
    <section className="relative bg-[#0c0d0f] px-4 py-24">
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(ellipse, rgba(255,208,99,0.05) 0%, transparent 70%)" }}
      />

      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
            <Keyboard className="h-3.5 w-3.5 text-[#ffd063]" />
            Things to Explore
          </div>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            More than a watch party.{" "}
            <span className="bg-gradient-to-r from-[#ffd063] to-[#00a6ff] bg-clip-text text-transparent">
              A virtual space.
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
            RatCat is a 2D world you can walk around in. Code together, watch videos in sync, and talk to nearby
            people — all in one place.
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mb-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((f) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                variants={cardVariants}
                className="group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.02]"
                style={{
                  borderColor: f.borderColor,
                  background: f.bg,
                  backgroundColor: "#111214",
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: `radial-gradient(ellipse at 30% 20%, ${f.bg} 0%, transparent 60%)` }}
                />
                <div
                  className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}
                >
                  <Icon className="h-4 w-4" style={{ color: f.color }} strokeWidth={1.8} />
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">{f.title}</h3>
                <p className="mb-4 text-xs leading-5 text-zinc-400">{f.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {f.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        background: `${f.color}12`,
                        color: f.color,
                        border: `1px solid ${f.color}25`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Keyboard shortcut hint */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-20 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-4"
        >
          {[
            { key: "WASD", label: "Move" },
            { key: "E", label: "Enter zone" },
            { key: "+ / −", label: "Zoom" },
            { key: "Pinch", label: "Trackpad zoom" },
            { key: "0", label: "Reset zoom" },
          ].map((k) => (
            <div key={k.key} className="flex items-center gap-2 text-sm text-zinc-500">
              <kbd className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs text-zinc-300">
                {k.key}
              </kbd>
              <span>{k.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Getting started steps */}
        <div ref={stepsRef}>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={stepsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center text-xs uppercase tracking-[0.3em] text-zinc-600"
          >
            Getting started
          </motion.p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                animate={stepsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-5"
              >
                <span
                  className="mb-3 block text-4xl font-bold leading-none"
                  style={{ color: `${step.color}20`, fontFamily: "monospace" }}
                >
                  {step.num}
                </span>
                <div
                  className="mb-1 h-0.5 w-8 rounded-full"
                  style={{ background: step.color }}
                />
                <h4 className="mb-1 text-sm font-semibold text-white">{step.label}</h4>
                <p className="text-xs leading-5 text-zinc-500">{step.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
