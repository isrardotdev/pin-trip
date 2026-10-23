'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import {
  Bookmark,
  MapPinOff,
  RotateCcw,
  Share2,
  MapPin,
  MessageSquareText,
  ChevronDown,
  Smartphone,
  Globe,
  Sparkles,
  Navigation,
  Mail,
  X,
} from 'lucide-react'

// lucide-react dropped brand icons a while back — a plain outlined
// camera-square is still instantly recognizable as "Instagram" without
// using their actual protected logo asset.
function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

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

// Android isn't publicly downloadable yet — this button doesn't link anywhere.
// Hovering (or tapping, for touch devices) reveals a custom tooltip pointing
// people to Instagram DMs for beta access, instead of a native `title` tooltip.
function AndroidDownloadButton({ size = 'base' }: { size?: 'base' | 'lg' }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const padding = size === 'lg' ? 'px-10 py-4' : 'px-8 py-4'

  // Mobile browsers simulate a "hover" on the first tap of an element with
  // hover handlers (which opened the tooltip), then fire the click right
  // after — if that click toggled, it closed again immediately, so a second
  // tap was needed to reopen it. Making the click always open (never toggle)
  // fixes that; tapping outside now closes it instead.
  useEffect(() => {
    if (!open) return
    const handleOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', handleOutside)
    return () => document.removeEventListener('click', handleOutside)
  }, [open])

  return (
    <div
      ref={wrapperRef}
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-describedby="android-beta-tooltip"
        className={`group bg-accent-green text-white font-body font-medium ${padding} rounded-full hover:bg-opacity-90 transition-all shadow-lg shadow-accent-green/25 hover:shadow-xl hover:shadow-accent-green/30 hover:scale-[1.02] active:scale-[0.98]`}
      >
        Download for Android
      </button>

      {/* bottom-full + pb-3 (padding, not margin) keeps the hoverable area
          contiguous from button to tooltip — a margin gap here is what was
          causing the tooltip to flicker closed when moving the cursor onto it. */}
      <div
        id="android-beta-tooltip"
        role="tooltip"
        className={`absolute left-1/2 -translate-x-1/2 bottom-full pb-3 w-64 z-30 transition-all duration-200 ${
          open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-1 pointer-events-none'
        }`}
      >
        <div className="relative bg-dark-secondary border border-white/10 rounded-xl px-4 py-3 shadow-xl shadow-black/30 text-center">
          <p className="font-body text-sm text-bg-primary leading-snug">
            Not public yet &mdash; DM us on Instagram{' '}
            <a
              href="https://instagram.com/wanderpin.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-green-light font-medium underline decoration-accent-green-light/40 underline-offset-2 hover:text-white transition-colors"
            >
              @wanderpin.app
            </a>{' '}
            for beta access.
          </p>
          <div className="w-3 h-3 bg-dark-secondary border-r border-b border-white/10 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1.5" />
        </div>
      </div>
    </div>
  )
}

