import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

// The static part renders instantly; the user-specific part streams in.
export default function TodayPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Today</h1>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <Account />
      </Suspense>
    </div>
  );
}

async function Account() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <>
      <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
      <form action={signOut}>
        <Button variant="outline" type="submit">Sign out</Button>
      </form>
    </>
  );
}
