import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

// PATCH: Accept or reject a friend request
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { action } = await req.json() // "accept" | "reject"

    const friendship = await prisma.friendship.findUnique({
        where: { id },
    })

    if (!friendship || friendship.receiverId !== session.user.id) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    if (action === "accept") {
        await prisma.friendship.update({
            where: { id },
            data: { status: "accepted" },
        })
        return NextResponse.json({ message: "Friend request accepted" })
    } else if (action === "reject") {
        await prisma.friendship.delete({
            where: { id },
        })
        return NextResponse.json({ message: "Friend request rejected" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}

// DELETE: Remove friend or cancel request
export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const friendship = await prisma.friendship.findUnique({
        where: { id },
    })

    if (!friendship) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Only sender or receiver can delete
    if (friendship.senderId !== session.user.id && friendship.receiverId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.friendship.delete({ where: { id } })
    return NextResponse.json({ message: "Removed" })
}
