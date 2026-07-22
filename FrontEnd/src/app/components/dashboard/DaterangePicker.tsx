import { useState } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../ui/utils";

// Converts a local Date to a "YYYY-MM-DD" string using local calendar
// fields (not UTC), so the selected day doesn't shift across timezones
// when it's sent to the API as a date-only filter.
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface DateRangePickerProps {
  range: DateRange | undefined;
  onRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

// Calendar-based date range selector for the Dashboard page. Renders the
// currently selected range on a button that opens a two-month range
// calendar; picking a range (or clearing it) reports back to the parent,
// which is responsible for refetching dashboard data scoped to that range.
export function DateRangePicker({
  range,
  onRangeChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const label = !range?.from
    ? "All time"
    : range.to
      ? `${formatDate(range.from)} – ${formatDate(range.to)}`
      : `${formatDate(range.from)} – …`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 rounded-lg font-semibold border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-400 dark:hover:bg-blue-500/25 dark:hover:text-blue-300",
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        side="bottom"
        avoidCollisions
      >
        <Calendar
          mode="range"
          defaultMonth={range?.from}
          selected={range}
          onSelect={onRangeChange}
          numberOfMonths={2}
          initialFocus
          classNames={{
            day_selected:
              "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white dark:bg-blue-500 dark:hover:bg-blue-500 dark:focus:bg-blue-500",
            day_range_start:
              "day-range-start bg-blue-600 text-white hover:bg-blue-600 hover:text-white dark:bg-blue-500 dark:hover:bg-blue-500",
            day_range_end:
              "day-range-end bg-blue-600 text-white hover:bg-blue-600 hover:text-white dark:bg-blue-500 dark:hover:bg-blue-500",
            day_range_middle:
              "aria-selected:bg-blue-100 aria-selected:text-blue-900 dark:aria-selected:bg-blue-500/20 dark:aria-selected:text-blue-300",
            day_today:
              "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
          }}
        />
        <div className="flex items-center justify-between gap-2 border-t border-border/60 p-3">
          <Button
            variant="ghost"
            size="sm"
            disabled={!range?.from}
            onClick={() => {
              onRangeChange(undefined);
              setOpen(false);
            }}
            className="gap-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
          <Button
            size="sm"
            onClick={() => setOpen(false)}
            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}