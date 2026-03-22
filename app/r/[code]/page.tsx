import { redirect } from "next/navigation"

// Public short link: /r/RAT123 → /join/RAT123
export default async function ShortLinkPage({
    params,
}: {
    params: Promise<{ code: string }>
}) {
    const { code } = await params
    redirect(`/join/${code}`)
}