function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Escape-to-close + body scroll lock while the modal is open.
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-dark-surface/70 backdrop-blur-sm px-6"
          role="presentation"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
            className="relative w-full max-w-sm bg-bg-primary rounded-3xl p-8 shadow-2xl shadow-black/40 border border-border-light"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-bg-secondary transition-colors"
            >
              <X size={18} />
            </button>

            <h2 id="contact-modal-title" className="font-display text-2xl font-bold text-text-primary mb-2">
              Get in touch
            </h2>
            <p className="font-body text-sm text-text-secondary mb-8 leading-relaxed">
              Questions, feedback, or want in on the beta? We&apos;d love to hear from you.
            </p>

            <div className="flex flex-col gap-3">
              <a
                href="https://instagram.com/wanderpin.app"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 bg-white rounded-xl px-4 py-3.5 border border-border-light hover:border-accent-green/40 hover:shadow-md hover:shadow-black/[0.04] transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-accent-green/10 flex items-center justify-center text-accent-green flex-shrink-0 group-hover:bg-accent-green group-hover:text-white transition-colors">
                  <InstagramIcon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-body font-medium text-sm text-text-primary">Instagram</div>
                  <div className="font-mono text-xs text-text-tertiary">@wanderpin.app</div>
                </div>
              </a>

              <a
                href="mailto:hello@wanderpin.app"
                className="group flex items-center gap-4 bg-white rounded-xl px-4 py-3.5 border border-border-light hover:border-accent-green/40 hover:shadow-md hover:shadow-black/[0.04] transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-accent-green/10 flex items-center justify-center text-accent-green flex-shrink-0 group-hover:bg-accent-green group-hover:text-white transition-colors">
                  <Mail size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-body font-medium text-sm text-text-primary">Email</div>
                  <div className="font-mono text-xs text-text-tertiary">hello@wanderpin.app</div>
                </div>
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [contactOpen, setContactOpen] = useState(false)

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

          <motion.div variants={fadeUp} className="max-w-xl mx-auto mb-10">
            <p className="font-body text-lg text-text-tertiary leading-relaxed">
              That caf&eacute; in Tokyo. The waterfall in Iceland. The village in Portugal.
            </p>
            <p className="font-body text-lg text-text-tertiary leading-relaxed">
              Stop losing the places that make you stop scrolling.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col items-center gap-3 mb-6">
            <AndroidDownloadButton />
            <span className="font-body text-xs text-text-tertiary opacity-50">iOS &mdash; coming soon</span>
          </motion.div>
        </motion.div>

        {/* Phone mockup — styled like a modern Android phone (punch-hole camera, not a notch) */}
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.9, ease: 'easeOut' }}
          className="mt-16 relative z-10"
        >
          <div className="relative mx-auto" style={{ width: 280, height: 572 }}>
            {/* Phone frame */}
            <div className="relative bg-dark-secondary rounded-[2.2rem] p-2 shadow-2xl shadow-black/40 border border-white/10 w-full h-full">
              {/* Screen — real app screenshot */}
              <div className="rounded-[1.8rem] overflow-hidden bg-bg-primary relative w-full h-full">
                <Image
                  src="/screenshots/hero-map-pins.png"
                  alt="WanderPin's map with saved pins and the pin list below it"
                  fill
                  className="object-cover object-top"
                  sizes="280px"
                  priority
                />
                {/* Punch-hole front camera */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-black/80 border border-white/10 z-20" />
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

          {/* Real map screenshot */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="w-full h-[320px] md:h-[460px] bg-dark-secondary rounded-3xl border border-white/[0.06] relative overflow-hidden shadow-2xl">
              <Image
                src="/screenshots/map-showcase.png"
                alt="A real WanderPin map showing saved pins clustered across a city, pulled straight from the app"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 1024px"
              />
              {/* A few extra pins, purely decorative — no names, just motion to
                  suggest a living map. Styled like the app's real pin markers
                  (white ring + glow) so they read as pins, not stray dots.
                  Positioned down the narrow peninsula strip (roughly 35-55%
                  from the left) running through Mahalakshmi/Kamathipura in
                  this crop — land here is a center column, not the edges. */}
              {[
                { top: '18%', left: '48%', color: '#52B788', delay: '0s' },
                { top: '30%', left: '40%', color: '#C4862A', delay: '0.7s' },
                { top: '58%', left: '48%', color: '#52B788', delay: '1.4s' },
                { top: '85%', left: '38%', color: '#2D6A4F', delay: '2.1s' },
              ].map((dot, i) => (
                <div
                  key={i}
                  className="absolute w-4 h-4 rounded-full border-2 border-white/80 animate-pulse"
                  style={{
                    top: dot.top,
                    left: dot.left,
                    backgroundColor: dot.color,
                    boxShadow: `0 0 14px ${dot.color}, 0 0 28px ${dot.color}80`,
                    animationDelay: dot.delay,
                    animationDuration: '2.6s',
                  }}
                />
              ))}
              {/* Status legend — overlaid as a caption bar, not drawn onto the screenshot itself */}
              <div className="absolute bottom-0 left-0 right-0 bg-dark-surface/90 backdrop-blur-sm border-t border-white/[0.06] py-3 px-6 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent-green-light" />
                  <span className="font-mono text-[10px] text-white/50">Wishlist</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent-amber" />
                  <span className="font-mono text-[10px] text-white/50">Planning</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent-green" />
                  <span className="font-mono text-[10px] text-white/50">Visited</span>
                </div>
              </div>
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
            A personal world map, AI-powered trip planning, and smart location detection. All in one app.
          </motion.p>

          {/* Three phone mockups — real screenshots */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-6"
          >
            {[
              { label: 'Pin Details', sublabel: 'Every saved place, with the source reel', src: '/screenshots/app-pin-detail.png', alt: 'A saved pin’s detail view showing its location on the map and the Instagram reel it came from' },
              { label: 'AI Planner', sublabel: 'Itineraries built from your pins', src: '/screenshots/app-planner.png', alt: 'The AI trip planner chat screen with suggested prompts' },
              { label: 'Smart Detection', sublabel: 'AI finds the place and previews it for you', src: '/screenshots/hero-pin-found.png', alt: 'WanderPin confirming a place it detected from a shared reel' },
            ].map((screen, i) => (
              <motion.div
                key={screen.label}
                variants={fadeUp}
                className="relative"
                style={{ zIndex: i === 1 ? 10 : 1 }}
              >
                <div className={`relative mx-auto ${i === 1 ? 'scale-105' : 'md:scale-95 md:opacity-90'}`} style={{ width: 220, height: 477 }}>
                  {/* Phone frame — Android-style punch-hole camera, not a notch */}
                  <div className="relative bg-dark-secondary rounded-[1.9rem] p-1.5 shadow-xl shadow-black/20 border border-white/[0.08] w-full h-full">
                    <div className="rounded-[1.5rem] overflow-hidden bg-bg-primary relative w-full h-full">
                      <Image
                        src={screen.src}
                        alt={screen.alt}
                        fill
                        className="object-cover object-top"
                        sizes="220px"
                      />
                      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-black/80 border border-white/10 z-20" />
                    </div>
                  </div>
                </div>
                {/* Label below phone */}
                <p className="text-center mt-4 font-body text-sm text-text-primary font-medium">{screen.label}</p>
                <p className="text-center mt-0.5 font-body text-xs text-text-tertiary">{screen.sublabel}</p>
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
          <motion.div variants={fadeUp} className="flex flex-col items-center gap-3">
            <AndroidDownloadButton size="lg" />
            <span className="font-body text-xs text-text-tertiary opacity-50">iOS &mdash; coming soon</span>
          </motion.div>
          <motion.p variants={fadeUp} className="font-body text-xs text-text-tertiary mt-6 opacity-50">
            Works with Instagram &middot; More platforms coming soon
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
            <a href="/terms" className="font-body text-sm text-text-tertiary hover:text-accent-green-light transition-colors">Terms</a>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="font-body text-sm text-text-tertiary hover:text-accent-green-light transition-colors"
            >
              Contact
            </button>
          </div>
        </div>
      </footer>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />

    </main>
  )
}
