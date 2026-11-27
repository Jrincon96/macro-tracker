import * as React from "react";
import { cn } from "cn";

/** Native <select>: uses the iOS wheel picker on iPhone, which beats a custom dropdown on mobile. */
function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "h-8 w-full min-w-0 appearance-none rounded-lg border border-input bg-transparent bg-[length:16px] bg-[right_0.5rem_center] bg-no-repeat px-2.5 pr-8 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30",
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
        className,
      )}
      {...props}
    />
  );
}

export { NativeSelect };
