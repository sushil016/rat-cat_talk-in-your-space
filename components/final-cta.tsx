"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import Link from "next/link"

export function FinalCTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { data: session } = useSession()

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#ffd063]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-2/3 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#00a6ff]/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto text-center relative z-10"
      >
        <div className="absolute inset-0 pointer-events-none">
          {["🍿", "🎬", "🎉", "🔥", "❤️", "😂"].map((emoji, i) => (
            <motion.span
              key={i}
              className="absolute text-2xl opacity-15"
              style={{
                left: `${15 + i * 14}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [0, -15, 0],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {emoji}
            </motion.span>
          ))}
        </div>

        <h2
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Ready to{" "}
          <span className="gradient-text">watch together</span>?
        </h2>
        <p className="text-lg sm:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
          Create your first watch room in seconds. Invite friends, paste a link, and hit play.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href={session ? "/dashboard" : "/sign-up"}>
            <Button
              size="lg"
              className="shimmer-btn bg-gradient-to-r from-[#ffd063] to-[#ffda7a] text-black hover:brightness-110 rounded-full px-8 h-14 text-base font-medium shadow-lg shadow-[#ffd063]/20 border-0"
            >
              Create a Room — It&apos;s Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full px-8 h-14 text-base font-medium border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white hover:border-zinc-700 bg-transparent"
          >
            View Demo
          </Button>
        </div>

        <p className="mt-8 text-sm text-zinc-500">
          Free forever for everyone. Premium starts at just <span className="text-[#ffd063]">$4.99/month</span>.
        </p>
      </motion.div>
    </section>
  )
}
