"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";

// Updated to use your PNG logo matching the main page
function Mark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      {/* Adding the crop class here ensures the text is hidden in the tiny navbar icon too */}
      <img src="/FullLogo_Transparent_NoBuffer.png" alt="" className="logo-crop-text" />
    </span>
  );
}

export default function PrivacyPolicy() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="site-shell min-h-screen flex flex-col">
      <nav className="navbar">
        <Link href="/" className="brand" aria-label="Back to home">
          <Mark />
          <span>Solvix</span>
        </Link>
        <div className={`nav-links ${menuOpen ? "open" : ""}`}>
          <Link href="/#features">Features</Link>
          <Link href="/#showcase">Showcase</Link>
          <Link href="/#how-it-works">How it works</Link>
        </div>
        <button
          className="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <div className="flex-1 w-full max-w-3xl mx-auto px-6 py-20">
        <div className="kicker mb-6">
          <span className="kicker-line" />
          Legal
        </div>
        <h1 className="text-4xl md:text-5xl mb-4 tracking-tight">Privacy Policy</h1>
        <p className="text-[var(--muted-ink)] mb-12">Last Updated: September 4, 2026</p>

        <div className="space-y-10 text-[15px] leading-relaxed text-[var(--muted-ink)]">
          <section>
            <h2 className="text-xl text-[var(--ink)] font-medium mb-3">1. Information We Collect</h2>
            <p>Solvix is designed to respect your privacy while providing advanced LeetCode practice analytics. To make our extension work, we process:</p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li><strong>LeetCode Activity:</strong> Problem names, submission statuses (Accepted, Wrong Answer), difficulty levels, and time spent on active practice sessions.</li>
              <li><strong>GitHub Authentication:</strong> OAuth tokens and repository details required strictly for pushing your accepted solutions to your chosen repository.</li>
              <li><strong>Code Snippets (On-Demand):</strong> Code you explicitly choose to analyze using the Solvix AI assistant.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-[var(--ink)] font-medium mb-3">2. How We Use Your Data</h2>
            <p>Your data is used solely to power the features of the Solvix extension:</p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>To populate your local dashboard with analytics, streaks, and focus metrics (synced via MongoDB).</li>
              <li>To automate the archival of your successful code submissions to your connected GitHub repository.</li>
              <li>To provide contextual hints, complexity breakdowns, and bug finding via the Gemini 2.0 API.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-[var(--ink)] font-medium mb-3">3. Third-Party Services & Data Sharing</h2>
            <p><strong>We do not sell your personal data.</strong> Data is only shared with essential third-party services to provide core functionality:</p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li><strong>Google (Gemini AI):</strong> Code snippets and prompts are securely sent to the Gemini API only when you actively request AI assistance.</li>
              <li><strong>GitHub:</strong> We use your authorized OAuth access to commit files to your designated repository. We do not read your private repositories unrelated to Solvix.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-[var(--ink)] font-medium mb-3">4. Data Security & Your Rights</h2>
            <p>We use standard encryption protocols for data in transit. You retain full control over your data. You may disconnect your GitHub account at any time through your GitHub settings, which immediately revokes Solvix's access to your repositories.</p>
          </section>

          <section>
            <h2 className="text-xl text-[var(--ink)] font-medium mb-3">5. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy or how your data is handled, please reach out to us at <strong>hemant.k2807@gmail.com</strong>.</p>
          </section>
        </div>
      </div>

      <footer className="footer" id="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <Link href="/" className="brand" aria-label="Back to home">
              <Mark />
              <span>Solvix</span>
            </Link>
            <p>
              A calmer way to get better
              <br />
              at hard problems.
            </p>
          </div>
          <div className="footer-links">
            <div>
              <span className="eyebrow">Explore</span>
              <Link href="/#features" className="hover:text-[var(--ink)] transition-colors">Features</Link>
              <Link href="/#showcase" className="hover:text-[var(--ink)] transition-colors">Showcase</Link>
              <Link href="/#how-it-works" className="hover:text-[var(--ink)] transition-colors">How it works</Link>
            </div>
            <div>
              <span className="eyebrow">Connect</span>
              <a href="https://github.com/mangalam-srv/Solvix" target="_blank" rel="noreferrer" className="hover:text-[var(--ink)] transition-colors">GitHub</a>
              <a href="mailto:hemant.k2807@gmail.com" className="hover:text-[var(--ink)] transition-colors">Contact</a>
              <a href="/#footer" className="hover:text-[var(--ink)] transition-colors">Updates</a>
            </div>
            <div>
              <span className="eyebrow">Legal</span>
              <Link href="/privacy-policy" className="hover:text-[var(--ink)] transition-colors">Privacy Policy</Link>
            </div>
          </div>
          {/* SVX Stamp successfully removed here */}
        </div>
        <div className="footer-bottom mt-10">
          <span>© 2026 Solvix</span>
          <span>Practice intentionally.</span>
          <span>
            Crafted by{" "}
            <a href="https://www.linkedin.com/in/mangalamsrivastava/" target="_blank" rel="noreferrer">
              Mangalam
            </a>{" "}
            and{" "}
            <a href="https://www.linkedin.com/in/hemant2807/" target="_blank" rel="noreferrer">
              Hemant
            </a>
          </span>
        </div>
      </footer>
    </main>
  );
}