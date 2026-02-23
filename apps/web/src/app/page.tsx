import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-24 bg-[var(--color-background)]">
      <div className="card max-w-md w-full space-y-8 text-center shadow-xl">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">ReelFlow</h1>
          <p className="text-[var(--color-text-secondary)] text-sm">
            AI-powered internal video repurposing pipeline.
          </p>
        </div>

        <form className="space-y-4 text-left">
          <div className="space-y-1">
            <label htmlFor="admin-email" className="text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase">
              Admin Email
            </label>
            <input id="admin-email" type="email" className="input" placeholder="admin@reelflow.local" />
          </div>
          <div className="space-y-1">
            <label htmlFor="admin-password" className="text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase">
              Password
            </label>
            <input id="admin-password" type="password" className="input" placeholder="••••••••" />
          </div>

          <button className="btn-primary w-full flex items-center justify-center gap-2 mt-4" type="button">
            Sign In to Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </main>
  );
}
