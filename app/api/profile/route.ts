import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            username: true,
            email: true,
            image: true,
            bio: true,
            isNewUser: true,
            createdAt: true,
        },
    })

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
}

export async function PATCH(req: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, username, bio } = body

    // Check if username is taken
    if (username) {
        const existing = await prisma.user.findUnique({
            where: { username },
        })
        if (existing && existing.id !== session.user.id) {
            return NextResponse.json({ error: "Username already taken" }, { status: 409 })
        }
    }

    const user = await prisma.user.update({
        where: { id: session.user.id },
        data: {
            ...(name !== undefined && { name }),
            ...(username !== undefined && { username }),
            ...(bio !== undefined && { bio }),
            isNewUser: false,
        },
        select: {
            id: true,
            name: true,
            username: true,
            email: true,
            image: true,
            bio: true,
            isNewUser: true,
        },
    })

    return NextResponse.json(user)
}
    