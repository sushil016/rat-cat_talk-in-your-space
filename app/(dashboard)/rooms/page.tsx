"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Plus, Search, Gamepad2 } from "lucide-react"

export default function RoomsPage() {
    const router = useRouter()

    return (
        <div className="max-w-5xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-between mb-8"
            >
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">My Spaces</h1>
                    <p className="text-zinc-400 text-sm">Create and manage your virtual spaces</p>
                </div>
                <button
                    onClick={() => router.push("/rooms/new")}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ffd063] to-[#ffda7a] text-black text-sm font-medium hover:brightness-110 transition-all"
                >
                    <Plus size={16} />
                    New Space
                </button>
            </motion.div>

            {/* Search */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-6"
            >
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search spaces by name or code..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:border-[#00a6ff]/40 focus:outline-none transition-colors"
                    />
                </div>
            </motion.div>

            {/* Empty State */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-xl bg-zinc-900 border border-zinc-800 p-12 text-center"
            >
                <Gamepad2 className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No spaces yet</h3>
                <p className="text-zinc-500 text-sm mb-6">
                    Create your first virtual space and invite friends to hang out.
                </p>
                <button
                    onClick={() => router.push("/rooms/new")}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ffd063] to-[#ffda7a] text-black text-sm font-medium hover:brightness-110 transition-all"
                >
                    Create Your First Space
                </button>
            </motion.div>
        </div>
    )
}
