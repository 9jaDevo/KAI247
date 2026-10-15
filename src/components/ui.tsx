"use client";

import Link from "next/link";
import {
  useId,
  useRef,
  useEffect,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import { Icon, type IconName } from "./icon";
import type { PreviewState } from "@/types/preview";

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet";
}) {
  return (
    <button className={`button button-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
export function ActionLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "quiet";
}) {
  return (
    <Link href={href} className={`button button-${variant}`}>
      {children}
    </Link>
  );
}
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`card ${className}`}>{children}</section>;
}
export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "teal" | "amber" | "red";
}) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {actions && <div className="actions">{actions}</div>}
    </header>
  );
}
export function Notice({
  children,
  title,
  tone = "info",
}: {
  children: ReactNode;
  title: string;
  tone?: "info" | "warning";
}) {
  return (
    <div className={`notice notice-${tone}`}>
      <Icon name={tone === "info" ? "shield" : "clock"} />
      <div>
        <strong>{title}</strong>
        <div>{children}</div>
      </div>
    </div>
  );
}
export function EmptyState({
  title,
  description,
  icon = "calendar",
  children,
}: {
  title: string;
  description: string;
  icon?: IconName;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} width="28" height="28" />
      </span>
      <h2>{title}</h2>
      <p className="muted">{description}</p>
      {children}
    </div>
  );
}
export function LoadingState({ preview = true }: { preview?: boolean } = {}) {
  return (
    <div role="status" aria-live="polite" className="loading-state">
      <p>{preview ? "Loading preview…" : "Loading workspace…"}</p>
      {[1, 2, 3].map((i) => (
        <div className="skeleton" key={i} />
      ))}
      <span className="muted">
        {preview
          ? "Illustrative loading state. No connection is in progress."
          : "Loading your persisted owner data."}
      </span>
    </div>
  );
}
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      title="We couldn’t load this preview"
      description="This is an illustrative connection error. Your actual workspace is not connected in P1."
      icon="shield"
    >
      <Button variant="secondary" onClick={onRetry}>
        Return to sample view
      </Button>
    </EmptyState>
  );
}
export function PreviewStateControl({
  value,
  onChange,
}: {
  value: PreviewState;
  onChange: (state: PreviewState) => void;
}) {
  const id = useId();
  return (
    <details className="state-control">
      <summary>Explore preview states</summary>
      <label htmlFor={id}>Illustrative screen state</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as PreviewState)}
      >
        <option value="sample">Synthetic sample</option>
        <option value="empty">Empty workspace</option>
        <option value="loading">Loading</option>
        <option value="error">Connection error</option>
      </select>
    </details>
  );
}
export function Toast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="toast" role="status" aria-live="polite">
      <Icon name="check" />
      <span>{message}</span>
      <button
        className="icon-button"
        aria-label="Dismiss notification"
        onClick={onDismiss}
      >
        <Icon name="close" />
      </button>
    </div>
  );
}
// Native modal provides focus containment, Escape dismissal and background inertness.
export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  useEffect(() => {
    if (open && !dialog.current?.open) {
      previousFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      dialog.current?.showModal();
      dialog.current?.querySelector<HTMLElement>("button")?.focus();
    }
    if (!open && dialog.current?.open) {
      dialog.current.close();
      previousFocus.current?.focus();
    }
  }, [open]);
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const targets = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]",
          ),
        );
        const first = targets[0];
        const last = targets.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      className="dialog"
    >
      <div className="dialog-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
