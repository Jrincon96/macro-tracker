"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  step: "email" | "code";
  email?: string;
  error?: string;
};

const emailSchema = z.email();
const codeSchema = z.string().regex(/^\d{6,10}$/, "Enter the code from your email");

function isAllowed(email: string) {
  const allowed = process.env.ALLOWED_EMAILS?.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return !allowed?.length || allowed.includes(email.toLowerCase());
}

export async function sendCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = emailSchema.safeParse(String(formData.get("email") ?? "").trim());
  if (!parsed.success) return { step: "email", error: "Enter a valid email" };
  const email = parsed.data;

  // Single-user app: silently refuse other emails so the app doesn't reveal who is allowed.
  if (!isAllowed(email)) return { step: "code", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) return { step: "email", email, error: error.message };
  return { step: "code", email };
}

export async function verifyCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const parsed = codeSchema.safeParse(String(formData.get("code") ?? "").replace(/\s/g, ""));
  if (!parsed.success) return { step: "code", email, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token: parsed.data, type: "email" });
  if (error) return { step: "code", email, error: "That code is invalid or expired" };
  redirect("/today");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
