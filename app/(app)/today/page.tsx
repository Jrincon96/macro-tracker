import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export default async function TodayPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Today</h1>
      <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
      <form action={signOut}>
        <Button variant="outline" type="submit">Sign out</Button>
      </form>
    </div>
  );
}
