"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteMeal } from "@/app/(app)/log/actions";

export function DeleteMealButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button type="button" size="icon-sm" variant="ghost" aria-label={`Delete ${name}`} disabled={pending}
      onClick={() => {
        if (!confirm(`Delete "${name}"?`)) return;
        startTransition(async () => {
          const res = await deleteMeal(id);
          if (!res.ok) alert(res.error);
        });
      }}>
      {pending ? "…" : "✕"}
    </Button>
  );
}
