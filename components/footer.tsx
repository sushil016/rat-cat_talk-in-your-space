"use client"

import { useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import Link from "next/link"

const LINKS = {
    Product: [
        { label: "Create Space", href: "/rooms/new" },
        { label: "Browse Rooms", href: "/rooms" },
        { label: "Dashboard", href: "/dashboard" },
    ],
    Community: [
        { label: "Friends", href: "/friends" },
        { label: "Public Rooms", href: "/dashboard" },
    ],
    Account: [
        { label: "Profile", href: "/profile" },
        { label: "Sign In", href: "/sign-in" },
    ],
}

function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
    const styles: Record<string, React.CSSProperties> = {
        tl: { top: -1, left: -1, borderTopLeftRadius: 12 },
        tr: { top: -1, right: -1, borderTopRightRadius: 12 },
        bl: { bottom: -1, left: -1, borderBottomLeftRadius: 12 },
        br: { bottom: -1, right: -1, borderBottomRightRadius: 12 },
    }
    const borders: Record<string, React.CSSProperties> = {
        tl: { borderTop: "1px solid #ffd063", borderLeft: "1px solid #ffd063" },
        tr: { borderTop: "1px solid #ffd063", borderRight: "1px solid #ffd063" },
        bl: { borderBottom: "1px solid #ffd063", borderLeft: "1px solid #ffd063" },
        br: { borderBottom: "1px solid #ffd063", borderRight: "1px solid #ffd063" },
    }
    return (
        <div style={{
            position: "absolute",
            width: 20,
            height: 20,
            ...styles[pos],
            ...borders[pos],
        }} />
    )
}

export function Footer() {
    const footerRef = useRef<HTMLElement>(null)
    const ctaRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(ctaRef, { once: true, margin: "-60px" })
    const [mouse, setMouse] = useState({ x: 50, y: 50 })

    function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        const rect = e.currentTarget.getBoundingClientRect()
        setMouse({
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
        })
    }

    return (
        <footer ref={footerRef} style={{ backgroundColor: "#0a0a0a", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="max-w-6xl mx-auto px-6 pt-16 pb-8">

                {/* CTA spotlight box */}
                <motion.div
                    ref={ctaRef}
                    onMouseMove={onMouseMove}
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                    style={{
                        position: "relative",
                        borderRadius: 16,
                        padding: "48px 40px",
                        background: "#111",
                        border: "1px solid rgba(255,208,99,0.15)",
                        overflow: "hidden",
                        marginBottom: 60,
                        cursor: "default",
                    }}
                >
                    {/* Mouse spotlight */}
                    <div style={{
                        position: "absolute",
                        inset: 0,
                        background: `radial-gradient(350px circle at ${mouse.x}% ${mouse.y}%, rgba(255,208,99,0.10) 0%, transparent 70%)`,
                        pointerEvents: "none",
                    }} />

                    {/* Decorative corners */}
                    <Corner pos="tl" />
                    <Corner pos="tr" />
                    <Corner pos="bl" />
                    <Corner pos="br" />

                    <div style={{ position: "relative", textAlign: "center" }}>
                        <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 14px",
                            borderRadius: 99,
                            border: "1px solid rgba(255,208,99,0.3)",
                            background: "rgba(255,208,99,0.08)",
                            marginBottom: 20,
                        }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Open beta · Free to use</span>
                        </div>

                        <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "white", marginBottom: 12, lineHeight: 1.2 }}>
                            Your space is waiting.
                        </h2>
                        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", marginBottom: 32, maxWidth: 420, margin: "0 auto 32px" }}>
                            Spin up a room in seconds. Invite friends, enter the 2D world, and hang out like you're in the same room.
                        </p>

                        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                            <Link href="/rooms/new">
                                <button style={{
                                    padding: "12px 28px",
                                    borderRadius: 10,
                                    background: "linear-gradient(135deg, #ffd063, #ffda7a)",
                                    border: "none",
                                    color: "#000",
                                    fontWeight: 700,
                                    fontSize: 14,
                                    cursor: "pointer",
                                    transition: "filter 0.2s",
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.1)")}
                                    onMouseLeave={e => (e.currentTarget.style.filter = "brightness(1)")}
                                >
                                    Create a Space →
                                </button>
                            </Link>
                            <Link href="/dashboard">
                                <button style={{
                                    padding: "12px 28px",
                                    borderRadius: 10,
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    color: "rgba(255,255,255,0.7)",
                                    fontWeight: 600,
                                    fontSize: 14,
                                    cursor: "pointer",
                                    transition: "border-color 0.2s, color 0.2s",
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,208,99,0.4)"; e.currentTarget.style.color = "white" }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)" }}
                                >
                                    Browse Community
                                </button>
                            </Link>
                        </div>
                    </div>
                </motion.div>

                {/* Footer columns */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 48, marginBottom: 40 }}>
                    {/* Brand */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: 8,
                                background: "rgba(255,208,99,0.1)",
                                border: "1px solid rgba(255,208,99,0.2)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 12, fontWeight: 800, color: "#ffd063",
                            }}>RC</div>
                            <span style={{ fontWeight: 700, fontSize: 15, color: "rgba(255,255,255,0.9)" }}>RatCat</span>
                        </div>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", maxWidth: 220, lineHeight: 1.6 }}>
                            2D virtual spaces for coding sessions, watch parties, and hanging out.
                        </p>
                    </div>

                    {/* Link columns */}
                    <div style={{ display: "flex", gap: 48 }}>
                        {Object.entries(LINKS).map(([section, items]) => (
                            <div key={section}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
                                    {section}
                                </p>
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {items.map(item => (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "color 0.15s" }}
                                            onMouseEnter={e => (e.currentTarget.style.color = "white")}
                                            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom bar */}
                <div style={{
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    paddingTop: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                }}>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
                        © {new Date().getFullYear()} RatCat. Built for the internet.
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>All systems operational</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
