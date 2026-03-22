import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

// Max 2GB
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get("file") as File | null
        const roomCode = formData.get("roomCode") as string | null

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        if (!roomCode) {
            return NextResponse.json({ error: "Room code required" }, { status: 400 })
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "File too large (max 2GB)" }, { status: 413 })
        }

        // Validate extension
        const ext = path.extname(file.name).toLowerCase()
        const validExts = [".mp4", ".mkv", ".webm", ".mov", ".avi"]
        if (!validExts.includes(ext)) {
            return NextResponse.json({ error: `Invalid file type. Supported: ${validExts.join(", ")}` }, { status: 400 })
        }

        // Create upload directory
        const uploadDir = path.join(process.cwd(), "public", "uploads", roomCode)
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        // Generate safe filename
        const timestamp = Date.now()
        const safeName = file.name
            .replace(/[^a-zA-Z0-9._-]/g, "_")
            .replace(/_{2,}/g, "_")
        const filename = `${timestamp}_${safeName}`
        const filepath = path.join(uploadDir, filename)

        // Write file
        const buffer = Buffer.from(await file.arrayBuffer())
        await writeFile(filepath, buffer)

        // Return public URL
        const publicUrl = `/uploads/${roomCode}/${filename}`

        return NextResponse.json({
            url: publicUrl,
            filename: file.name,
            size: file.size,
        }, { status: 201 })

    } catch (error: any) {
        console.error("Upload error:", error)
        return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }
}
