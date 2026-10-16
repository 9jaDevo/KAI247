"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "./brand";
import { Icon, type IconName } from "./icon";
import { clientApi } from "@/lib/client-api";

const navigation: { href: string; label: string; icon: IconName }[] = [
  { href: "/app", label: "Overview", icon: "grid" },
  { href: "/app/renewals", label: "Renewals", icon: "calendar" },
  { href: "/app/import", label: "Import document", icon: "upload" },
  { href: "/app/activity", label: "Notification activity", icon: "bell" },
  { href: "/app/settings", label: "Settings", icon: "settings" },
];
export function AppShell({
  children,
  organization,
  displayName,
}: {
  children: React.ReactNode;
  organization: { name: string; timezone: string; isDemo: boolean };
  displayName: string;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuToggle = useRef<HTMLButtonElement>(null);
  const [logoutError, setLogoutError] = useState("");
  return (
    <div className="app-frame">
      <a href="#workspace-main" className="skip-link">
        Skip to workspace
      </a>
      <aside
        className="sidebar"
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuOpen) {
            setMenuOpen(false);
            menuToggle.current?.focus();
          }
        }}
      >
        <div className="sidebar-brand">
          <Brand />
          <button
            ref={menuToggle}
            className="icon-button mobile-menu"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            aria-controls="workspace-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? "close" : "menu"} />
          </button>
        </div>
        <div
          className={`sidebar-content ${menuOpen ? "is-open" : ""}`}
          id="workspace-navigation"
        >
          <div className="workspace-label">
            <span className="workspace-avatar">{displayName.slice(0, 1)}</span>
            <div>
              <strong>{organization.name}</strong>
              <span>
                {organization.isDemo ? "Synthetic sandbox" : "Owner workspace"}
              </span>
            </div>
          </div>
          <p className="nav-label">WORKSPACE</p>
          <nav aria-label="Workspace navigation">
            {navigation.map((item) => {
              const active =
                item.href === "/app"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`nav-item ${active ? "active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon name={item.icon} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="sidebar-footer">
            <div className="preview-note">
              <Icon name="shield" />
              <strong>Your confirmed dates.</strong>
              <p>
                Renewals are saved only after you confirm them, whether typed or
                extracted by Gemma. Email requires verified opt-in and a
                configured provider.
              </p>
            </div>
            <div>
              <button
                className="nav-item exit-preview"
                type="button"
                onClick={async () => {
                  try {
                    await clientApi("/api/auth/logout", "POST", {});
                    window.location.replace(
                      new URL("/login", window.location.origin).href,
                    );
                  } catch (error) {
                    setLogoutError(
                      error instanceof Error
                        ? error.message
                        : "Sign-out failed.",
                    );
                  }
                }}
              >
                <Icon name="logout" />
                Sign out
              </button>
              {logoutError && (
                <p role="alert" className="field-error">
                  {logoutError}
                </p>
              )}
            </div>
          </div>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="workspace-topbar">
          <span>
            Owner workspace <span className="topbar-divider">/</span>{" "}
            <strong>
              {navigation.find((item) =>
                item.href === "/app"
                  ? pathname === item.href
                  : pathname.startsWith(item.href),
              )?.label ?? "Renewal details"}
            </strong>
          </span>
          <span className="topbar-status">
            <span className="status-dot" />
            Persistence connected
          </span>
        </header>
        <div className="demo-banner">
          <span>
            <strong>
              {organization.isDemo ? "Synthetic sandbox" : "Owner account"}
            </strong>{" "}
            · Records are persisted in your isolated workspace. Email requires a
            verified address, explicit opt-in and an available provider.
          </span>
          <Link href="/app/settings">
            Connection status <Icon name="arrow" width="16" />
          </Link>
        </div>
        <main id="workspace-main" className="workspace-main" tabIndex={-1}>
          {children}
        </main>
        <footer className="workspace-footer">
          <span>KAI247 AI · Built around your next deadline.</span>
          <span>{organization.timezone}</span>
        </footer>
      </div>
    </div>
  );
}
