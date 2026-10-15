"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Public synthetic-preview marker, deliberately NOT an authentication session.
// P2 must replace this guard; this marker must never authorize private APIs/data.
export async function enterPreview() {
  // P2 replaces public preview access with real owner authentication.
  // Retain the legacy action for old links; never issue an access marker.
  redirect("/login");
}
export async function exitPreview() {
  (await cookies()).delete("kai247_preview");
  redirect("/login");
}
