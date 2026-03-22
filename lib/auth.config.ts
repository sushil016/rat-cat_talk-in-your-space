import type { NextAuthConfig } from "next-auth"

// Edge-compatible auth config (no Prisma, no Node.js APIs)
// Used by middleware for route protection
export const authConfig = {
    pages: {
        signIn: "/sign-in",
        newUser: "/dashboard",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const { pathname } = nextUrl

            // Public routes
            const publicRoutes = ["/", "/sign-in", "/sign-up"]
            const isPublicRoute = publicRoutes.includes(pathname)
            const isApiAuth = pathname.startsWith("/api/auth")

            // Redirect signed-in users away from auth pages
            if (isLoggedIn && (pathname === "/sign-in" || pathname === "/sign-up")) {
                return Response.redirect(new URL("/dashboard", nextUrl))
            }

            // Allow public routes and API auth
            if (isPublicRoute || isApiAuth) return true

            // Protect everything else
            return isLoggedIn
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub
            }
            if (token.username && session.user) {
                (session.user as any).username = token.username
            }
            if (token.isNewUser !== undefined && session.user) {
                (session.user as any).isNewUser = token.isNewUser
            }
            return session
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.sub = user.id
                token.username = (user as any).username
                token.isNewUser = (user as any).isNewUser
            }
            if (trigger === "update" && session) {
                token.username = session.username
                token.isNewUser = session.isNewUser
            }
            return token
        },
    },
    providers: [], // Providers added in full auth.ts
    session: {
        strategy: "jwt",
    },
    secret: process.env.AUTH_SECRET,
    trustHost: true,
} satisfies NextAuthConfig
