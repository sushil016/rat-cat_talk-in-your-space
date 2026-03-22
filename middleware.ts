import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

export default NextAuth(authConfig).auth

export const config = {
    matcher: [
        /*
         * Match all paths except:
         * - Static files (_next, images, etc.)
         * - Public join/redirect routes (/join, /r)
         * - API auth routes
         */
        "/((?!_next|join|r/|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)",
    ],
}
