import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const skip = Math.max(0, parseInt(searchParams.get("skip") || "0", 10))
    const take = Math.min(20, Math.max(1, parseInt(searchParams.get("take") || "6", 10)))

    const [rooms, total] = await Promise.all([
        prisma.room.findMany({
            where: {
                isPublic: true,
                status: { not: "ended" },
            },
            include: {
                host: { select: { id: true, name: true, username: true, image: true } },
                _count: { select: { participants: true } },
            },
            orderBy: { updatedAt: "desc" },
            skip,
            take,
        }),
        prisma.room.count({
            where: {
                isPublic: true,
                status: { not: "ended" },
            },
        }),
    ])

    return NextResponse.json({ rooms, total, skip, take })
}
