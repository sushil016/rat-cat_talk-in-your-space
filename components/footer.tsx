"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"

export function Footer() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <footer ref={ref} className="relative overflow-hidden" style={{ backgroundColor: "#161615" }}>
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/homepage.jpeg"
          alt="Footer background"
          fill
          className="object-cover opacity-10"
        />
        <div className="absolute inset-0" style={{ backgroundColor: "#161615", opacity: 0.85 }} />
      </div>

      {/* Subtle top border */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,239,77,0.3), transparent)" }} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center"
        >
          {/* Logo */}
          <div className="flex items-center gap-2 mb-6">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
              style={{ backgroundColor: "rgba(255,239,77,0.1)", border: "1px solid rgba(255,239,77,0.2)" }}
            >
              <span style={{ color: "#FFEF4D" }}>RC</span>
            </div>
            <span className="text-base font-semibold tracking-tight" style={{ color: "rgba(255,255,255,0.9)" }}>
              RatCat
            </span>
          </div>

          {/* Tagline */}
          <p className="text-sm mb-6 max-w-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Watch together. Stay in sync.
          </p>

          {/* Links */}
          <div className="flex items-center gap-6 mb-8">
            {["Home", "Features", "Pricing", "About"].map((link) => (
              <Link
                key={link}
                href="#"
                className="text-xs transition-colors duration-200 hover:opacity-100"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                {link}
              </Link>
            ))}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 mb-8">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#22c55e" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              All systems operational
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-8" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />

          {/* Copyright */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 text-xs"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            &copy; {new Date().getFullYear()} RatCat
          </motion.p>
        </motion.div>
      </div>
    </footer>
  )
}
