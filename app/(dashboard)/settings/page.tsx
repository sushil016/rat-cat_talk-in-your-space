"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { motion } from "framer-motion"
import {
  Bell,
  Clock3,
  Eye,
  Film,
  Loader2,
  LogOut,
  MonitorPlay,
  Save,
  Settings2,
  Shield,
  Sparkles,
  UserCircle,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"

const SETTINGS_STORAGE_KEY = "ratcat-settings-v1"

type SettingsState = {
  notifications: {
    friendRequests: boolean
    roomInvites: boolean
    liveRoomAlerts: boolean
    productUpdates: boolean
  }
  privacy: {
    showOnlineStatus: boolean
    allowFriendRequests: boolean
    publicProfile: boolean
    autoMuteOnJoin: boolean
  }
  playback: {
    autoplaySharedMedia: boolean
    subtitlesEnabled: boolean
    floatingReactions: boolean
    compactChat: boolean
  }
  roomDefaults: {
    defaultRoomPrivacy: "private" | "public"
    defaultTheme: "neutral" | "rat_den" | "cat_lounge"
    defaultMaxParticipants: "10" | "25" | "50"
    startPage: "dashboard" | "rooms" | "friends" | "profile"
  }
}

type ProfileData = {
  id: string
  name: string | null
  username: string | null
  email: string | null
  image: string | null
  bio: string | null
  createdAt: string
}

const defaultSettings: SettingsState = {
  notifications: {
    friendRequests: true,
    roomInvites: true,
    liveRoomAlerts: true,
    productUpdates: false,
  },
  privacy: {
    showOnlineStatus: true,
    allowFriendRequests: true,
    publicProfile: false,
    autoMuteOnJoin: true,
  },
  playback: {
    autoplaySharedMedia: true,
    subtitlesEnabled: true,
    floatingReactions: true,
    compactChat: false,
  },
  roomDefaults: {
    defaultRoomPrivacy: "private",
    defaultTheme: "neutral",
    defaultMaxParticipants: "25",
    startPage: "dashboard",
  },
}

function mergeSettings(partial?: Partial<SettingsState>): SettingsState {
  return {
    notifications: { ...defaultSettings.notifications, ...(partial?.notifications ?? {}) },
    privacy: { ...defaultSettings.privacy, ...(partial?.privacy ?? {}) },
    playback: { ...defaultSettings.playback, ...(partial?.playback ?? {}) },
    roomDefaults: { ...defaultSettings.roomDefaults, ...(partial?.roomDefaults ?? {}) },
  }
}

function SettingSwitchRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-sm leading-6 text-zinc-400">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="data-[state=checked]:bg-[#ffd063]" />
    </div>
  )
}

