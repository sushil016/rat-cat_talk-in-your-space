import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    const rooms = await prisma.room.findMany({
        where: {
            isPublic: true,
            status: { not: "ended" },
        },
        include: {
            host: { select: { name: true, username: true } },
            _count: { select: { participants: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 6,
    })

    return NextResponse.json(rooms)
}

