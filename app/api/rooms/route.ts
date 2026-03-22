import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

function generateRoomCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let code = ""
    // Format: 3 letters + 3 numbers (e.g., RAT123, CAT456)
    const prefixes = ["RAT", "CAT", "MOV", "FLX", "VID", "PLY"]
    code = prefixes[Math.floor(Math.random() * prefixes.length)]
    for (let i = 0; i < 3; i++) {
        code += Math.floor(Math.random() * 10).toString()
    }
    return code
}

function generateSlug(name: string): string {
    const base = name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 40)
    const suffix = Math.random().toString(36).slice(2, 6)
    return `${base}-${suffix}`
}

// GET: List rooms for current user
export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rooms = await prisma.room.findMany({
        where: {
            OR: [
                { hostId: session.user.id },
                { participants: { some: { userId: session.user.id } } },
            ],
        },
        include: {
            host: { select: { id: true, name: true, username: true, image: true } },
            _count: { select: { participants: true } },
        },
        orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(rooms)
}

// POST: Create a new room
export async function POST(req: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, password, maxParticipants, theme, isPublic } = body

    if (!name || name.trim().length < 2) {
        return NextResponse.json({ error: "Room name must be at least 2 characters" }, { status: 400 })
    }

    // Generate unique code (retry if collision)
    let code = generateRoomCode()
    let attempts = 0
    while (attempts < 5) {
        const existing = await prisma.room.findUnique({ where: { code } })
        if (!existing) break
        code = generateRoomCode()
        attempts++
    }

    const slug = generateSlug(name)

    const room = await prisma.room.create({
        data: {
            code,
            slug,
            name: name.trim(),
            password: password || null,
            maxParticipants: maxParticipants || 10,
            theme: theme || "neutral",
            isPublic: isPublic || false,
            hostId: session.user.id,
            status: "waiting",
            participants: {
                create: {
                    userId: session.user.id,
                    role: "host",
                    isReady: true,
                },
            },
        },
        include: {
            host: { select: { id: true, name: true, username: true, image: true } },
            participants: {
                include: {
                    user: { select: { id: true, name: true, username: true, image: true } },
                },
            },
        },
    })

    return NextResponse.json(room, { status: 201 })
}
