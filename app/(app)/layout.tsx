import { BottomNav } from "@/components/bottom-nav";

// Auth is enforced in proxy.ts. Pages stay non-async and read the user/database
// in child components wrapped in <Suspense> (needed for instant navigation).
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex flex-1 flex-col pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
