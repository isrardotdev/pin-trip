export const metadata = {
  title: 'Delete Your Account',
  description: 'How to delete your WanderPin account and all associated data.',
}

export default function DeleteAccountPage() {
  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <a
          href="/"
          className="text-sm font-body text-text-secondary hover:text-text-primary mb-8 inline-block"
        >
          ← WanderPin
        </a>

        <h1 className="font-display text-4xl font-bold mb-2">Delete Your Account</h1>
        <p className="text-text-secondary text-sm mb-10 font-body">
          WanderPin is operated by DigiStairs, India.
        </p>

        <section className="space-y-8 font-body text-base leading-relaxed">

          <div>
            <h2 className="font-display text-xl font-bold mb-3">Delete it yourself, in the app</h2>
            <p className="text-text-secondary mb-3">
              This is the fastest way — deletion is immediate and permanent.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-text-secondary">
              <li>Open WanderPin and go to the <span className="text-text-primary font-medium">Profile</span> tab.</li>
              <li>Tap <span className="text-text-primary font-medium">Delete Account</span>.</li>
              <li>Confirm twice. Your account and all its data are erased right away.</li>
            </ol>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">Or request it by email</h2>
            <p className="text-text-secondary">
              If you&apos;ve uninstalled the app or can&apos;t sign in, email us from the address you
              signed up with and we&apos;ll delete the account for you:
            </p>
            <p className="mt-3">
              <a
                href="mailto:hello@wanderpin.app?subject=Delete%20my%20WanderPin%20account"
                className="text-accent-green underline font-mono text-sm"
              >
                hello@wanderpin.app
              </a>
            </p>
            <p className="text-text-secondary mt-3">
              We respond within 30 days, usually much sooner. We may ask you to confirm the request
              from your sign-up email address so nobody else can delete your account.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">
              Delete your saved places without deleting your account
            </h2>
            <p className="text-text-secondary mb-3">
              If you want to erase what you&apos;ve saved but keep your account, you can delete your
              places on their own — individually or all at once.
            </p>
            <p className="text-text-primary font-medium mb-2">Delete every place you&apos;ve saved:</p>
            <ol className="list-decimal list-inside space-y-2 text-text-secondary mb-4">
              <li>Open WanderPin and go to the <span className="text-text-primary font-medium">Profile</span> tab.</li>
              <li>Tap <span className="text-text-primary font-medium">Clear All Pins</span>.</li>
              <li>Confirm. Every saved place, along with its notes, is deleted immediately.</li>
            </ol>
            <p className="text-text-primary font-medium mb-2">Delete a single place:</p>
            <ol className="list-decimal list-inside space-y-2 text-text-secondary mb-4">
              <li>Tap the place on your map or in your list of pins.</li>
              <li>Tap <span className="text-text-primary font-medium">Delete pin</span> at the bottom of the detail sheet.</li>
            </ol>
            <p className="text-text-secondary">
              Your account, email, and sign-in stay active either way. You can also request this by
              email at{' '}
              <a
                href="mailto:hello@wanderpin.app?subject=Delete%20my%20WanderPin%20data"
                className="text-accent-green underline"
              >
                hello@wanderpin.app
              </a>
              {' '}— we respond within 30 days.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">What gets deleted</h2>
            <p className="text-text-secondary mb-3">
              Everything tied to your account is removed permanently and cannot be recovered:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              <li>Your account record — email, name, and profile picture</li>
              <li>Every pin you saved, including notes and coordinates</li>
              <li>Your AI planner conversations and saved itineraries</li>
              <li>Any reel submissions we couldn&apos;t resolve into a place</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">What may persist briefly</h2>
            <p className="text-text-secondary">
              Encrypted database backups are kept for up to 30 days before rolling off, and server
              error logs containing your account ID (never your email or saved places) are retained
              for up to 30 days. Neither is used for any purpose after deletion.
            </p>
          </div>

          <div className="pt-4 border-t border-border-light">
            <p className="text-text-secondary text-sm">
              See our{' '}
              <a href="/privacy" className="text-accent-green underline">
                Privacy Policy
              </a>{' '}
              for how we handle your data while your account is active.
            </p>
          </div>

        </section>
      </div>
    </main>
  )
}
