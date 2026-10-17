import "./landing.css";
import type { Metadata } from "next";
import { getSiteUrl, siteName, siteDescription } from "@/lib/site";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/icon";
import { ActionLink, Pill } from "@/components/ui";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    type: "website",
    siteName,
    title: "KAI247 AI — Clarity for everything that's due",
    description: siteDescription,
    locale: "en_NG",
  },
};

export default function Home() {
  return (
    <div className="landing">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "@id": `${getSiteUrl()}#website`,
                name: siteName,
                alternateName: "KAI247",
                url: getSiteUrl().href,
                description: siteDescription,
                inLanguage: "en-NG",
              },
              {
                "@type": "Organization",
                "@id": `${getSiteUrl()}#organization`,
                name: siteName,
                url: getSiteUrl().href,
                logo: new URL("/brand/logo.png", getSiteUrl()).href,
              },
            ],
          }).replace(/</g, "\\u003c"),
        }}
      />
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="public-header page-container">
        <Brand />
        <nav aria-label="Public navigation">
          <Link href="#how-it-works">How it works</Link>
          <Link href="#built-for">Built for you</Link>
          <Link href="/login" className="button button-secondary">
            Owner sign-in <Icon name="arrow" width="16" />
          </Link>
        </nav>
      </header>
      <main id="main">
        <section className="hero page-container">
          <div className="hero-copy">
            <p className="eyebrow">FOR THE BUSINESS YOU’RE BUILDING</p>
            <h1>
              Keep the business moving.
              <br />
              <em>Know what’s due.</em>
            </h1>
            <p className="hero-description">
              The hosting invoice in your inbox. The policy in a folder. The
              permit date in your head. Bring your next renewal into focus,
              before it slips through the cracks.
            </p>
            <div className="actions">
              <ActionLink href="/login">
                Open your workspace <Icon name="arrow" />
              </ActionLink>
              <Link
                className="text-link button button-secondary"
                href="#how-it-works"
              >
                See the approach ↘
              </Link>
            </div>
            <p className="hero-footnote">
              <span className="hero-check">
                <Icon name="check" width="12" height="12" />
              </span>
              Manual tracking and Gemma extraction · verified-owner email
              scheduling
            </p>
          </div>
          <div
            className="hero-visual reference-hero"
            role="img"
            aria-label="Illustration, not a live record: a sample website hosting renewal for 21 October 2026, with source evidence, beside a notebook and pen."
          />
        </section>
        <div className="use-case-strip">
          <div className="page-container">
            <span>Less scattered. More considered.</span>
            <span>
              <Icon name="globe" />
              Domains & hosting
            </span>
            <span>
              <Icon name="car" />
              Vehicle documents
            </span>
            <span>
              <Icon name="document" />
              Permits & agreements
            </span>
          </div>
        </div>
        <section id="how-it-works" className="section page-container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE APPROACH</p>
              <h2>
                From a document
                <br />
                to a decision.
              </h2>
            </div>
            <p>
              AI can help you find a date. You decide whether it’s the right
              one. That’s the workflow we’re building.
            </p>
          </div>
          <div className="steps">
            {[
              {
                n: "01",
                icon: "document" as const,
                title: "Bring it together",
                text: "Start with a renewal you already know, or a machine-readable invoice, policy or agreement.",
                status: "Manual entry and TXT/PDF upload available",
              },
              {
                n: "02",
                icon: "sparkles" as const,
                title: "Check the details",
                text: "Review candidate dates alongside their source evidence. Edit ambiguity and confirm what matters.",
                status: "Gemma extraction with human review",
              },
              {
                n: "03",
                icon: "bell" as const,
                title: "Stay ahead",
                text: "Choose your email reminder timing, see notification history and record the next renewal.",
                status: "Email requires verified opt-in",
              },
            ].map((step) => (
              <article className="step" key={step.n}>
                <div className="step-top">
                  <span>{step.n}</span>
                  <Icon name={step.icon} width="26" height="26" />
                </div>
                <div
                  className={`step-art step-art-${step.n}`}
                  aria-hidden="true"
                />
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                <span className="small muted">{step.status}</span>
              </article>
            ))}
          </div>
        </section>
        <section id="built-for" className="value-section">
          <div className="page-container value-grid">
            <div>
              <p className="eyebrow">BUILT FOR EVERYDAY OPERATORS</p>
              <h2>
                Your attention belongs
                <br />
                on the business.
              </h2>
              <p>
                For Nigerian small-business owners balancing customers,
                operations and the admin that keeps everything working.
              </p>
              <ActionLink href="/login">
                Manage your renewals <Icon name="arrow" />
              </ActionLink>
            </div>
            <div className="value-list">
              <article>
                <span>01</span>
                <Icon name="calendar" width="25" height="25" />
                <div>
                  <h3>Context, beside the deadline.</h3>
                  <p>
                    A provider, an owner, an amount and a source. More useful
                    than a date with no story attached.
                  </p>
                </div>
              </article>
              <article>
                <span>02</span>
                <Icon name="people" width="25" height="25" />
                <div>
                  <h3>Your judgement stays central.</h3>
                  <p>
                    Candidate details need human confirmation. Unclear dates
                    should lead to questions, not silent assumptions.
                  </p>
                </div>
              </article>
              <article>
                <span>03</span>
                <Icon name="document" width="25" height="25" />
                <div>
                  <h3>A record of what happened.</h3>
                  <p>
                    Notification activity distinguishes attempts, failures and
                    provider acceptance. An email sent is not a delivery
                    guarantee.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>
        <section className="landing-cta page-container">
          <Pill tone="teal">Manual renewals available</Pill>
          <h2>
            A little more order.
            <br />
            <em>A clearer next step.</em>
          </h2>
          <p>
            Sign in, add confirmed renewals or extract candidates from a
            document with Gemma, then confirm them. Email requires verified
            opt-in.
          </p>
          <ActionLink href="/login">
            Open your workspace <Icon name="arrow" />
          </ActionLink>
          <span className="small muted">
            Owner credentials required. Email requires a configured provider and
            worker.
          </span>
        </section>
      </main>
      <footer className="public-footer page-container">
        <Brand />
        <p>From scattered renewal documents to confirmed deadlines.</p>
        <span>Manual tracking · Not legal or compliance advice</span>
      </footer>
    </div>
  );
}
