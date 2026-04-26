import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

function generateRoomCode(): string {
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

const allowedCodingHosts = ["github.com", "leetcode.com", "codeforces.com"]

function normalizeRoomType(value: unknown): "coding" | "chill" {
    return value === "coding" ? "coding" : "chill"
}

function validateCodingResourceUrl(value: unknown): string | null {
    if (typeof value !== "string" || value.trim().length === 0) return null

    try {
        const trimmed = value.trim()
        const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
        const url = new URL(candidate)
        const hostname = url.hostname.replace(/^www\./, "")
        if (url.protocol !== "https:" || !allowedCodingHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
            return null
        }
        return url.toString()
    } catch {
        return null
    }
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
                { isPublic: true },
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
    const { name, password, maxParticipants, theme, isPublic, roomType: rawRoomType, resourceUrl: rawResourceUrl } = body

    if (!name || name.trim().length < 2) {
        return NextResponse.json({ error: "Room name must be at least 2 characters" }, { status: 400 })
    }

    const roomType = normalizeRoomType(rawRoomType)
    const resourceUrl = roomType === "coding" ? validateCodingResourceUrl(rawResourceUrl) : null

    if (roomType === "coding" && rawResourceUrl && !resourceUrl) {
        return NextResponse.json({ error: "Coding rooms only support GitHub, LeetCode, or Codeforces HTTPS links" }, { status: 400 })
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
            roomType,
            resourceUrl,
            theme: theme || (roomType === "coding" ? "rat_den" : "cat_lounge"),
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
