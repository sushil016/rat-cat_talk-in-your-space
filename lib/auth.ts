import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import Discord from "next-auth/providers/discord"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import { authConfig } from "@/lib/auth.config"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma as any),
    session: { strategy: "jwt" },
    trustHost: true,
    events: {
        async createUser({ user }) {
            // Set isNewUser flag on first login
            if (user.id) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { isNewUser: true },
                })
            }
        },
    },
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user, trigger, session, account }) {
            if (user) {
                // Fetch full user data from DB on sign-in
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id! },
                    select: { username: true, isNewUser: true },
                })
                token.sub = user.id
                token.username = dbUser?.username || null
                token.isNewUser = dbUser?.isNewUser ?? true
            }
            if (trigger === "update" && session) {
                if (session.username !== undefined) token.username = session.username
                if (session.isNewUser !== undefined) token.isNewUser = session.isNewUser
            }
            return token
        },
    },
    providers: [
        GitHub({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        }),
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        Discord({
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
        }),
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                })

                if (!user || !user.password) return null

                const isValid = await bcrypt.compare(credentials.password as string, user.password)
                if (!isValid) return null

                return {
                    id: user.id,
                    name: user.name || user.username,
                    email: user.email,
                    image: user.image,
                    username: user.username,
                    isNewUser: user.isNewUser,
                }
            },
        }),
    ],
})
