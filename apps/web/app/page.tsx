'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Image from 'next/image'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: 'easeOut' } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
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
    a: "Anywhere on earth. Japan, Morocco, Patagonia, Iceland — every pin lands on a single world map that's entirely yours.",
  },
  {
    q: "Is it free?",
    a: "Yes, pinning places is free forever. The AI trip planner is included in the free plan with generous limits.",
  },
]

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <main className="min-h-screen">

      {/* ── 1. Hero ── */}
      <section className="bg-dark-surface min-h-screen flex flex-col items-center justify-center px-6 py-24 text-center relative overflow-hidden">
        {/* subtle background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 30% 40%, rgba(45,106,79,0.18) 0%, transparent 55%), radial-gradient(ellipse at 70% 60%, rgba(82,183,136,0.10) 0%, transparent 50%)',
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
            <Image src="/logo.png" alt="WanderPin" width={52} height={52} className="rounded-full mr-3" />
            <span className="font-display text-2xl text-bg-primary font-bold tracking-tight">WanderPin</span>
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
            That café in Tokyo. The waterfall in Iceland. The village in Portugal.
            <br />
            Stop losing the places that make you stop scrolling.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <a
              href={process.env.NEXT_PUBLIC_APP_STORE_URL || '#'}
              className="bg-accent-green text-white font-body font-medium px-8 py-4 rounded-full hover:bg-opacity-90 transition-all shadow-lg shadow-accent-green/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              Download for iOS
            </a>
            <a
              href={process.env.NEXT_PUBLIC_PLAY_STORE_URL || '#'}
              className="border border-border-medium text-bg-primary font-body font-medium px-8 py-4 rounded-full hover:border-accent-green-light transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Get it on Android
            </a>
          </motion.div>

          <motion.p variants={fadeUp} className="font-body text-xs text-text-tertiary opacity-60">
            Free to download · No credit card
          </motion.p>
        </motion.div>

        {/* World map mockup */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.9 }}
          className="mt-20 w-full max-w-3xl mx-auto h-72 bg-dark-secondary rounded-2xl border border-border-medium relative overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 35% 50%, #2D6A4F 0%, transparent 45%), radial-gradient(circle at 68% 35%, #52B788 0%, transparent 35%), radial-gradient(circle at 55% 70%, #2D6A4F 0%, transparent 30%)',
            }}
          />
          {[
            { top: '28%', left: '22%', label: 'Lisbon', color: '#52B788' },
            { top: '20%', left: '48%', label: 'Iceland', color: '#2D6A4F' },
            { top: '38%', left: '65%', label: 'Kyoto', color: '#2D6A4F' },
            { top: '58%', left: '35%', label: 'Morocco', color: '#C4862A' },
            { top: '68%', left: '55%', label: 'Bali', color: '#52B788' },
            { top: '75%', left: '25%', label: 'Patagonia', color: '#2D6A4F' },
            { top: '32%', left: '80%', label: 'Hokkaido', color: '#2D6A4F' },
          ].map((pin) => (
            <div
              key={pin.label}
              className="absolute flex flex-col items-center"
              style={{ top: pin.top, left: pin.left }}
            >
              <div
                className="w-3 h-3 rounded-full border-2 border-bg-primary"
                style={{ backgroundColor: pin.color, boxShadow: `0 0 10px ${pin.color}80` }}
              />
              <span className="font-mono text-xs mt-1 text-bg-primary opacity-50">{pin.label}</span>
            </div>
          ))}
          <p className="absolute bottom-4 right-4 font-body text-xs text-text-tertiary opacity-40">
            Your world. Your pins.
          </p>
        </motion.div>
      </section>

      {/* ── 2. Problem ── */}
      <section className="bg-bg-primary py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-display text-4xl md:text-5xl font-bold text-text-primary mb-6"
          >
            You've scrolled past<br />
            <span className="italic text-text-secondary">a thousand beautiful places.</span>
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-body text-lg text-text-secondary mb-16 max-w-xl mx-auto"
          >
            You'll actually visit three. Not because you don't want to go — because you can't find them again when it matters.
          </motion.p>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: '😩',
                title: 'Saved and forgotten',
                desc: 'Saved folders are a graveyard. You drop things in and never go back.',
              },
              {
                icon: '🗺️',
                title: 'No sense of place',
                desc: "Is Kyoto near Osaka? Is that Moroccan riad in the north or south? You have no idea until you're Googling for the fifth time.",
              },
              {
                icon: '🤷',
                title: 'Planning from zero',
                desc: 'Every trip starts the same way — blank page, Google, Reddit. Like the last year of discovery never happened.',
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className="bg-bg-secondary rounded-2xl p-8 text-left border border-border-light"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-body font-medium text-lg text-text-primary mb-2">{item.title}</h3>
                <p className="font-body text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 3. How it works ── */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-display text-4xl md:text-5xl font-bold text-text-primary text-center mb-4"
          >
            Three taps. That's it.
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-body text-lg text-text-secondary text-center mb-16 max-w-md mx-auto"
          >
            No typing, no copy-pasting, no searching. Just share and move on.
          </motion.p>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                step: '01',
                icon: '📲',
                title: 'See it. Share it.',
                desc: "A reel stops you mid-scroll. Tap the share button and pick WanderPin. Done. Keep scrolling.",
              },
              {
                step: '02',
                icon: '📍',
                title: 'It lands on your map.',
                desc: "WanderPin figures out exactly where that place is — and drops a pin on your personal world map. No searching, no typing.",
              },
              {
                step: '03',
                icon: '✈️',
                title: "Plan when you're ready.",
                desc: "Tell WanderPin where you want to go. It builds a real itinerary from your actual saved places — not generic tourist lists.",
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                className="bg-bg-primary rounded-2xl p-8 border border-border-light"
              >
                <div className="font-mono text-xs text-accent-green mb-4 tracking-widest">{item.step}</div>
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-body font-medium text-xl text-text-primary mb-3">{item.title}</h3>
                <p className="font-body text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 4. Map showcase ── */}
      <section className="bg-dark-surface py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-display text-4xl text-bg-primary font-bold text-center mb-4"
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
            Every place you've ever stopped scrolling for — finally in one place you can actually use.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="w-full h-96 bg-dark-secondary rounded-2xl border border-border-medium relative overflow-hidden flex items-end justify-end p-4"
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(ellipse at 40% 60%, rgba(45,106,79,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(82,183,136,0.10) 0%, transparent 50%)',
              }}
            />
            {[
              { top: '22%', left: '18%', label: 'Faroe Islands', color: '#52B788' },
              { top: '30%', left: '42%', label: 'Amalfi', color: '#2D6A4F' },
              { top: '18%', left: '62%', label: 'Cappadocia', color: '#C4862A' },
              { top: '48%', left: '72%', label: 'Kyoto', color: '#2D6A4F' },
              { top: '60%', left: '58%', label: 'Bali', color: '#52B788' },
              { top: '70%', left: '30%', label: 'Patagonia', color: '#2D6A4F' },
              { top: '40%', left: '25%', label: 'Lisbon', color: '#2D6A4F' },
              { top: '55%', left: '48%', label: 'Zanzibar', color: '#C4862A' },
            ].map((pin) => (
              <div
                key={pin.label}
                className="absolute flex flex-col items-center"
                style={{ top: pin.top, left: pin.left }}
              >
                <div
                  className="w-3 h-3 rounded-full border-2 border-bg-primary"
                  style={{ backgroundColor: pin.color, boxShadow: `0 0 12px ${pin.color}80` }}
                />
                <span className="font-mono text-xs mt-1 text-bg-primary opacity-55">{pin.label}</span>
              </div>
            ))}
            <span className="font-mono text-xs text-text-tertiary opacity-40 relative z-10">wanderpin.app</span>
          </motion.div>
        </div>
      </section>

      {/* ── 5. Testimonials ── */}
      <section className="bg-bg-primary py-24 px-6">
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
            className="grid md:grid-cols-3 gap-8"
          >
            {testimonials.map((t) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                className="bg-white rounded-2xl p-8 border border-border-light shadow-card flex flex-col"
              >
                <p className="font-body text-sm text-text-primary leading-relaxed flex-1 mb-6">
                  "{t.quote}"
                </p>
                <div>
                  <div className="font-body font-medium text-text-primary text-sm">{t.name}</div>
                  <div className="font-body text-xs text-text-tertiary mt-0.5">{t.detail}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 6. FAQ ── */}
      <section className="bg-bg-secondary py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-display text-4xl font-bold text-text-primary text-center mb-12"
          >
            Good questions
          </motion.h2>

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
                className="bg-white rounded-xl border border-border-light overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 group"
                >
                  <span className="font-body font-medium text-text-primary text-sm">{faq.q}</span>
                  <span className="text-text-tertiary flex-shrink-0 transition-transform duration-200" style={{ transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="font-body text-sm text-text-secondary leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 7. Final CTA ── */}
      <section className="bg-dark-surface py-32 px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 50% 50%, rgba(45,106,79,0.22) 0%, transparent 65%)',
          }}
        />
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
            You've already discovered the places. Time to actually go.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={process.env.NEXT_PUBLIC_APP_STORE_URL || '#'}
              className="bg-accent-green text-white font-body font-medium px-10 py-4 rounded-full hover:bg-opacity-90 transition-all shadow-lg shadow-accent-green/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              Download for iOS
            </a>
            <a
              href={process.env.NEXT_PUBLIC_PLAY_STORE_URL || '#'}
              className="border border-border-medium text-bg-primary font-body font-medium px-10 py-4 rounded-full hover:border-accent-green-light transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Get it on Android
            </a>
          </motion.div>
          <motion.p variants={fadeUp} className="font-body text-xs text-text-tertiary mt-6 opacity-50">
            Free · Works with Instagram · More platforms coming soon
          </motion.p>
        </motion.div>
      </section>

      {/* ── 8. Footer ── */}
      <footer className="bg-dark-surface border-t border-border-medium py-12 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="WanderPin" width={32} height={32} className="rounded-full" />
            <span className="font-display text-xl text-bg-primary font-bold">WanderPin</span>
          </div>
          <p className="font-body text-sm text-text-tertiary">Made for curious travelers, everywhere.</p>
          <div className="flex gap-6">
            <a href="#" className="font-body text-sm text-text-tertiary hover:text-text-secondary transition-colors">Privacy</a>
            <a href="#" className="font-body text-sm text-text-tertiary hover:text-text-secondary transition-colors">Terms</a>
            <a href="#" className="font-body text-sm text-text-tertiary hover:text-text-secondary transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </main>
  )
}
