'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Image from 'next/image'
import {
  Bookmark,
  MapPinOff,
  RotateCcw,
  Share2,
  MapPin,
  MessageSquareText,
  Quote,
  ChevronDown,
  Smartphone,
  Globe,
  Sparkles,
  Navigation,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: 'easeOut' } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
}

const testimonials = [
  {
    quote: "I used to screenshot reels and forget about them. Now I have 80 pins across 14 countries. My Southeast Asia trip next month is basically already planned.",
    name: "Mia K.",
    detail: "Travelled to 23 countries",
  },
  {
    quote: "The AI built me a 10-day Japan itinerary from the places I'd saved over a year. It knew which ones were close to each other. I would never have figured that out myself.",
    name: "Tom R.",
    detail: "Based in London",
  },
  {
    quote: "I'm not a planner. I just share every beautiful reel I see and forget about it. Then when a trip comes up, WanderPin does the rest.",
    name: "Sara V.",
    detail: "Solo traveller",
  },
]

const faqs = [
  {
    q: "Which apps can I share from?",
    a: "Right now WanderPin works with Instagram Reels. Support for TikTok and YouTube Shorts is coming soon.",
  },
  {
    q: "What if it can't figure out the location?",
    a: "It'll ask you. A simple search bar appears and you can confirm the place in two taps. It almost never happens.",
  },
  {
    q: "Does it work for destinations outside my country?",
    a: "Anywhere on earth. Japan, Morocco, Patagonia, Iceland \u2014 every pin lands on a single world map that's entirely yours.",
  },
  {
    q: "Is it free?",
    a: "Yes, pinning places is free forever. The AI trip planner is included in the free plan with generous limits.",
  },
]

const problemCards = [
  {
    icon: Bookmark,
    title: 'Saved and forgotten',
    desc: 'Saved folders are a graveyard. You drop things in and never go back.',
    gradient: 'from-rose-500/15 to-orange-500/10',
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-600',
    borderColor: 'border-rose-200/60',
  },
  {
    icon: MapPinOff,
    title: 'No sense of place',
    desc: "Is Kyoto near Osaka? Is that Moroccan riad in the north or south? You have no idea until you're Googling for the fifth time.",
    gradient: 'from-amber-500/15 to-yellow-500/10',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600',
    borderColor: 'border-amber-200/60',
  },
  {
    icon: RotateCcw,
    title: 'Planning from zero',
    desc: 'Every trip starts the same way \u2014 blank page, Google, Reddit. Like the last year of discovery never happened.',
    gradient: 'from-blue-500/15 to-indigo-500/10',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600',
    borderColor: 'border-blue-200/60',
  },
]

