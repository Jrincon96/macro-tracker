import Link from "next/link";

// Auth is enforced in proxy.ts. Pages read the user inside the loading.tsx Suspense boundary.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex flex-1 flex-col pb-20">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 border-t bg-background pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto flex max-w-md justify-around py-2 text-sm">
          <li><Link href="/today" className="px-3 py-2">Today</Link></li>
        </ul>
      </nav>
    </div>
  );
}
