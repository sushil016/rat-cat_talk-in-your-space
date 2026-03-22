import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

// GET: List friends (accepted) + pending requests
export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get accepted friends (both directions)
    const friendships = await prisma.friendship.findMany({
        where: {
            OR: [
                { senderId: userId, status: "accepted" },
                { receiverId: userId, status: "accepted" },
            ],
        },
        include: {
            sender: { select: { id: true, name: true, username: true, image: true, bio: true } },
            receiver: { select: { id: true, name: true, username: true, image: true, bio: true } },
        },
    })

    const friends = friendships.map((f) =>
        f.senderId === userId ? f.receiver : f.sender
    )

    // Get pending received requests
    const pendingRequests = await prisma.friendship.findMany({
        where: {
            receiverId: userId,
            status: "pending",
        },
        include: {
            sender: { select: { id: true, name: true, username: true, image: true } },
        },
    })

    // Get pending sent requests
    const sentRequests = await prisma.friendship.findMany({
        where: {
            senderId: userId,
            status: "pending",
        },
        include: {
            receiver: { select: { id: true, name: true, username: true, image: true } },
        },
    })

    return NextResponse.json({
        friends,
        pendingRequests: pendingRequests.map((r) => ({
            id: r.id,
            user: r.sender,
            createdAt: r.createdAt,
        })),
        sentRequests: sentRequests.map((r) => ({
            id: r.id,
            user: r.receiver,
            createdAt: r.createdAt,
        })),
    })
}

// POST: Send friend request by username
export async function POST(req: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { username } = await req.json()
    if (!username) {
        return NextResponse.json({ error: "Username required" }, { status: 400 })
    }

    const target = await prisma.user.findUnique({
        where: { username },
        select: { id: true, name: true, username: true, image: true },
    })

    if (!target) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (target.id === session.user.id) {
        return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 })
    }

    // Check if friendship already exists
    const existing = await prisma.friendship.findFirst({
        where: {
            OR: [
                { senderId: session.user.id, receiverId: target.id },
                { senderId: target.id, receiverId: session.user.id },
            ],
        },
    })

    if (existing) {
        return NextResponse.json(
            { error: existing.status === "accepted" ? "Already friends" : "Request already sent" },
            { status: 409 }
        )
    }

    const friendship = await prisma.friendship.create({
        data: {
            senderId: session.user.id,
            receiverId: target.id,
        },
        include: {
            receiver: { select: { id: true, name: true, username: true, image: true } },
        },
    })

    return NextResponse.json({ id: friendship.id, user: friendship.receiver }, { status: 201 })
}
