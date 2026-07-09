export function parseRationaleLines(text: string): string[] {
  return text.split("\n").map((s) => s.trim()).filter(Boolean);
}

export function getClassificationBadgeClass(type: string): string {
  if (type === "Deviation")
    return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
  if (type === "Change Control")
    return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
  return "bg-muted text-muted-foreground border-border";
}