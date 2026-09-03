"use client";

import { useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BrainCircuit,
  Check,
  ChevronDown,
  Chrome,
  CirclePlay,
  Clock3,
  Code2,
  Github,
  Menu,
  MousePointer2,
  Radio,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";
import { ScreenshotPreview } from "./ScreenshotPreview";

type FeatureKey =
  | "workspace"
  | "alternatives"
  | "assistant"
  | "analytics"
  | "daily"
  | "github"
  | "sheets"
  | "tracking"
  | "sessions"
  | "insights"
  | "ai";

const features: {
  key: FeatureKey;
  label: string;
  title: string;
  description: string;
}[] = [
  {
    key: "workspace",
    label: "01 / Focus",
    title: "Practice where the problem lives.",
    description:
      "Group problems into focus sheets or timed sessions, then keep completion, attempts, and active time beside the problem you are solving.",
  },
  {
    key: "alternatives",
    label: "02 / Explore",
    title: "Alternative Questions Across Platforms.",
    description:
      "Find similar coding problems across multiple competitive programming platforms without leaving your workflow. Search or compare problems on platforms such as GeeksforGeeks, Codeforces, and CodeChef instantly with simple inline redirects.",
  },
  {
    key: "assistant",
    label: "03 / Learn",
    title: "Interactive AI Practice Assistant.",
    description:
      "Get context-aware explanations, step-by-step optimization advice, bug finder services, and related YouTube conceptual references without having to switch tabs. The assistant is designed to provide guided instructions rather than dry solutions to ensure you learn productively.",
  },
  {
    key: "analytics",
    label: "04 / Measure",
    title: "Durable Progress Analytics",
    description:
      "Visualize your preparation metrics through a weekly activity tracker. Keep tabs on streak records, question count distribution by difficulty, topic strengths, and your consistency rating mapped directly from MongoDB records.",
  },
  {
    key: "daily",
    label: "05 / Reflect",
    title: "Daily Performance Insights",
    description:
      "Track your daily coding performance and compare today's progress with yesterday's activity. The dashboard displays critical metrics like problems solved, attempts made, accuracy percentage, and daily goal progress.",
  },
  {
    key: "github",
    label: "06 / Archive",
    title: "Automated GitHub DSA Sync.",
    description:
      "Securely link your GitHub account. Select a custom repository and watch Solvix automatically commit and push your verified accepted solutions directly to your branch, maintaining an archive of your DSA progress.",
  },
  {
    key: "sheets",
    label: "07 / Follow",
    title: "Curated DSA Practice Sheets.",
    description:
      "Follow structured DSA roadmaps and curated problem sheets from popular educators and coding communities — all inside your practice workflow. Select from leading curated sheets such as Striver's SDE and A2Z courses, Blind 75, Blind 150, NeetCode 150, or Love Babbar 450.",
  },
];

const marqueeItems = [
  "Problem tracking",
  "Practice sessions",
  "AI guidance",
  "Progress analytics",
  "GitHub workflow",
];

const sourceRepositoryUrl = "https://github.com/mangalam-srv/Solvix";
const projectRepositoryUrl = "https://github.com/hemant2807/Solvix";

function Mark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <img src="/FullLogo_Transparent_NoBuffer.png" alt="" />
    </span>
  );
}

