"use client";
import { useState } from "react";
import { Button } from "./ui";
export function LoginForm({
  configured,
  unavailable,
}: {
  configured: boolean;
  unavailable: boolean;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError("");
        const data = new FormData(e.currentTarget);
        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: data.get("email"),
              password: data.get("password"),
            }),
          });
          const result = await response.json();
          if (!response.ok)
            throw new Error(result.error?.message ?? "Sign-in failed.");
          window.location.replace(new URL("/app", window.location.origin).href);
        } catch (error) {
          setError(error instanceof Error ? error.message : "Sign-in failed.");
        } finally {
          setPending(false);
        }
      }}
    >
      {(unavailable || !configured) && (
        <p className="notice notice-warning">
          Owner sign-in is temporarily unavailable. Ask the workspace operator
          to finish setup or restore the connection.
        </p>
      )}
      <fieldset disabled={!configured || pending} className="login-fields">
        <legend className="sr-only">Owner sign-in</legend>
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          placeholder="you@yourbusiness.com"
          maxLength={254}
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          maxLength={128}
          autoComplete="current-password"
        />
        <Button type="submit">{pending ? "Signing in…" : "Sign in"}</Button>
      </fieldset>
      {error && (
        <p className="field-error" role="alert" style={{ marginTop: 16 }}>
          {error}
        </p>
      )}
      <p className="small muted login-disclaimer">
        Owner accounts are provisioned by the operator. A synthetic sandbox
        account is clearly labeled and isolated from other owners.
      </p>
    </form>
  );
}
