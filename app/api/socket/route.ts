import { NextResponse } from "next/server"

// Placeholder Socket.io API route
// In production, Socket.io requires a custom server (not serverless).
// This route serves as a health-check endpoint for the socket server.
// The actual Socket.io server runs separately (see lib/socket-server.ts).

export async function GET() {
    return NextResponse.json({
        status: "ok",
        message: "Socket.io server should run on a separate port. See lib/socket.ts for client config.",
        socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001",
    })
}
