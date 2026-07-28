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
            `
    h-10
    min-w-[120px]
    justify-start
    gap-4
    rounded-xl
    border
    border-slate-200
    bg-white
    px-4
    text-sm
    font-medium
    text-slate-700
    shadow-sm
    transition-all
    duration-200

    hover:border-blue-300
    hover:bg-blue-50/60
    hover:shadow-md

    focus:ring-2
    focus:ring-blue-500/20

    dark:border-slate-700
    dark:bg-slate-900
    dark:text-slate-200
    dark:hover:border-blue-500
    dark:hover:bg-slate-800
    `,
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 text-blue-600" />
          <span className="truncate flex-1 text-left">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="
w-auto
overflow-hidden
rounded-2xl
border
border-slate-200
bg-white
p-0
shadow-2xl
dark:border-slate-700
dark:bg-slate-900
"
        align="start"
        side="bottom"
        avoidCollisions
      >
        <div className="border-b bg-slate-50 px-5 py-4 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Select Date Range
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Choose a start and end date for filtering dashboard data.
          </p>
        </div>
        <Calendar
          mode="range"
          defaultMonth={range?.from}
          selected={range}
          onSelect={onRangeChange}
          numberOfMonths={2}
          initialFocus
          classNames={{
            months: "flex gap-6",
            month: "space-y-4",

            caption:
              "relative flex items-center justify-center h-10 mb-2",

            caption_label:
              "text-sm font-semibold text-slate-900 dark:text-slate-100",

            nav: "absolute inset-x-0 top-5 flex items-center justify-between",

            nav_button:
              "h-8 w-8 flex items-center justify-center rounded-lg border bg-white shadow-sm hover:bg-blue-50",

            nav_button_previous: "absolute left-2",

            nav_button_next: "absolute right-2",


            head_cell:
              "h-10 w-10 text-xs font-semibold uppercase text-slate-500",

            cell: "h-10 w-10 p-0",

            day:
              "relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20",

            day_today:
              "rounded-full border border-blue-400 font-semibold text-blue-700 dark:border-blue-500 dark:text-blue-300",

            day_selected:
              "rounded-full bg-blue-500 text-white font-semibold hover:bg-blue-500 focus:bg-blue-500",

            day_range_start:
              "rounded-full bg-blue-500 text-white font-semibold",

            day_range_end:
              "rounded-full bg-blue-500 text-white font-semibold",

            day_range_middle:
              "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200",
          }}

        />

        <div className="flex items-center justify-between border-t bg-slate-50/60 px-4 py-3 dark:bg-slate-900/60">

          <Button
            variant="ghost"
            size="sm"
            disabled={!range?.from}
            onClick={() => {
              onRangeChange(undefined);
              setOpen(false);
            }}
            className="
        rounded-lg
        text-slate-600
        hover:bg-red-50
        hover:text-red-600
        dark:text-slate-300
        dark:hover:bg-red-900/20
        "
          >
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>

          <Button
            size="sm"
            onClick={() => setOpen(false)}
            className="
        rounded-lg
        bg-blue-600
        px-5
        shadow-sm
        hover:bg-blue-700
        hover:shadow-md
        "
          >
            Apply
          </Button>

        </div>
      </PopoverContent>
    </Popover>
  );
}