export const metadata = {
  title: 'Privacy Policy',
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
        <p className="text-text-secondary text-sm mb-10">Last updated: October 26, 2026</p>

        <section className="space-y-8 font-body text-base leading-relaxed">

          <div>
            <h2 className="font-display text-xl font-bold mb-3">Who we are</h2>
            <p className="text-text-secondary">
              WanderPin is built and operated by <span className="text-text-primary">DigiStairs</span>,
              based in India. DigiStairs is the data controller for the information described in this
              policy. You can reach us any time at{' '}
              <a href="mailto:hello@wanderpin.app" className="text-accent-green underline">
                hello@wanderpin.app
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">What we collect</h2>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              <li><span className="text-text-primary font-medium">Account info</span> — your email address, name, and profile picture, received from Google when you sign in.</li>
              <li><span className="text-text-primary font-medium">Places you save</span> — the name, city, state, country, coordinates, category, status, and any personal notes you write for each pin.</li>
              <li><span className="text-text-primary font-medium">Reel URLs</span> — the link you share to WanderPin so we can work out which place the video is about.</li>
              <li><span className="text-text-primary font-medium">AI planner conversations</span> — the messages you exchange with the planner, and any itineraries you save.</li>
              <li><span className="text-text-primary font-medium">Technical data</span> — your IP address and basic request details reach our servers and our hosting providers as a normal part of serving the app, and are kept only in short-lived operational logs.</li>
            </ul>
            <p className="text-text-secondary mt-3">
              We do not collect your contacts, photo library, calendar, or advertising identifiers.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">Signing in with Google</h2>
            <p className="text-text-secondary">
              WanderPin uses Google Sign-In, and it is the only way to create an account. We never see
              or store your Google password, and we don&apos;t request access to your Drive, Gmail,
              contacts, or any other Google data. We only receive your{' '}
              <span className="text-text-primary">email address, name, and profile picture</span>, and
              we use them to create your account and identify you when you open the app.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">How we use your data</h2>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              <li>To show your saved places on your personal map.</li>
              <li>To identify the location in a reel you share, so it becomes a pin.</li>
              <li>To generate travel itineraries with the AI planner.</li>
              <li>To keep the service running — diagnosing errors and preventing abuse.</li>
              <li>We do not sell your data. We do not use it for advertising, and we do not build advertising profiles.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">Services that process your data</h2>
            <p className="text-text-secondary mb-4">
              WanderPin relies on the services below. Each one receives only what it needs to do its job.
            </p>
            <ul className="list-disc list-inside space-y-3 text-text-secondary">
              <li>
                <span className="text-text-primary font-medium">Google Gemini</span> — when you use the
                AI planner, we send the name, city, coordinates, category, status, and{' '}
                <span className="text-text-primary">notes</span> of your saved pins, along with your
                message and recent conversation history. Your email, name, and account ID are never
                included. We currently use Gemini&apos;s free API tier, which means{' '}
                <span className="text-text-primary">
                  Google may review these requests and use them to improve their products
                </span>
                . If you&apos;d rather this content not reach Google, don&apos;t use the AI planner — the
                rest of the app works without it.
              </li>
              <li>
                <span className="text-text-primary font-medium">Groq</span> — when you share a reel, its
                audio is transcribed (Whisper) and then the caption and transcript are sent to a
                language model to extract the place name. Neither the audio file nor the transcript is
                stored after processing; the audio file is deleted from our server immediately.
              </li>
              <li>
                <span className="text-text-primary font-medium">OpenStreetMap / Nominatim</span> — place
                names are sent to look up coordinates and region boundaries. Some of these lookups are
                made directly by the app, so your device&apos;s IP address reaches OpenStreetMap.
              </li>
              <li>
                <span className="text-text-primary font-medium">MapTiler</span> — map tiles load
                directly from MapTiler&apos;s servers onto your device, so your IP address and the map
                area you&apos;re viewing reach them. No account information is sent.
              </li>
              <li>
                <span className="text-text-primary font-medium">Neon</span> (database) and{' '}
                <span className="text-text-primary">DigitalOcean</span> (application servers) — these
                host your data. Both are located in the <span className="text-text-primary">United States</span>.
              </li>
              <li>
                <span className="text-text-primary font-medium">Discord</span> — our server sends
                automated alerts to a private channel when something breaks. These can include your
                account ID and the URL you shared, so we can reproduce the failure. They never include
                your email, name, or saved places.
              </li>
              <li>
                <span className="text-text-primary font-medium">Instagram / Meta</span> — reel thumbnails
                are loaded directly from Instagram&apos;s servers when shown in the app, so your IP
                address reaches Meta. We don&apos;t send them anything about your account.
              </li>
            </ul>
            <p className="text-text-secondary mt-4">
              Google&apos;s handling of data is governed by the{' '}
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
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">Where your data is stored</h2>
            <p className="text-text-secondary">
              Your account and pins are stored on servers in the United States. If you use WanderPin
              from the UK, EU, India, or anywhere else, your data is transferred to and processed in the
              US. By using the app you consent to this transfer.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">Location data</h2>
            <p className="text-text-secondary">
              WanderPin does not request or access your device&apos;s GPS or location permission at all.
              Every coordinate in the app comes from a place you explicitly saved — extracted from a reel
              you shared, or entered by hand.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">Deleting your account</h2>
            <p className="text-text-secondary">
              You can delete your account and everything in it from{' '}
              <span className="text-text-primary">Profile → Delete Account</span> in the app. Deletion is
              immediate and permanent — your account, pins, notes, planner conversations, and saved
              itineraries are all erased.
            </p>
            <p className="text-text-secondary mt-3">
              If you&apos;ve uninstalled the app, you can request deletion without reinstalling it. See{' '}
              <a href="/delete-account" className="text-accent-green underline">
                wanderpin.app/delete-account
              </a>{' '}
              for instructions.
            </p>
            <p className="text-text-secondary mt-3">
              If you only want to clear your pins and keep your account, use{' '}
              <span className="text-text-primary">Profile → Clear All Pins</span> instead.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">Data retention</h2>
            <p className="text-text-secondary">
              We keep your data for as long as your account is active. After you delete your account,
              encrypted database backups may retain it for up to 30 days before rolling off, and server
              error logs containing your account ID may persist for up to 30 days. Neither is used for
              any purpose after deletion.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">Your rights</h2>
            <p className="text-text-secondary mb-3">
              Wherever you live, you can ask us to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              <li>Tell you what data we hold about you</li>
              <li>Correct anything that&apos;s wrong</li>
              <li>Send you a copy of your data in a portable format</li>
              <li>Delete your account and all associated data</li>
              <li>Object to or restrict how we process your data</li>
            </ul>
            <p className="text-text-secondary mt-3">
              Email{' '}
              <a href="mailto:hello@wanderpin.app" className="text-accent-green underline">
                hello@wanderpin.app
              </a>{' '}
              and we&apos;ll respond within 30 days. Exercising any of these rights is free, and we
              won&apos;t restrict your access to the app for asking. If you&apos;re in the UK or EU and
              you&apos;re unhappy with our response, you have the right to complain to your local data
              protection authority.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">Security</h2>
            <p className="text-text-secondary">
              All traffic between the app and our servers is encrypted in transit over HTTPS. Your data
              is stored with an encrypted database provider. Your sign-in token is kept in your
              device&apos;s secure keychain, not in ordinary app storage. No system is perfectly secure,
              but if a breach ever affects your data we&apos;ll tell you promptly.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">Children</h2>
            <p className="text-text-secondary">
              WanderPin is not intended for anyone under 13 — or under 16 in the UK and EU. We do not
              knowingly collect data from children. If you believe a child has created an account, email
              us and we&apos;ll delete it.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">Changes to this policy</h2>
            <p className="text-text-secondary">
              If we change this policy we&apos;ll update the date at the top of this page. For
              significant changes — new services receiving your data, or a new purpose for it — we&apos;ll
              tell you in the app before the change takes effect.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">Contact</h2>
            <p className="text-text-secondary">
              Questions about this policy, or about your data:{' '}
              <a href="mailto:hello@wanderpin.app" className="text-accent-green underline">
                hello@wanderpin.app
              </a>
            </p>
          </div>

        </section>
      </div>
    </main>
  )
}
