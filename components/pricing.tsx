"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

const plans = [
  {
    name: "Free",
    description: "Perfect for casual watch parties with friends",
    price: { monthly: 0, yearly: 0 },
    features: [
      "Up to 10 participants per room",
      "3 rooms per day",
      "720p playback",
      "YouTube link support",
      "Basic text chat",
      "Standard voice chat",
      "Community support",
    ],
    cta: "Start Watching Free",
    highlighted: false,
  },
  {
    name: "Premium",
    description: "For movie lovers who want the ultimate experience",
    price: { monthly: 4.99, yearly: 3.99 },
    features: [
      "Up to 50 participants",
      "Unlimited rooms",
      "4K + 8K playback",
      "File uploads (50GB storage)",
      "All media sources supported",
      "Spatial audio",
      "Custom room themes",
      "Ad-free experience",
      "Priority support",
      "Subtitle auto-fetch",
    ],
    cta: "Go Premium",
    highlighted: true,
  },
]

function BorderBeam() {
  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
      <div
        className="absolute w-24 h-24 bg-[#ffd063]/30 blur-xl border-beam"
        style={{
          offsetPath: "rect(0 100% 100% 0 round 16px)",
        }}
      />
    </div>
  )
}

export function Pricing() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")

  return (
    <section id="pricing" className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Watch for free, upgrade for{" "}
            <span className="gradient-text">more</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto mb-8">
            No hidden fees. No credit card required. Start watching together in seconds.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center p-1 rounded-full bg-zinc-900 border border-zinc-800">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`relative px-4 py-2 text-sm font-medium rounded-full transition-colors ${billingCycle === "monthly" ? "text-white" : "text-zinc-400"
                }`}
            >
              {billingCycle === "monthly" && (
                <motion.div
                  layoutId="billing-toggle"
                  className="absolute inset-0 bg-zinc-800 rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10">Monthly</span>
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`relative px-4 py-2 text-sm font-medium rounded-full transition-colors ${billingCycle === "yearly" ? "text-white" : "text-zinc-400"
                }`}
            >
              {billingCycle === "yearly" && (
                <motion.div
                  layoutId="billing-toggle"
                  className="absolute inset-0 bg-zinc-800 rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10">Yearly</span>
              <span className="relative z-10 ml-2 px-2 py-0.5 text-xs bg-[#ffd063]/20 text-[#ffd063] rounded-full">
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.15 }}
              className={`relative p-8 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${plan.highlighted
                  ? "bg-zinc-900 border-[#ffd063]/30"
                  : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-600"
                }`}
            >
              {plan.highlighted && <BorderBeam />}

              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#ffd063] to-[#ffda7a] text-black text-xs font-medium rounded-full">
                  🍿 Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                <p className="text-zinc-400 text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  {plan.price.monthly === 0 ? (
                    <span className="text-4xl font-bold text-white">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-white">
                        ${plan.price[billingCycle]}
                      </span>
                      <span className="text-zinc-400 text-sm">/month</span>
                    </>
                  )}
                </div>
                {billingCycle === "yearly" && plan.price.yearly > 0 && (
                  <p className="text-xs text-zinc-500 mt-1">
                    Billed annually (${(plan.price.yearly * 12).toFixed(2)}/year)
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-zinc-300">
                    <Check
                      className={`w-4 h-4 shrink-0 ${plan.highlighted ? "text-[#ffd063]" : "text-emerald-500"
                        }`}
                      strokeWidth={1.5}
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full rounded-full ${plan.highlighted
                    ? "shimmer-btn bg-gradient-to-r from-[#ffd063] to-[#ffda7a] text-black hover:brightness-110 border-0"
                    : "bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700"
                  }`}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
