import type React from "react"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-full max-w-md">{children}</div>
        </div>
    )
}
