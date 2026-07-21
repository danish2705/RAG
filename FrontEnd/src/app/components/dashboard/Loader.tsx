import { Loader2 } from "lucide-react";

// Centered spinner + label inside a card, matching the existing
// "Loading activity log..." pattern used elsewhere in the app.
export function Loader({
  message,
  className = "",
  minHeight = "h-64",
}: {
  message: string;
  className?: string;
  minHeight?: string;
}) {
  return (
    <div
      className={`bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none flex flex-col items-center justify-center gap-3 ${minHeight} ${className}`}
    >
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {message}
      </p>
    </div>
  );
}