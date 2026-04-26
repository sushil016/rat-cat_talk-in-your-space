import { SmoothScroll } from "@/components/smooth-scroll"
import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { RecentPublicRooms } from "@/components/recent-public-rooms"
import { ExploreFeatures } from "@/components/explore-features"
import { LogoMarquee } from "@/components/logo-marquee"
import { BentoGrid } from "@/components/bento-grid"
import { HowItWorks } from "@/components/how-it-works"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <SmoothScroll>
      <main className="min-h-screen">
        <Navbar />
        <Hero />
        <RecentPublicRooms />
        <ExploreFeatures />
        <LogoMarquee />
        <BentoGrid />
        <HowItWorks />
        <Footer />
      </main>
    </SmoothScroll>
  )
}
