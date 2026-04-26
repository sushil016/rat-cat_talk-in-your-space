"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Code2, Film, Globe2, Loader2, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface PublicRoom {
  id: string
  code: string
  name: string
  roomType: string
  resourceUrl: string | null
  maxParticipants: number
  host: { name: string | null; username: string | null }
  _count: { participants: number }
}

const roomTypeMeta = {
  coding: { label: "Coding", icon: Code2, className: "text-[#00a6ff] border-[#00a6ff]/30 bg-[#00a6ff]/10" },
  chill: { label: "Chill", icon: Film, className: "text-[#ffd063] border-[#ffd063]/30 bg-[#ffd063]/10" },
}

export function RecentPublicRooms() {
  const [rooms, setRooms] = useState<PublicRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadRooms() {
      try {
        const res = await fetch("/api/rooms/public")
        if (res.ok) setRooms(await res.json())
      } finally {
        setIsLoading(false)
      }
    }
    loadRooms()
  }, [])

  return (
    <section className="relative bg-[#111214] px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
              <Globe2 className="h-3.5 w-3.5 text-[#00a6ff]" />
              Recent Public Rooms
            </div>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Jump into an open space</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Public coding and chill rooms are visible here so logged-in people can discover active spaces.
            </p>
          </div>
          <Link href="/rooms" className="text-sm font-medium text-[#ffd063] hover:text-[#ffda7a]">
            Browse spaces
          </Link>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-8">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#ffd063]" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/70 p-8 text-center">
            <p className="text-sm text-zinc-400">No public rooms yet. Create one and it will show up here.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => {
              const meta = roomTypeMeta[(room.roomType as keyof typeof roomTypeMeta) || "chill"] ?? roomTypeMeta.chill
              const Icon = meta.icon
              return (
                <Link key={room.id} href={`/rooms/${room.code}/space`} className="group">
                  <Card className="h-full border-zinc-800 bg-zinc-950/80 transition-colors group-hover:border-[#ffd063]/50">
                    <CardContent className="flex h-full flex-col gap-5 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold text-white group-hover:text-[#ffd063]">
                            {room.name}
                          </h3>
                          <p className="mt-1 text-xs text-zinc-500">
                            Hosted by {room.host.username || room.host.name || "RatCat user"}
                          </p>
                        </div>
                        <Badge variant="outline" className={meta.className}>
                          <Icon className="h-3 w-3" />
                          {meta.label}
                        </Badge>
                      </div>

                      {room.resourceUrl && (
                        <p className="truncate rounded-lg bg-zinc-900 px-3 py-2 text-xs text-zinc-400">
                          {room.resourceUrl}
                        </p>
                      )}

                      <div className="mt-auto flex items-center justify-between text-xs text-zinc-500">
                        <span className="font-mono text-zinc-400">{room.code}</span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {room._count.participants}/{room.maxParticipants}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

