'use client'

import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
}

export default function LandingPage() {
  return (
    <main className="min-h-screen">

      {/* 1. Hero */}
      <section className="bg-dark-surface min-h-screen flex flex-col items-center justify-center px-6 py-24 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="max-w-2xl mx-auto"
        >
          <motion.div variants={fadeUp} className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 rounded-full bg-accent-green flex items-center justify-center mr-4">
              <span className="font-display text-2xl text-bg-primary font-bold">P</span>
            </div>
            <span className="font-display text-3xl text-bg-primary font-bold">WanderPin</span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="font-display text-5xl md:text-7xl text-bg-primary font-bold leading-tight mb-6">
            Save what you<br />
            <span className="italic text-accent-green-light">scroll past.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="font-body text-lg text-text-tertiary max-w-lg mx-auto mb-12 leading-relaxed">
            Share a travel reel from Instagram. A pin drops on your personal world map.
            Chat with AI to plan your next trip — using only places you actually discovered.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={process.env.NEXT_PUBLIC_APP_STORE_URL || '#'}
              className="bg-accent-green text-white font-body font-medium px-8 py-4 rounded-full hover:bg-opacity-90 transition-all"
            >
              Download for iOS
            </a>
            <a
              href={process.env.NEXT_PUBLIC_PLAY_STORE_URL || '#'}
              className="border border-border-medium text-bg-primary font-body font-medium px-8 py-4 rounded-full hover:border-accent-green-light transition-all"
            >
              Get it on Android
            </a>
          </motion.div>
        </motion.div>

        {/* Mock map visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-20 w-full max-w-3xl mx-auto h-72 bg-dark-secondary rounded-2xl border border-border-medium flex items-center justify-center relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #2D6A4F 0%, transparent 50%), radial-gradient(circle at 70% 30%, #52B788 0%, transparent 40%)' }}
          />
          {/* Mock pins */}
          {[
            { top: '35%', left: '28%', color: 'bg-accent-green' },
            { top: '55%', left: '65%', color: 'bg-accent-green' },
            { top: '25%', left: '55%', color: 'bg-accent-amber' },
            { top: '60%', left: '40%', color: 'bg-accent-green-light' },
          ].map((pin, i) => (
            <div
              key={i}
              className={`absolute w-4 h-4 ${pin.color} rounded-full shadow-lg`}
              style={{ top: pin.top, left: pin.left }}
            />
          ))}
          <p className="font-body text-sm text-text-tertiary relative z-10">Your personal travel map</p>
        </motion.div>
      </section>

      {/* 2. Problem */}
      <section className="bg-bg-primary py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-display text-4xl md:text-5xl font-bold text-text-primary mb-6"
          >
            You've saved 200 reels.<br />
            <span className="italic text-text-secondary">You remember none of them.</span>
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-body text-lg text-text-secondary mb-16 max-w-xl mx-auto"
          >
            Instagram is a discovery engine with no memory. WanderPin gives your travel discoveries a permanent home.
          </motion.p>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { icon: '😩', title: 'Saved in collections, lost forever', desc: 'Instagram collections are a graveyard. You save, you forget, you never act.' },
              { icon: '🗺️', title: 'No spatial context', desc: 'Scattered in your head. Which places are close to each other? Nobody knows.' },
              { icon: '🤷', title: 'Planning starts from scratch', desc: 'Every trip, you google the same things again instead of using what you already found.' },
            ].map((item) => (
              <motion.div key={item.title} variants={fadeUp} className="bg-bg-secondary rounded-2xl p-8 text-left border border-border-light">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-body font-medium text-lg text-text-primary mb-2">{item.title}</h3>
                <p className="font-body text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 3. How it works */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-display text-4xl md:text-5xl font-bold text-text-primary text-center mb-16"
          >
            How it works
          </motion.h2>

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
                title: 'Share the Reel',
                desc: 'See a travel reel on Instagram. Tap Share → select WanderPin. That\'s it.',
              },
              {
                step: '02',
                icon: '📍',
                title: 'Pin drops on your map',
                desc: 'AI listens to the audio and reads the caption to extract the exact location. A pin drops on your personal world map.',
              },
              {
                step: '03',
                icon: '🗺️',
                title: 'Chat to plan your trip',
                desc: 'Tell WanderPin where you want to go. It builds a day-by-day itinerary using only your saved pins — not generic Google results.',
              },
            ].map((item) => (
              <motion.div key={item.step} variants={fadeUp} className="bg-bg-primary rounded-2xl p-8 border border-border-light">
                <div className="font-mono text-xs text-accent-green mb-4 tracking-widest">{item.step}</div>
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-body font-medium text-xl text-text-primary mb-3">{item.title}</h3>
                <p className="font-body text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 4. Map showcase */}
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
            className="font-body text-text-tertiary text-center mb-16"
          >
            Every reel you share becomes a glowing pin on your personal map.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="w-full h-96 bg-dark-secondary rounded-2xl border border-border-medium relative overflow-hidden flex items-center justify-center"
          >
            <div className="absolute inset-0"
              style={{ backgroundImage: 'radial-gradient(ellipse at 40% 60%, rgba(45,106,79,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(82,183,136,0.1) 0%, transparent 50%)' }}
            />
            {/* Scattered pins across India region */}
            {[
              { top: '30%', left: '45%', label: 'Dawki', color: '#2D6A4F' },
              { top: '20%', left: '35%', label: 'Kasol', color: '#2D6A4F' },
              { top: '40%', left: '30%', label: 'Jaisalmer', color: '#C4862A' },
              { top: '65%', left: '45%', label: 'Munnar', color: '#52B788' },
              { top: '55%', left: '60%', label: 'Alleppey', color: '#2D6A4F' },
              { top: '25%', left: '60%', label: 'Ziro', color: '#2D6A4F' },
            ].map((pin) => (
              <div key={pin.label} className="absolute flex flex-col items-center" style={{ top: pin.top, left: pin.left }}>
                <div className="w-3 h-3 rounded-full border-2 border-bg-primary" style={{ backgroundColor: pin.color, boxShadow: `0 0 12px ${pin.color}80` }} />
                <span className="font-mono text-xs mt-1 text-bg-primary opacity-60">{pin.label}</span>
              </div>
            ))}
            <p className="font-body text-sm text-text-tertiary relative z-10">India — your personal travel map</p>
          </motion.div>
        </div>
      </section>

      {/* 5. India-first */}
      <section className="bg-bg-primary py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-16">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-text-primary mb-4">
                Built for Indian travelers
              </h2>
              <p className="font-body text-lg text-text-secondary max-w-xl mx-auto">
                From the crystal waters of Dawki to the sand dunes of Jaisalmer — WanderPin understands India's travel landscape.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { region: 'Northeast', places: 'Meghalaya · Assam · Arunachal', emoji: '🌿' },
                { region: 'Himachal', places: 'Kasol · Jibhi · Tirthan', emoji: '⛰️' },
                { region: 'Rajasthan', places: 'Jaisalmer · Bundi · Sam', emoji: '🐪' },
                { region: 'Kerala', places: 'Munnar · Alleppey · Varkala', emoji: '🌴' },
                { region: 'Goa', places: 'Agonda · Galgibaga · Dudhsagar', emoji: '🌊' },
                { region: 'Uttarakhand', places: 'Chopta · Munsiyari · Har Ki Dun', emoji: '🏔️' },
                { region: 'Andaman', places: 'Havelock · Neil · Baratang', emoji: '🐠' },
                { region: 'Sikkim', places: 'Gurudongmar · Yumthang', emoji: '🏔️' },
              ].map((item) => (
                <div key={item.region} className="bg-bg-secondary rounded-xl p-5 border border-border-light">
                  <div className="text-2xl mb-2">{item.emoji}</div>
                  <div className="font-body font-medium text-text-primary text-sm">{item.region}</div>
                  <div className="font-body text-text-tertiary text-xs mt-1 leading-relaxed">{item.places}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="bg-dark-surface py-12 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-green flex items-center justify-center">
              <span className="font-display text-sm text-bg-primary font-bold">P</span>
            </div>
            <span className="font-display text-xl text-bg-primary font-bold">WanderPin</span>
          </div>
          <p className="font-body text-sm text-text-tertiary">Made with ❤️ for Indian travelers</p>
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