const steps = [
  {
    icon: Share2,
    title: 'See it. Share it.',
    desc: "A reel stops you mid-scroll. Tap the share button and pick WanderPin. Done. Keep scrolling.",
    gradient: 'from-emerald-500/15 to-teal-500/10',
    iconGradient: 'from-emerald-500 to-teal-600',
  },
  {
    icon: MapPin,
    title: 'It lands on your map.',
    desc: "WanderPin figures out exactly where that place is \u2014 and drops a pin on your personal world map. No searching, no typing.",
    gradient: 'from-accent-green/15 to-emerald-500/10',
    iconGradient: 'from-accent-green to-emerald-600',
  },
  {
    icon: MessageSquareText,
    title: "Plan when you're ready.",
    desc: "Tell WanderPin where you want to go. It builds a real itinerary from your actual saved places \u2014 not generic tourist lists.",
    gradient: 'from-violet-500/15 to-purple-500/10',
    iconGradient: 'from-violet-500 to-purple-600',
  },
]

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <main className="min-h-screen overflow-hidden">

      {/* ── 1. Hero ── */}
      <section className="bg-dark-surface min-h-screen flex flex-col items-center justify-center px-6 py-24 text-center relative overflow-hidden">
        {/* Atmospheric gradient mesh */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 20% 30%, rgba(45,106,79,0.22) 0%, transparent 50%), radial-gradient(ellipse at 75% 55%, rgba(82,183,136,0.14) 0%, transparent 45%), radial-gradient(ellipse at 50% 80%, rgba(196,134,42,0.08) 0%, transparent 40%)',
          }}
        />
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="max-w-2xl mx-auto relative z-10"
        >
          {/* Logo */}
          <motion.div variants={fadeUp} className="flex items-center justify-center mb-10">
            <div className="relative">
              <div className="absolute -inset-1 bg-accent-green/20 rounded-full blur-md" />
              <Image src="/logo.png" alt="WanderPin" width={52} height={52} className="rounded-full relative" />
            </div>
            <span className="font-display text-2xl text-bg-primary font-bold tracking-tight ml-3">WanderPin</span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-display text-5xl md:text-7xl text-bg-primary font-bold leading-tight mb-6"
          >
            Save what you<br />
            <span className="italic text-accent-green-light">scroll past.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="font-body text-lg text-text-tertiary max-w-lg mx-auto mb-10 leading-relaxed"
          >
            That caf&eacute; in Tokyo. The waterfall in Iceland. The village in Portugal.
            <br />
            Stop losing the places that make you stop scrolling.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <a
              href={process.env.NEXT_PUBLIC_APP_STORE_URL || '#'}
              className="group bg-accent-green text-white font-body font-medium px-8 py-4 rounded-full hover:bg-opacity-90 transition-all shadow-lg shadow-accent-green/25 hover:shadow-xl hover:shadow-accent-green/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              Download for iOS
            </a>
            <a
              href={process.env.NEXT_PUBLIC_PLAY_STORE_URL || '#'}
              className="border border-border-medium text-bg-primary font-body font-medium px-8 py-4 rounded-full hover:border-accent-green-light hover:bg-white/5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Get it on Android
            </a>
          </motion.div>

          <motion.p variants={fadeUp} className="font-body text-xs text-text-tertiary opacity-60">
            Free to download &middot; No credit card
          </motion.p>
        </motion.div>

        {/* Phone mockup */}
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.9, ease: 'easeOut' }}
          className="mt-16 relative z-10"
        >
          <div className="relative mx-auto" style={{ width: 280 }}>
            {/* Phone frame */}
            <div className="relative bg-dark-secondary rounded-[2.5rem] p-2 shadow-2xl shadow-black/40 border border-white/10">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-dark-secondary rounded-b-2xl z-20" />
              {/* Screen */}
              <div className="rounded-[2rem] overflow-hidden bg-[#1a1a2e] aspect-[9/19.5] relative">
                {/* Map mockup inside phone */}
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(ellipse at 40% 45%, rgba(45,106,79,0.25) 0%, transparent 55%), radial-gradient(ellipse at 65% 35%, rgba(82,183,136,0.15) 0%, transparent 45%)',
                }}>
                  {/* Simulated map pins */}
                  {[
                    { top: '22%', left: '30%', label: 'Lisbon', color: '#52B788', size: 'w-2.5 h-2.5' },
                    { top: '18%', left: '55%', label: 'Iceland', color: '#2D6A4F', size: 'w-2 h-2' },
                    { top: '35%', left: '70%', label: 'Kyoto', color: '#52B788', size: 'w-2.5 h-2.5' },
                    { top: '50%', left: '40%', label: 'Morocco', color: '#C4862A', size: 'w-2 h-2' },
                    { top: '62%', left: '60%', label: 'Bali', color: '#52B788', size: 'w-2 h-2' },
                    { top: '42%', left: '22%', label: 'Alps', color: '#2D6A4F', size: 'w-2 h-2' },
                  ].map((pin) => (
                    <div
                      key={pin.label}
                      className="absolute flex flex-col items-center"
                      style={{ top: pin.top, left: pin.left }}
                    >
                      <div
                        className={`${pin.size} rounded-full border-[1.5px] border-white/80`}
                        style={{ backgroundColor: pin.color, boxShadow: `0 0 12px ${pin.color}90` }}
                      />
                      <span className="font-mono text-[7px] mt-0.5 text-white/50">{pin.label}</span>
                    </div>
                  ))}
                </div>
                {/* Bottom tab bar mockup */}
                <div className="absolute bottom-0 left-0 right-0 h-14 bg-[#1a1a2e]/90 backdrop-blur-sm border-t border-white/5 flex items-center justify-around px-6">
                  <div className="w-5 h-5 rounded-full bg-accent-green/30 border border-accent-green/50" />
                  <div className="w-5 h-5 rounded-full bg-white/10" />
                  <div className="w-5 h-5 rounded-full bg-white/10" />
                  <div className="w-5 h-5 rounded-full bg-white/10" />
                </div>
                {/* Status bar mockup */}
                <div className="absolute top-7 left-0 right-0 flex justify-between px-6">
                  <span className="text-[8px] text-white/40 font-body">9:41</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-1.5 rounded-sm bg-white/30" />
                    <div className="w-3 h-1.5 rounded-sm bg-white/30" />
                  </div>
                </div>
              </div>
            </div>
            {/* Reflection glow */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-16 bg-accent-green/10 rounded-full blur-2xl" />
          </div>
        </motion.div>
      </section>

      {/* ── 2. Problem ── */}
      <section className="bg-bg-primary py-28 px-6 relative">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mb-4"
          >
            <span className="inline-flex items-center gap-2 font-mono text-xs text-accent-green tracking-widest uppercase bg-accent-green/8 px-4 py-2 rounded-full border border-accent-green/15">
              <Globe size={14} />
              The problem
            </span>
          </motion.div>

          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-display text-4xl md:text-5xl font-bold text-text-primary mb-6"
          >
            You&apos;ve scrolled past<br />
            <span className="italic text-text-secondary">a thousand beautiful places.</span>
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-body text-lg text-text-secondary mb-16 max-w-xl mx-auto leading-relaxed"
          >
            You&apos;ll actually visit three. Not because you don&apos;t want to go &mdash; because you can&apos;t find them again when it matters.
          </motion.p>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6"
          >
            {problemCards.map((item) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.title}
                  variants={scaleIn}
                  className={`group relative bg-white rounded-2xl p-8 text-left border ${item.borderColor} hover:shadow-lg hover:shadow-black/[0.04] transition-all duration-300 hover:-translate-y-1`}
                >
                  {/* Subtle gradient overlay */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative z-10">
                    <div className={`w-12 h-12 ${item.iconBg} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={22} className={item.iconColor} strokeWidth={1.8} />
                    </div>
                    <h3 className="font-body font-medium text-lg text-text-primary mb-2">{item.title}</h3>
                    <p className="font-body text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* ── 3. How it works ── */}
      <section className="bg-bg-primary py-28 px-6 relative overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-4"
          >
            <span className="inline-flex items-center gap-2 font-mono text-xs text-accent-green tracking-widest uppercase bg-accent-green/8 px-4 py-2 rounded-full border border-accent-green/15">
              <Sparkles size={14} />
              How it works
            </span>
          </motion.div>

          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-display text-4xl md:text-5xl font-bold text-text-primary text-center mb-4"
          >
            Three taps. That&apos;s it.
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-body text-lg text-text-secondary text-center mb-20 max-w-md mx-auto"
          >
            No typing, no copy-pasting, no searching. Just share and move on.
          </motion.p>

          {/* Vertical steps timeline */}
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-6 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-[2px] bg-gradient-to-b from-accent-green/30 via-accent-green/15 to-transparent" />

            {steps.map((item, i) => {
              const Icon = item.icon
              const isEven = i % 2 === 0
              return (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-50px' }}
                  variants={fadeUp}
                  className={`relative flex items-start gap-6 md:gap-12 ${i < steps.length - 1 ? 'mb-16' : ''} ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                >
                  {/* Step content */}
                  <div className={`flex-1 pl-16 md:pl-0 ${isEven ? 'md:text-right' : 'md:text-left'}`}>
                    <div className="font-mono text-xs text-accent-green tracking-widest uppercase mb-2">
                      Step {String(i + 1).padStart(2, '0')}
                    </div>
                    <h3 className="font-body font-medium text-xl text-text-primary mb-2">{item.title}</h3>
                    <p className="font-body text-sm text-text-secondary leading-relaxed max-w-sm inline-block">{item.desc}</p>
                  </div>

                  {/* Center node — icon circle on the line */}
                  <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 flex-shrink-0">
                    <div
                      className={`relative w-12 h-12 rounded-full bg-gradient-to-br ${item.iconGradient} flex items-center justify-center shadow-lg ring-4 ring-bg-primary`}
                      style={{ boxShadow: '0 6px 20px -4px rgba(45,106,79,0.3)' }}
                    >
                      <Icon size={20} className="text-white" strokeWidth={1.8} />
                    </div>
                  </div>

                  {/* Spacer for the other side (desktop alternating) */}
                  <div className="hidden md:block flex-1" />
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 4. Map showcase ── */}
      <section className="bg-dark-surface py-28 px-6 relative overflow-hidden">
        {/* Atmospheric glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(ellipse at 30% 50%, rgba(45,106,79,0.12) 0%, transparent 55%), radial-gradient(ellipse at 70% 40%, rgba(82,183,136,0.08) 0%, transparent 50%)',
        }} />

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-4"
          >
            <span className="inline-flex items-center gap-2 font-mono text-xs text-accent-green-light tracking-widest uppercase px-4 py-2 rounded-full border border-accent-green/20 bg-accent-green/5">
              <Navigation size={14} />
              Your map
            </span>
          </motion.div>

          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-display text-4xl md:text-5xl text-bg-primary font-bold text-center mb-4"
          >
            Your travel story,<br />
            <span className="italic text-accent-green-light">mapped.</span>
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-body text-text-tertiary text-center mb-16 max-w-md mx-auto"
          >
            Every place you&apos;ve ever stopped scrolling for &mdash; finally in one place you can actually use.
          </motion.p>

          {/* Map + Phone side by side */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative"
          >
            {/* Large map card */}
            <div className="w-full h-[420px] bg-dark-secondary rounded-3xl border border-white/[0.06] relative overflow-hidden shadow-2xl">
              {/* Map background gradient */}
              <div className="absolute inset-0" style={{
                backgroundImage:
                  'radial-gradient(ellipse at 35% 55%, rgba(45,106,79,0.18) 0%, transparent 55%), radial-gradient(ellipse at 70% 30%, rgba(82,183,136,0.12) 0%, transparent 45%), radial-gradient(ellipse at 55% 75%, rgba(196,134,42,0.06) 0%, transparent 35%)',
              }} />
              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }} />
              {/* Pins with glow effect */}
              {[
                { top: '22%', left: '15%', label: 'Faroe Islands', color: '#52B788', pulse: true },
                { top: '32%', left: '38%', label: 'Amalfi', color: '#2D6A4F', pulse: false },
                { top: '18%', left: '55%', label: 'Cappadocia', color: '#C4862A', pulse: true },
                { top: '45%', left: '72%', label: 'Kyoto', color: '#2D6A4F', pulse: false },
                { top: '60%', left: '58%', label: 'Bali', color: '#52B788', pulse: false },
                { top: '68%', left: '28%', label: 'Patagonia', color: '#2D6A4F', pulse: true },
                { top: '38%', left: '22%', label: 'Lisbon', color: '#52B788', pulse: false },
                { top: '52%', left: '45%', label: 'Zanzibar', color: '#C4862A', pulse: false },
              ].map((pin) => (
                <div
                  key={pin.label}
                  className="absolute flex flex-col items-center group"
                  style={{ top: pin.top, left: pin.left }}
                >
                  {pin.pulse && (
                    <div
                      className="absolute w-6 h-6 rounded-full animate-ping opacity-20"
                      style={{ backgroundColor: pin.color }}
                    />
                  )}
                  <div
                    className="relative w-3.5 h-3.5 rounded-full border-2 border-white/70 transition-transform group-hover:scale-150"
                    style={{ backgroundColor: pin.color, boxShadow: `0 0 16px ${pin.color}90, 0 0 32px ${pin.color}40` }}
                  />
                  <span className="font-mono text-[10px] mt-1.5 text-white/50 whitespace-nowrap">{pin.label}</span>
                </div>
              ))}

              {/* Corner stats */}
              <div className="absolute bottom-5 left-6 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent-green-light" />
                  <span className="font-mono text-[10px] text-white/40">Wishlist</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent-amber" />
                  <span className="font-mono text-[10px] text-white/40">Planning</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent-green" />
                  <span className="font-mono text-[10px] text-white/40">Visited</span>
                </div>
              </div>
              <span className="absolute bottom-5 right-6 font-mono text-[10px] text-white/25">wanderpin.app</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 5. App preview (phone mockups) ── */}
      <section className="bg-bg-primary py-28 px-6 relative overflow-hidden">

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-4"
          >
            <span className="inline-flex items-center gap-2 font-mono text-xs text-accent-green tracking-widest uppercase bg-accent-green/8 px-4 py-2 rounded-full border border-accent-green/15">
              <Smartphone size={14} />
              Inside the app
            </span>
          </motion.div>

          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-display text-4xl md:text-5xl font-bold text-text-primary text-center mb-4"
          >
            Beautiful by default.
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-body text-lg text-text-secondary text-center mb-16 max-w-lg mx-auto"
          >
            A personal world map, AI-powered trip planning, and a curated discover feed. All in one app.
          </motion.p>

          {/* Three phone mockups */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-6"
          >
            {[
              { label: 'Your Map', sublabel: 'Every saved place, pinned', accent: '#2D6A4F' },
              { label: 'AI Planner', sublabel: 'Itineraries from your pins', accent: '#52B788' },
              { label: 'Discover', sublabel: 'Curated destinations', accent: '#C4862A' },
            ].map((screen, i) => (
              <motion.div
                key={screen.label}
                variants={fadeUp}
                className="relative"
                style={{ zIndex: i === 1 ? 10 : 1 }}
              >
                <div className={`relative mx-auto ${i === 1 ? 'scale-105' : 'md:scale-95 md:opacity-90'}`} style={{ width: 220 }}>
                  {/* Phone frame */}
                  <div className="bg-dark-secondary rounded-[2rem] p-1.5 shadow-xl shadow-black/20 border border-white/[0.08]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-dark-secondary rounded-b-xl z-20" />
                    <div className="rounded-[1.75rem] overflow-hidden bg-bg-primary aspect-[9/19.5] relative flex flex-col items-center justify-center">
                      {/* Placeholder screen content */}
                      <div className="w-8 h-8 rounded-xl mb-3 flex items-center justify-center" style={{ backgroundColor: `${screen.accent}20` }}>
                        {i === 0 && <MapPin size={18} style={{ color: screen.accent }} />}
                        {i === 1 && <MessageSquareText size={18} style={{ color: screen.accent }} />}
                        {i === 2 && <Sparkles size={18} style={{ color: screen.accent }} />}
                      </div>
                      <span className="font-body text-xs font-medium text-text-primary">{screen.label}</span>
                      <span className="font-body text-[10px] text-text-tertiary mt-1">{screen.sublabel}</span>
                      {/* Decorative lines representing content */}
                      <div className="mt-4 space-y-2 px-6 w-full">
                        <div className="h-1.5 bg-border-light rounded-full w-full" />
                        <div className="h-1.5 bg-border-light rounded-full w-3/4" />
                        <div className="h-1.5 bg-border-light rounded-full w-5/6" />
                        <div className="h-6 rounded-lg mt-3" style={{ backgroundColor: `${screen.accent}12` }} />
                        <div className="h-6 rounded-lg" style={{ backgroundColor: `${screen.accent}08` }} />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Label below phone */}
                <p className="text-center mt-4 font-body text-sm text-text-secondary font-medium">{screen.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 6. Testimonials ── */}
      <section className="bg-bg-secondary py-28 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-display text-4xl md:text-5xl font-bold text-text-primary text-center mb-4"
          >
            From wanderers like you
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-body text-lg text-text-secondary text-center mb-16 max-w-md mx-auto"
          >
            People who were also losing their discoveries before they found WanderPin.
          </motion.p>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6"
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                variants={scaleIn}
                className="group bg-white rounded-2xl p-8 border border-border-light hover:shadow-lg hover:shadow-black/[0.04] transition-all duration-300 flex flex-col relative overflow-hidden"
              >
                {/* Accent top border */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{
                    background: i === 0
                      ? 'linear-gradient(90deg, #2D6A4F, #52B788)'
                      : i === 1
                        ? 'linear-gradient(90deg, #52B788, #C4862A)'
                        : 'linear-gradient(90deg, #C4862A, #2D6A4F)',
                  }}
                />
                <Quote size={28} className="text-accent-green/15 mb-4 flex-shrink-0" strokeWidth={1.5} />
                <p className="font-body text-sm text-text-primary leading-relaxed flex-1 mb-6">
                  {t.quote}
                </p>
                <div className="flex items-center gap-3">
                  {/* Avatar circle with initial */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-green to-accent-green-light flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-body text-sm font-medium">{t.name[0]}</span>
                  </div>
                  <div>
                    <div className="font-body font-medium text-text-primary text-sm">{t.name}</div>
                    <div className="font-body text-xs text-text-tertiary mt-0.5">{t.detail}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 7. FAQ ── */}
      <section className="bg-bg-primary py-28 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-display text-4xl font-bold text-text-primary text-center mb-4"
          >
            Good questions
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-body text-text-secondary text-center mb-12"
          >
            Everything you need to know before your first pin.
          </motion.p>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="space-y-3"
          >
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-white rounded-xl border border-border-light overflow-hidden hover:border-border-medium transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 group"
                >
                  <span className="font-body font-medium text-text-primary text-sm">{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-text-tertiary flex-shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: openFaq === i ? 200 : 0, opacity: openFaq === i ? 1 : 0 }}
                >
                  <div className="px-6 pb-5">
                    <p className="font-body text-sm text-text-secondary leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 8. Final CTA ── */}
      <section className="bg-dark-surface py-32 px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 40% 40%, rgba(45,106,79,0.25) 0%, transparent 55%), radial-gradient(ellipse at 60% 60%, rgba(82,183,136,0.10) 0%, transparent 45%)',
          }}
        />
        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }} />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="max-w-xl mx-auto relative z-10"
        >
          <motion.h2
            variants={fadeUp}
            className="font-display text-4xl md:text-6xl font-bold text-bg-primary leading-tight mb-6"
          >
            Your next trip is already<br />
            <span className="italic text-accent-green-light">in your feed.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="font-body text-lg text-text-tertiary mb-10 leading-relaxed">
            You&apos;ve already discovered the places. Time to actually go.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={process.env.NEXT_PUBLIC_APP_STORE_URL || '#'}
              className="bg-accent-green text-white font-body font-medium px-10 py-4 rounded-full hover:bg-opacity-90 transition-all shadow-lg shadow-accent-green/25 hover:shadow-xl hover:shadow-accent-green/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              Download for iOS
            </a>
            <a
              href={process.env.NEXT_PUBLIC_PLAY_STORE_URL || '#'}
              className="border border-border-medium text-bg-primary font-body font-medium px-10 py-4 rounded-full hover:border-accent-green-light hover:bg-white/5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Get it on Android
            </a>
          </motion.div>
          <motion.p variants={fadeUp} className="font-body text-xs text-text-tertiary mt-6 opacity-50">
            Free &middot; Works with Instagram &middot; More platforms coming soon
          </motion.p>
        </motion.div>
      </section>

      {/* ── 9. Footer ── */}
      <footer className="bg-dark-surface border-t border-white/[0.06] py-12 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="WanderPin" width={32} height={32} className="rounded-full" />
            <span className="font-display text-xl text-bg-primary font-bold">WanderPin</span>
          </div>
          <p className="font-body text-sm text-text-tertiary">Made for curious travelers, everywhere.</p>
          <div className="flex gap-6">
            <a href="/privacy" className="font-body text-sm text-text-tertiary hover:text-accent-green-light transition-colors">Privacy</a>
            <a href="#" className="font-body text-sm text-text-tertiary hover:text-accent-green-light transition-colors">Terms</a>
            <a href="#" className="font-body text-sm text-text-tertiary hover:text-accent-green-light transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </main>
  )
}
