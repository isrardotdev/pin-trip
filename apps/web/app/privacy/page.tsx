export const metadata = {
  title: 'Privacy Policy — WanderPin',
  description: 'How WanderPin collects, uses, and protects your data.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <a
          href="/"
          className="text-sm font-body text-text-secondary hover:text-text-primary mb-8 inline-block"
        >
          ← WanderPin
        </a>

        <h1 className="font-display text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-text-secondary text-sm mb-10">Last updated: July 1, 2026</p>

        <section className="space-y-8 font-body text-base leading-relaxed">

          <div>
            <h2 className="font-display text-xl font-bold mb-3">What we collect</h2>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              <li><span className="text-text-primary font-medium">Email address</span> — used to create and identify your account.</li>
              <li><span className="text-text-primary font-medium">Places you save</span> — name, city, country, coordinates, and notes for each pin you create.</li>
              <li><span className="text-text-primary font-medium">Reel URLs</span> — submitted when you share a travel video to WanderPin so we can extract the location.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">How we use your data</h2>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              <li>To show your saved places on your personal map.</li>
              <li>To generate travel itineraries using the AI planner.</li>
              <li>We do not sell your data to third parties.</li>
              <li>We do not use your data for advertising.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">Third-party AI processing</h2>
            <p className="text-text-secondary">
              When you use the AI Planner, the names and locations of your saved places are sent to{' '}
              <span className="text-text-primary">Google Gemini</span> to generate itinerary suggestions.
              No personally identifiable information (email, account details) is included in these requests.
              Google&apos;s data handling is governed by the{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-green underline"
              >
                Google Privacy Policy
              </a>
              .
            </p>
            <p className="text-text-secondary mt-3">
              When you share a reel URL, the audio from that video may be transcribed using{' '}
              <span className="text-text-primary">Groq (Whisper)</span> to identify the location.
              Audio is processed transiently and not stored after transcription.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">Location data</h2>
            <p className="text-text-secondary">
              WanderPin does not access your device&apos;s GPS or location. All place coordinates in the
              app come from places you explicitly save — extracted from reels you share or entered manually.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">Data retention</h2>
            <p className="text-text-secondary">
              Your data is stored as long as your account is active. You can delete all your pins from
              the Profile screen in the app. To delete your account and all associated data, contact us
              at the address below.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">Children</h2>
            <p className="text-text-secondary">
              WanderPin is not directed at children under 13. We do not knowingly collect data from
              children under 13.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">Contact</h2>
            <p className="text-text-secondary">
              Questions about this policy:{' '}
              <a href="mailto:privacy@wanderpin.app" className="text-accent-green underline">
                privacy@wanderpin.app
              </a>
            </p>
          </div>

        </section>
      </div>
    </main>
  )
}
