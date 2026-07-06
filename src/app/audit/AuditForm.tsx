"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { runAuditAndRedirect } from "./actions";

/**
 * Audit form with a real pending state. The server action fetches the
 * target page, parses it, and (when the LLM key is set) runs a Claude pass
 * over ~40 rules — 3 to 20 seconds. Before this component, the button gave
 * zero feedback and people double-submitted or assumed it was broken.
 *
 * While pending: button locks with a spinner, and a mono progress line
 * cycles through honest stage labels timed to what the pipeline actually
 * does. The labels aren't wired to real progress events (the action is one
 * round-trip) but their pacing mirrors the real pipeline stages.
 */
export default function AuditForm({ error }: { error: string | null }) {
  return (
    <form
      action={runAuditAndRedirect}
      className="mt-10"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          name="url"
          placeholder="https://yourstore.com/products/your-hero"
          required
          inputMode="url"
          autoComplete="url"
          className="flex-1 rounded-full border border-[var(--line)] bg-[#fffdf8] px-5 py-3 text-[15px] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
        />
        <SubmitButton />
      </div>
      <PendingLine />
      {error && (
        <div
          role="alert"
          className="mt-4 rounded-md border border-[#e8c5bb] bg-[#f9ece7] px-4 py-3 text-sm text-[#a03d2e]"
        >
          {error}
        </div>
      )}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mk-btn mk-btn-primary justify-center disabled:cursor-wait"
    >
      {pending ? (
        <>
          <span className="mk-spinner" aria-hidden />
          Auditing…
        </>
      ) : (
        <>Audit it →</>
      )}
    </button>
  );
}

/** Paced to the real pipeline: fetch → parse → heuristics → AI → score. */
const STAGES = [
  { at: 0, label: "Fetching the page…" },
  { at: 1500, label: "Parsing HTML + Schema.org product data…" },
  { at: 3000, label: "Running 69 playbook rules…" },
  { at: 6000, label: "AI pass on the qualitative rules…" },
  { at: 12000, label: "Scoring + ranking your top fixes…" },
] as const;

function PendingLine() {
  const { pending } = useFormStatus();
  const [label, setLabel] = useState<string>(STAGES[0].label);

  useEffect(() => {
    if (!pending) return;
    // Every stage — including stage 0 — is scheduled via a timer so the
    // effect body never sets state synchronously (react-hooks lint rule).
    const timers = STAGES.map((s) =>
      setTimeout(() => setLabel(s.label), s.at),
    );
    return () => timers.forEach(clearTimeout);
  }, [pending]);

  if (!pending) return null;
  return (
    <p
      className="mk-audit-progress mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--accent-deep)]"
      role="status"
      aria-live="polite"
    >
      ▸ {label}
    </p>
  );
}