function SettingSelectRow({
  title,
  description,
  value,
  onValueChange,
  options,
}: {
  title: string
  description: string
  value: string
  onValueChange: (value: string) => void
  options: Array<{ label: string; value: string }>
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-sm leading-6 text-zinc-400">{description}</p>
      </div>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full border-zinc-700 bg-zinc-900 text-white sm:w-[220px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-zinc-800 bg-zinc-950 text-white">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [settings, setSettings] = useState<SettingsState>(defaultSettings)
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(defaultSettings))
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function loadPage() {
      try {
        const [profileRes] = await Promise.all([fetch("/api/profile")])

        if (profileRes.ok) {
          const profileData = (await profileRes.json()) as ProfileData
          setProfile(profileData)
        }

        const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
        const parsed = stored ? (JSON.parse(stored) as Partial<SettingsState>) : defaultSettings
        const merged = mergeSettings(parsed)
        setSettings(merged)
        setSavedSnapshot(JSON.stringify(merged))
      } catch {
        toast({
          title: "Couldn’t load settings",
          description: "We used the default RatCat settings for this device.",
          variant: "destructive",
        })
      } finally {
        setIsPageLoading(false)
      }
    }

    loadPage()
  }, [toast])

  const hasUnsavedChanges = JSON.stringify(settings) !== savedSnapshot

  function updateSection<K extends keyof SettingsState>(
    section: K,
    value: SettingsState[K],
  ) {
    setSettings((current) => ({
      ...current,
      [section]: value,
    }))
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
      setSavedSnapshot(JSON.stringify(settings))
      toast({
        title: "Settings saved",
        description: "Your RatCat preferences were saved on this device.",
      })
    } catch {
      toast({
        title: "Save failed",
        description: "We couldn’t save your settings right now.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  function handleReset() {
    setSettings(defaultSettings)
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(defaultSettings))
    setSavedSnapshot(JSON.stringify(defaultSettings))
    toast({
      title: "Defaults restored",
      description: "Your settings were reset to RatCat’s default setup.",
    })
  }

  if (isPageLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#ffd063]" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="space-y-8"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="outline" className="border-[#ffd063]/30 bg-[#ffd063]/10 text-[#ffd063]">
                Settings
              </Badge>
              <Badge variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-300">
                Saved on this device
              </Badge>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-white">Settings</h1>
            <p className="max-w-2xl text-zinc-400">
              Tune notifications, room defaults, privacy, and playback so every watch session feels like yours.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"
            >
              Reset to defaults
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save settings
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="rounded-2xl bg-[#ffd063]/10 p-3">
                <Bell className="h-5 w-5 text-[#ffd063]" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Notifications</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {Object.values(settings.notifications).filter(Boolean).length} active alerts
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="rounded-2xl bg-[#00a6ff]/10 p-3">
                <Shield className="h-5 w-5 text-[#00a6ff]" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Privacy</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {settings.privacy.publicProfile ? "Public profile" : "Private-first account"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="rounded-2xl bg-emerald-500/10 p-3">
                <Film className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Default room setup</p>
                <p className="mt-1 text-lg font-semibold capitalize text-white">
                  {settings.roomDefaults.defaultRoomPrivacy} • {settings.roomDefaults.defaultMaxParticipants} seats
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="experience" className="gap-6">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-zinc-900 p-2 text-zinc-400">
            <TabsTrigger value="experience" className="rounded-xl px-4 py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
              Experience
            </TabsTrigger>
            <TabsTrigger value="privacy" className="rounded-xl px-4 py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
              Privacy
            </TabsTrigger>
            <TabsTrigger value="rooms" className="rounded-xl px-4 py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
              Rooms
            </TabsTrigger>
            <TabsTrigger value="account" className="rounded-xl px-4 py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="experience">
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-[#ffd063]/10 p-3">
                      <Sparkles className="h-5 w-5 text-[#ffd063]" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Watch experience</CardTitle>
                      <CardDescription className="text-zinc-400">
                        Set how RatCat feels during playback and chat.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SettingSwitchRow
                    title="Autoplay shared media"
                    description="Start media immediately when the host begins playback."
                    checked={settings.playback.autoplaySharedMedia}
                    onCheckedChange={(checked) =>
                      updateSection("playback", { ...settings.playback, autoplaySharedMedia: checked })
                    }
                  />
                  <SettingSwitchRow
                    title="Subtitles on by default"
                    description="Enable subtitles automatically when supported media includes them."
                    checked={settings.playback.subtitlesEnabled}
                    onCheckedChange={(checked) =>
                      updateSection("playback", { ...settings.playback, subtitlesEnabled: checked })
                    }
                  />
                  <SettingSwitchRow
                    title="Floating reactions"
                    description="Show playful emoji reactions over the player during live sessions."
                    checked={settings.playback.floatingReactions}
                    onCheckedChange={(checked) =>
                      updateSection("playback", { ...settings.playback, floatingReactions: checked })
                    }
                  />
                  <SettingSwitchRow
                    title="Compact chat layout"
                    description="Tighten spacing in room chat so longer conversations stay visible."
                    checked={settings.playback.compactChat}
                    onCheckedChange={(checked) =>
                      updateSection("playback", { ...settings.playback, compactChat: checked })
                    }
                  />
                </CardContent>
              </Card>

              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-[#00a6ff]/10 p-3">
                      <Bell className="h-5 w-5 text-[#00a6ff]" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Notifications</CardTitle>
                      <CardDescription className="text-zinc-400">
                        Keep the alerts you care about and quiet the rest.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SettingSwitchRow
                    title="Friend requests"
                    description="Be notified when someone wants to connect with you."
                    checked={settings.notifications.friendRequests}
                    onCheckedChange={(checked) =>
                      updateSection("notifications", { ...settings.notifications, friendRequests: checked })
                    }
                  />
                  <SettingSwitchRow
                    title="Room invites"
                    description="Get alerted when someone invites you into a watch space."
                    checked={settings.notifications.roomInvites}
                    onCheckedChange={(checked) =>
                      updateSection("notifications", { ...settings.notifications, roomInvites: checked })
                    }
                  />
                  <SettingSwitchRow
                    title="Live room alerts"
                    description="Hear about spaces that are starting right now."
                    checked={settings.notifications.liveRoomAlerts}
                    onCheckedChange={(checked) =>
                      updateSection("notifications", { ...settings.notifications, liveRoomAlerts: checked })
                    }
                  />
                  <SettingSwitchRow
                    title="Product updates"
                    description="Receive occasional updates about new RatCat features and improvements."
                    checked={settings.notifications.productUpdates}
                    onCheckedChange={(checked) =>
                      updateSection("notifications", { ...settings.notifications, productUpdates: checked })
                    }
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="privacy">
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-[#00a6ff]/10 p-3">
                      <Shield className="h-5 w-5 text-[#00a6ff]" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Privacy controls</CardTitle>
                      <CardDescription className="text-zinc-400">
                        Choose how visible and reachable you are inside RatCat.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SettingSwitchRow
                    title="Show online status"
                    description="Let friends see when you’re active and ready to join a room."
                    checked={settings.privacy.showOnlineStatus}
                    onCheckedChange={(checked) =>
                      updateSection("privacy", { ...settings.privacy, showOnlineStatus: checked })
                    }
                  />
                  <SettingSwitchRow
                    title="Allow friend requests"
                    description="Allow other users to send you new friend requests."
                    checked={settings.privacy.allowFriendRequests}
                    onCheckedChange={(checked) =>
                      updateSection("privacy", { ...settings.privacy, allowFriendRequests: checked })
                    }
                  />
                  <SettingSwitchRow
                    title="Public profile preview"
                    description="Show your name, avatar, and bio to people outside your friends list."
                    checked={settings.privacy.publicProfile}
                    onCheckedChange={(checked) =>
                      updateSection("privacy", { ...settings.privacy, publicProfile: checked })
                    }
                  />
                  <SettingSwitchRow
                    title="Join voice muted"
                    description="Start new spaces muted so you can settle in before speaking."
                    checked={settings.privacy.autoMuteOnJoin}
                    onCheckedChange={(checked) =>
                      updateSection("privacy", { ...settings.privacy, autoMuteOnJoin: checked })
                    }
                  />
                </CardContent>
              </Card>

              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-zinc-800 p-3">
                      <Eye className="h-5 w-5 text-zinc-200" />
                    </div>
                    <div>
                      <CardTitle className="text-white">What people can see</CardTitle>
                      <CardDescription className="text-zinc-400">
                        A quick snapshot of your current visibility.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-zinc-300">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                    <p className="font-medium text-white">Profile visibility</p>
                    <p className="mt-2 text-zinc-400">
                      {settings.privacy.publicProfile
                        ? "Your profile can be previewed by more users in RatCat."
                        : "Only friends and room participants will see your richer profile details."}
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                    <p className="font-medium text-white">Connection access</p>
                    <p className="mt-2 text-zinc-400">
                      {settings.privacy.allowFriendRequests
                        ? "People can send you requests to connect."
                        : "New friend requests are currently blocked."}
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                    <p className="font-medium text-white">Presence</p>
                    <p className="mt-2 text-zinc-400">
                      {settings.privacy.showOnlineStatus
                        ? "Your active status is visible to friends."
                        : "Your status stays hidden while you browse or watch."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rooms">
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-emerald-500/10 p-3">
                      <MonitorPlay className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Room defaults</CardTitle>
                      <CardDescription className="text-zinc-400">
                        Preselect the setup you want whenever you create a new space.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SettingSelectRow
                    title="Default room privacy"
                    description="Choose whether new spaces start invite-only or public."
                    value={settings.roomDefaults.defaultRoomPrivacy}
                    onValueChange={(value) =>
                      updateSection("roomDefaults", {
                        ...settings.roomDefaults,
                        defaultRoomPrivacy: value as SettingsState["roomDefaults"]["defaultRoomPrivacy"],
                      })
                    }
                    options={[
                      { label: "Private", value: "private" },
                      { label: "Public", value: "public" },
                    ]}
                  />
                  <SettingSelectRow
                    title="Default room theme"
                    description="Pick the style RatCat should preselect for your next room."
                    value={settings.roomDefaults.defaultTheme}
                    onValueChange={(value) =>
                      updateSection("roomDefaults", {
                        ...settings.roomDefaults,
                        defaultTheme: value as SettingsState["roomDefaults"]["defaultTheme"],
                      })
                    }
                    options={[
                      { label: "Neutral", value: "neutral" },
                      { label: "Rat Den", value: "rat_den" },
                      { label: "Cat Lounge", value: "cat_lounge" },
                    ]}
                  />
                  <SettingSelectRow
                    title="Default room capacity"
                    description="Set the starting participant limit for newly created spaces."
                    value={settings.roomDefaults.defaultMaxParticipants}
                    onValueChange={(value) =>
                      updateSection("roomDefaults", {
                        ...settings.roomDefaults,
                        defaultMaxParticipants: value as SettingsState["roomDefaults"]["defaultMaxParticipants"],
                      })
                    }
                    options={[
                      { label: "10 people", value: "10" },
                      { label: "25 people", value: "25" },
                      { label: "50 people", value: "50" },
                    ]}
                  />
                  <SettingSelectRow
                    title="Start page after sign-in"
                    description="Choose which screen you want to land on first after login."
                    value={settings.roomDefaults.startPage}
                    onValueChange={(value) =>
                      updateSection("roomDefaults", {
                        ...settings.roomDefaults,
                        startPage: value as SettingsState["roomDefaults"]["startPage"],
                      })
                    }
                    options={[
                      { label: "Dashboard", value: "dashboard" },
                      { label: "My Spaces", value: "rooms" },
                      { label: "Friends", value: "friends" },
                      { label: "Profile", value: "profile" },
                    ]}
                  />
                </CardContent>
              </Card>

              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-zinc-800 p-3">
                      <Clock3 className="h-5 w-5 text-zinc-200" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Current defaults</CardTitle>
                      <CardDescription className="text-zinc-400">
                        A quick summary of how new spaces will start.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    ["Privacy", settings.roomDefaults.defaultRoomPrivacy],
                    ["Theme", settings.roomDefaults.defaultTheme.replace("_", " ")],
                    ["Capacity", `${settings.roomDefaults.defaultMaxParticipants} people`],
                    ["Start page", settings.roomDefaults.startPage],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                      <span className="text-sm text-zinc-400">{label}</span>
                      <span className="text-sm font-medium capitalize text-white">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="account">
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border border-zinc-700">
                      <AvatarImage src={profile?.image || session?.user?.image || undefined} alt={profile?.name || "User"} />
                      <AvatarFallback className="bg-gradient-to-br from-[#ffd063] to-[#00a6ff] text-base font-bold text-black">
                        {(profile?.name || session?.user?.name || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-white">
                        {profile?.name || session?.user?.name || "RatCat user"}
                      </CardTitle>
                      <CardDescription className="mt-1 text-zinc-400">
                        {profile?.email || session?.user?.email || "No email available"}
                      </CardDescription>
                      {profile?.username ? (
                        <p className="mt-2 text-sm text-[#ffd063]">@{profile.username}</p>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                      <span className="text-sm text-zinc-400">Member since</span>
                      <span className="text-sm text-white">
                        {profile?.createdAt
                          ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Recently"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                      <span className="text-sm text-zinc-400">Sign-in method</span>
                      <span className="text-sm text-white">OAuth or credentials</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                      <span className="text-sm text-zinc-400">Profile setup</span>
                      <span className="text-sm text-white">{profile?.bio ? "Customized" : "Basic"}</span>
                    </div>
                  </div>

                  <Separator className="bg-zinc-800" />

                  <div className="flex flex-wrap gap-3">
                    <Button asChild variant="outline" className="border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800">
                      <Link href="/profile">
                        <UserCircle className="h-4 w-4" />
                        Edit profile
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-950 bg-zinc-900">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-red-500/10 p-3">
                      <Settings2 className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Good to know</CardTitle>
                      <CardDescription className="text-zinc-400">
                        A couple of limits in the current settings system.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-6 text-zinc-300">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                    These settings are stored in your browser on this device right now. If you want them to sync across devices,
                    the next step is adding a persisted settings model and API.
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                    Profile identity is already backed by your account, so name, username, and bio still live in the existing
                    profile flow.
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