function DashboardPreview({ feature }: { feature: FeatureKey }) {
  if (feature === "tracking") {
    return (
      <div className="preview-shell tracking-preview">
        <div className="preview-sidebar">
          <div className="mini-mark">
            <Mark />
          </div>
          <span className="side-line active" />
          <span className="side-line" />
          <span className="side-line" />
          <span className="side-line" />
        </div>
        <div className="preview-content">
          <div className="preview-topline">
            <span>Activity / Today</span>
            <span className="live-dot">Live capture</span>
          </div>
          <div className="tracking-grid">
            <div className="problem-card large-card">
              <div className="card-top">
                <span className="eyebrow">Current problem</span>
                <span className="difficulty medium">Medium</span>
              </div>
              <h3>
                Longest Substring
                <br />
                Without Repeating
              </h3>
              <div className="code-lines">
                <i />
                <i />
                <i className="short" />
                <i />
                <i className="tiny" />
              </div>
              <div className="card-footer">
                <span>JavaScript</span>
                <span className="accepted">
                  <Check size={12} /> Accepted
                </span>
              </div>
            </div>
            <div className="metric-card">
              <span className="eyebrow">This week</span>
              <strong>14</strong>
              <span className="muted-label">problems solved</span>
              <div className="mini-bars">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="metric-card">
              <span className="eyebrow">Focus time</span>
              <strong>
                06<span className="unit">h</span> 42
                <span className="unit">m</span>
              </strong>
              <span className="muted-label">+18% from last week</span>
              <div className="line-chart">
                <svg viewBox="0 0 210 44" preserveAspectRatio="none">
                  <path d="M0 35 C20 31 28 37 45 25 S75 23 89 30 S111 13 128 19 S156 9 170 14 S195 9 210 3" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (feature === "sessions") {
    return (
      <div className="preview-shell sessions-preview">
        <div className="session-heading">
          <div>
            <span className="eyebrow">Practice / In progress</span>
            <h3>Wednesday reset</h3>
          </div>
          <span className="timer">
            <Clock3 size={14} /> 42:18
          </span>
        </div>
        <div className="session-progress">
          <div>
            <span>Session progress</span>
            <b>3 / 5</b>
          </div>
          <div className="progress-track">
            <i />
          </div>
        </div>
        {[
          "Two Sum",
          "Valid Parentheses",
          "LRU Cache",
          "Binary Tree Level Order",
        ].map((item, index) => (
          <div className="session-row" key={item}>
            <span className={`check-box ${index < 2 ? "done" : ""}`}>
              {index < 2 && <Check size={12} />}
            </span>
            <span>{item}</span>
            <span className={`row-tag ${index < 2 ? "solved" : ""}`}>
              {index < 2 ? "Solved" : index === 2 ? "Next up" : "Queued"}
            </span>
          </div>
        ))}
        <div className="session-note">
          <Target size={16} />
          <span>One focused hour beats an unfocused afternoon.</span>
        </div>
      </div>
    );
  }

  if (feature === "insights") {
    return (
      <div className="preview-shell insights-preview">
        <div className="insight-head">
          <div>
            <span className="eyebrow">Your patterns</span>
            <h3>Progress, in context.</h3>
          </div>
          <span className="period">
            Last 30 days <ChevronDown size={13} />
          </span>
        </div>
        <div className="chart-card">
          <div className="chart-labels">
            <span>40</span>
            <span>30</span>
            <span>20</span>
            <span>10</span>
            <span>0</span>
          </div>
          <svg
            className="big-chart"
            viewBox="0 0 540 166"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#b5d2bd" stopOpacity=".8" />
                <stop offset="1" stopColor="#b5d2bd" stopOpacity=".05" />
              </linearGradient>
            </defs>
            <path
              d="M0 140 C35 131 44 126 70 128 S98 96 122 108 S160 77 188 89 S224 93 248 68 S284 76 304 47 S346 65 370 50 S405 28 432 47 S470 18 500 30 S520 15 540 8 V166 H0Z"
              fill="url(#chartFill)"
            />
            <path
              d="M0 140 C35 131 44 126 70 128 S98 96 122 108 S160 77 188 89 S224 93 248 68 S284 76 304 47 S346 65 370 50 S405 28 432 47 S470 18 500 30 S520 15 540 8"
              fill="none"
              stroke="#14241e"
              strokeWidth="2.5"
            />
          </svg>
          <div className="chart-dates">
            <span>May 1</span>
            <span>May 10</span>
            <span>May 20</span>
            <span>May 30</span>
          </div>
        </div>
        <div className="insight-stats">
          <div>
            <span className="eyebrow">Solved</span>
            <strong>38</strong>
            <small>
              <TrendingUp size={12} /> 24% vs last month
            </small>
          </div>
          <div>
            <span className="eyebrow">Strongest topic</span>
            <strong className="topic">Arrays</strong>
            <small>72% confidence</small>
          </div>
          <div>
            <span className="eyebrow">Current streak</span>
            <strong>9 days</strong>
            <small>Personal best: 14</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-shell ai-preview">
      <div className="ai-head">
        <div className="ai-orb">
          <Sparkles size={18} />
        </div>
        <div>
          <span className="eyebrow">Solvix guide</span>
          <h3>Let&apos;s find the next step.</h3>
        </div>
      </div>
      <div className="chat-bubble user-bubble">
        I keep getting stuck on the window logic.
      </div>
      <div className="chat-bubble assistant-bubble">
        <span className="assistant-label">
          <BrainCircuit size={13} /> Solvix
        </span>
        Think about what the window needs to remember. What changes when the
        right pointer sees a duplicate?
      </div>
      <div className="prompt-bar">
        <span>Ask about your approach...</span>
        <ArrowRight size={20} />
      </div>
      <div className="ai-suggestions">
        <span>Explain the constraint</span>
        <span>Check complexity</span>
        <span>Give me a hint</span>
      </div>
    </div>
  );
}

function SharedFeaturePreview({ feature }: { feature: FeatureKey }) {
  const getPreviewType = (key: FeatureKey) => {
    switch (key) {
      case "workspace": 
        return "activity"; // Using "activity" here shows the "Recent Practice Work" mockup for your first feature
      case "alternatives": return "platforms";
      case "assistant": return "ai";
      case "analytics": return "analytics";
      case "daily": return "performance";
      case "github": return "github";
      case "sheets": return "sheets";
      case "sessions": return "goal";
      default: return "dashboard";
    }
  };
  return (
    <div className="preview-shell shared-feature-preview" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', boxShadow: 'none' }}>
      {/* Passing an empty src="" forces it to render your dark CSS mockups */}
      <ScreenshotPreview 
        src="" 
        alt={`${feature} preview`} 
        type={getPreviewType(feature)} 
        className="w-full h-full light-preview"
      />
    </div>
  );
}

export default function Home() {
  const [activeFeature, setActiveFeature] = useState<FeatureKey>("workspace");
  const [menuOpen, setMenuOpen] = useState(false);
  const selectedFeature =
    features.find((feature) => feature.key === activeFeature) ?? features[0];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const openRepository = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="site-shell">
      <nav className="navbar">
        <button
          className="brand"
          onClick={() => scrollTo("top")}
          aria-label="Back to top"
        >
          <Mark />
          <span>Solvix</span>
        </button>
        <div className={`nav-links ${menuOpen ? "open" : ""}`}>
          <button onClick={() => scrollTo("features")}>Features</button>
          <button onClick={() => scrollTo("showcase")}>Showcase</button>
          <button onClick={() => scrollTo("how-it-works")}>How it works</button>
          <button onClick={() => scrollTo("footer")}>Company</button>
        </div>
        <div className="nav-actions">
          <button
            className="dark-button small-button"
            onClick={() => openRepository(projectRepositoryUrl)}
          >
            Get started <ArrowRight size={20} />
          </button>
        </div>
        <button
          className="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="kicker">
            <span className="kicker-line" />
            LeetCode practice, with a memory
          </div>
          <h1>
            Make every
            <br />
            <em>solve</em> count.
          </h1>
          <p className="hero-description">
            Solvix turns scattered LeetCode practice into a calm, consistent
            system for getting better at the work that matters.
          </p>
          <div className="hero-actions">
            <button
              className="dark-button"
              onClick={() => openRepository(sourceRepositoryUrl)}
            >
              <Chrome size={20} /> Add to Browser - Free <ArrowRight size={20} />
            </button>
            <button
              className="text-button"
              onClick={() => openRepository(sourceRepositoryUrl)}
            >
              <Github size={20} /> View Source on GitHub <ArrowRight size={20} />
            </button>
          </div>
          {/* <div className="hero-meta">
            <div className="avatar-stack">
              <span>AR</span>
              <span>MK</span>
              <span>JD</span>
            </div>
            <span>Made for deliberate practice.</span>
          </div> */}
        </div>
        <div className="hero-visual" aria-label="Solvix dashboard preview">
          {/* <div className="hero-visual-label">
            <span>01</span>
            <span>Practice / Overview</span>
          </div> */}
          {/* <svg
            className="hero-visual-svg"
            viewBox="0 0 610 590"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M316 32C406 27 498 63 546 134C593 203 580 284 545 354C510 424 445 471 359 507C272 543 171 548 102 495C33 442 27 338 46 242C65 145 96 55 198 36C236 29 273 34 316 32Z"
              fill="#e6e8e5"
            />
            <path
              d="M172 126h265v312H172z"
              fill="#f8f8f5"
              stroke="#14241e"
              strokeWidth="1.4"
            />
            <path d="M172 126h265v44H172z" fill="#14241e" />
            <circle cx="192" cy="148" r="4" fill="#b5d2bd" />
            <circle cx="205" cy="148" r="4" fill="#dde6dd" />
            <circle cx="218" cy="148" r="4" fill="#e5e7e3" />
            <path
              d="M203 200h111M203 215h73"
              stroke="#a9b2ab"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <rect
              x="203"
              y="245"
              width="206"
              height="73"
              rx="4"
              fill="#dbe9df"
            />
            <path
              d="M220 265h92M220 281h64M220 296h119"
              stroke="#73927e"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M203 342h94M203 357h126M203 372h58"
              stroke="#a9b2ab"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <rect
              x="336"
              y="342"
              width="73"
              height="52"
              rx="4"
              fill="#f0eee8"
            />
            <path
              d="M351 377l13-15 11 7 14-19 10 12"
              stroke="#14241e"
              strokeWidth="2"
            />
            <path
              d="M96 480C150 460 180 487 229 466C277 445 296 475 346 448C388 426 424 460 472 426"
              stroke="#14241e"
              strokeWidth="2"
              strokeDasharray="3 6"
            />
            <circle cx="472" cy="426" r="4" fill="#14241e" />
            <path
              d="M465 103l36 38M500 103l-36 38"
              stroke="#b5d2bd"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <circle
              cx="483"
              cy="121"
              r="31"
              stroke="#14241e"
              strokeWidth="1.5"
              strokeDasharray="2 5"
            />
          </svg> */}
          <div className="hero-visual" aria-label="Solvix 3D Logo">
          <div className="hero-visual-container">
            <img 
              /* Ensure this file is placed inside your Next.js 'public' folder */
              src="/FullLogo_Transparent_NoBuffer.png" 
              alt="Solvix Animated Logo"
              className="hero-3d-logo"
            />
          </div>
        </div>
          {/* <div className="hero-visual-caption">
            <span>Solvix / personal practice system</span>
            <span>
              Scroll to explore <ArrowDownRight size={15} />
            </span>
          </div> */}
        </div>
      </section>

      <div className="marquee-wrap" aria-label="Solvix capabilities">
        <div className="marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, index) => (
            <span key={`${item}-${index}`}>
              <i />
              {item}
            </span>
          ))}
        </div>
      </div>

      <section className="intro-section" id="how-it-works">
        {/* <div className="section-number">
          02 <span>/</span> Why Solvix
        </div> */}
        <div className="intro-content">
          <h2>
            Good practice 
            <br />
            leaves a trail
            {/* <span>a trail.</span> */}
          </h2>
          <div className="intro-side">
            <p>
              Most tools tell you what you did. Solvix helps you understand why
              it worked, where you hesitate, and what to practice next.
            </p>
            <button className="arrow-link" onClick={() => scrollTo("features")}>
              Explore the system <ArrowRight size={17} />
            </button>
          </div>
        </div>
        <div className="principles">
          <div>
            <span>01</span>
            <strong>Build Consistency</strong>
            <p>
              Track progress rings, streaks, and hit your daily goals with a practice rhythm that keeps you accountable.
            </p>
          </div>
          <div>
            <span>02</span>
            <strong>Guided Learning</strong>
            <p>
              Get hints, algorithmic complexity analyses, and bug checks from your dedicated Gemini AI practice assistant right when you get stuck.
            </p>
          </div>
          <div>
            <span>03</span>
            <strong>Granular Analytics</strong>
            <p>Analyze your performance trends over time, view 7-day activity maps, success ratios, and topic breakdown metrics in detail.</p>
          </div>
        </div>
      </section>

      <section className="feature-section" id="features">
        {/* <div className="section-number">
          03 <span>/</span> The system
        </div> */}
        <div className="feature-heading">
          <h2>
            A workspace for
            <br />
            <em>the whole loop.</em>
          </h2>
          <p>
            An elegant dashboard that embeds natively in your workflow. The side panel automatically loads your profile and detects the active question.
          </p>
        </div>
        <div className="feature-layout">
          <div className="feature-list">
            {features.map((feature) => (
              <button
                key={feature.key}
                className={`feature-tab ${activeFeature === feature.key ? "selected" : ""}`}
                onClick={() => setActiveFeature(feature.key)}
              >
                <span>{feature.label}</span>
                <span>
                  {activeFeature === feature.key ? (
                    <ArrowRight size={18} />
                  ) : (
                    <span className="tab-dot" />
                  )}
                </span>
              </button>
            ))}
          </div>
          <div className="feature-detail">
            <div className="detail-copy">
              <span className="eyebrow">{selectedFeature.label}</span>
              <h3>{selectedFeature.title}</h3>
              <p>{selectedFeature.description}</p>
              <button
                className="arrow-link"
                onClick={() => scrollTo("showcase")}
              >
                See it in action <ArrowRight size={17} />
              </button>
            </div>
            <SharedFeaturePreview feature={activeFeature} />
          </div>
        </div>
      </section>

      <section className="showcase-section" id="showcase">
        <div className="section-number">
          {/* 04 <span>/</span> Inside Solvix */}
        </div>
        <div className="showcase-heading">
          <h2>
            Less dashboard.
            <br />
            <em>More direction.</em>
          </h2>
          <p>
            Quiet surfaces for the moments when you need to see the whole
            picture.
          </p>
        </div>
        <div className="showcase-grid">
          <div className="showcase-card dark-card">
            <div className="card-symbol">
              <BarChart3 size={19} />
            </div>
            <span className="eyebrow">01 / At a glance</span>
            <h3>
              Your progress,
              <br />
              without the noise.
            </h3>
            <div className="fake-heatmap">
              <span />
              <span />
              <span className="high" />
              <span />
              <span className="mid" />
              <span />
              <span className="high" />
              <span className="high" />
              <span />
              <span className="mid" />
              <span />
              <span />
              <span className="high" />
              <span />
              <span className="mid" />
              <span />
              <span />
            </div>
            <span className="card-link">
              Activity overview <ArrowUpRightIcon />
            </span>
          </div>
          <div className="showcase-card light-preview" style={{ padding: 0, background: 'var(--white)' }}>
            <ScreenshotPreview 
              src="" 
              alt="Dashboard Overview" 
              type="dashboard" 
              className="w-full h-full"
            />
          </div>
          <div className="showcase-card paper-card">
            <div className="card-symbol">
              <Github size={19} />
            </div>
            <span className="eyebrow">03 / Your archive</span>
            <h3>
              Make your solutions
              <br />
              easy to return to.
            </h3>
            <div className="repo-list">
              <div>
                <Code2 size={14} />
                <span>algorithms / arrays</span>
                <b>12</b>
              </div>
              <div>
                <Code2 size={14} />
                <span>algorithms / graphs</span>
                <b>08</b>
              </div>
              <div>
                <Code2 size={14} />
                <span>algorithms / dp</span>
                <b>06</b>
              </div>
            </div>
            <span className="card-link">
              Connect GitHub <ArrowUpRightIcon />
            </span>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-orbit orbit-one" />
        <div className="cta-orbit orbit-two" />
        {/* <span className="eyebrow">05 / Start from here</span> */}
        <h2>
          Better practice
          <br />
          <em>starts small.</em>
        </h2>
        <p>
          One problem. One session. One clearer view of where you are going.
        </p>
        <button className="light-button" onClick={() => openRepository(projectRepositoryUrl)}>
          Begin with Solvix <ArrowRight size={16} />
        </button>
      </section>

      <footer className="footer" id="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <button className="brand" onClick={() => scrollTo("top")}>
              <Mark />
              <span>Solvix</span>
            </button>
            <p>
              A calmer way to get better
              <br />
              at hard problems.
            </p>
          </div>
          <div className="footer-links">
            <div>
              <span className="eyebrow">Explore</span>
              <button onClick={() => scrollTo("features")}>Features</button>
              <button onClick={() => scrollTo("showcase")}>Showcase</button>
              <button onClick={() => scrollTo("how-it-works")}>
                How it works
              </button>
            </div>
            <div>
              <span className="eyebrow">Connect</span>
              <a
                href="https://github.com/mangalam-srv/Solvix"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
              <a href="mailto:hemant.k2807@gmail.com">Contact</a>
              <a href="#footer">Updates</a>
            </div>
          </div>
          
        </div>
        <div className="footer-bottom">
          <span>© 2026 Solvix</span>
          <span>Practice intentionally.</span>
          <span>
            Crafted by{" "}
            <a
              href="https://www.linkedin.com/in/mangalamsrivastava/"
              target="_blank"
              rel="noreferrer"
            >
              Mangalam
            </a>{" "}
            and{" "}
            <a
              href="https://www.linkedin.com/in/hemant2807/"
              target="_blank"
              rel="noreferrer"
            >
              Hemant
            </a>
          </span>
        </div>
      </footer>
    </main>
  );
}

function ArrowUpRightIcon() {
  return <ArrowUpRight size={15} />;
}
