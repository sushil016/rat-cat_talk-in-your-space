import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

// GET: Get room by code
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params

    const room = await prisma.room.findFirst({
        where: {
            OR: [
                { code: code.toUpperCase() },
                { slug: code },
            ],
        },
        include: {
            host: { select: { id: true, name: true, username: true, image: true } },
            participants: {
                include: {
                    user: { select: { id: true, name: true, username: true, image: true } },
                },
                orderBy: { joinedAt: "asc" },
            },
            _count: { select: { participants: true, messages: true } },
        },
    })

    if (!room) {
        return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // Don't expose password hash
    return NextResponse.json({
        ...room,
        password: room.password ? true : false,
    })
}

// POST: Join a room
export async function POST(
    req: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params
    const body = await req.json()
    const { password, guestName, guestAvatar } = body

    const room = await prisma.room.findFirst({
        where: {
            OR: [
                { code: code.toUpperCase() },
                { slug: code },
            ],
        },
        include: {
            _count: { select: { participants: true } },
        },
    })

    if (!room) {
        return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    if (room.status === "ended") {
        return NextResponse.json({ error: "Room has ended" }, { status: 410 })
    }

    // Check password
    if (room.password && room.password !== password) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 403 })
    }

    // Check capacity
    if (room._count.participants >= room.maxParticipants) {
        return NextResponse.json({ error: "Room is full" }, { status: 409 })
    }

    const session = await auth()

    if (session?.user?.id) {
        // Authenticated user
        const existing = await prisma.participant.findFirst({
            where: { userId: session.user.id, roomId: room.id },
        })

        if (existing) {
            return NextResponse.json({ message: "Already in room", participantId: existing.id })
        }

        const participant = await prisma.participant.create({
            data: {
                userId: session.user.id,
                roomId: room.id,
                role: "participant",
            },
            include: {
                user: { select: { id: true, name: true, username: true, image: true } },
            },
        })

        return NextResponse.json({ participant, roomId: room.id }, { status: 201 })
    } else {
        // Guest mode
        if (!guestName) {
            return NextResponse.json({ error: "Guest name required" }, { status: 400 })
        }

        const participant = await prisma.participant.create({
            data: {
                roomId: room.id,
                role: "guest",
                guestName,
                guestAvatar: guestAvatar || "🐱",
            },
        })

        return NextResponse.json({ participant, roomId: room.id, isGuest: true }, { status: 201 })
    }
}
