"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendCode, verifyCode, type LoginState } from "./actions";

export function LoginForm() {
  const [emailState, emailAction, sending] = useActionState<LoginState, FormData>(sendCode, { step: "email" });
  const [codeState, codeAction, verifying] = useActionState<LoginState, FormData>(verifyCode, { step: "code" });
  const [editing, setEditing] = useState(false);

  const onCodeStep = emailState.step === "code" && !editing;

  if (!onCodeStep) {
    return (
      <form action={(fd) => { setEditing(false); emailAction(fd); }} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" inputMode="email"
            defaultValue={emailState.email} required autoFocus />
        </div>
        {emailState.error && <p className="text-sm text-destructive">{emailState.error}</p>}
        <Button type="submit" disabled={sending}>{sending ? "Sending…" : "Email me a code"}</Button>
      </form>
    );
  }

  return (
    <form action={codeAction} className="flex flex-col gap-4">
      <input type="hidden" name="email" value={emailState.email} />
      <p className="text-sm text-muted-foreground">
        We sent a code to <span className="font-medium text-foreground">{emailState.email}</span>.
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Code</Label>
        <Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code"
          pattern="[0-9 ]*" maxLength={12} required autoFocus />
      </div>
      {codeState.error && <p className="text-sm text-destructive">{codeState.error}</p>}
      <Button type="submit" disabled={verifying}>{verifying ? "Checking…" : "Sign in"}</Button>
      <Button type="button" variant="ghost" onClick={() => setEditing(true)}>Use a different email</Button>
    </form>
  );
}
