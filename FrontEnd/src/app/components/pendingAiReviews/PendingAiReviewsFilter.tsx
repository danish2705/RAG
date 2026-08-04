import { Search } from "lucide-react";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type {
  LlmRetryStatus,
  LlmRetryEntityType,
} from "../../services/llmRetryApi";

interface PendingAiReviewsFiltersProps {
  statusFilter: LlmRetryStatus | "all";
  onStatusFilterChange: (val: LlmRetryStatus | "all") => void;
  entityTypeFilter: LlmRetryEntityType | "all";
  onEntityTypeFilterChange: (val: LlmRetryEntityType | "all") => void;
  search: string;
  onSearchChange: (val: string) => void;
}

export function PendingAiReviewsFilters({
  statusFilter,
  onStatusFilterChange,
  entityTypeFilter,
  onEntityTypeFilterChange,
  search,
  onSearchChange,
}: PendingAiReviewsFiltersProps) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[320px]">
        <Search
          className="
  absolute
  left-3
  top-1/2
  h-4
  w-4
  -translate-y-1/2
  text-slate-400
  dark:text-slate-500
"
        />

        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="
  h-10
  pl-10
  rounded-lg
  border
  border-slate-200
  bg-white
  text-sm
  text-slate-700
  shadow-sm
  placeholder:text-slate-400
  transition-all
  duration-200
  focus-visible:border-blue-500
  focus-visible:ring-2
  focus-visible:ring-blue-500/10

  dark:border-slate-700
  dark:bg-slate-900
  dark:text-slate-200
  dark:placeholder:text-slate-500
"
        />
      </div>

      {/* Status */}
      <Select
        value={statusFilter}
        onValueChange={(value) =>
          onStatusFilterChange(value as LlmRetryStatus | "all")
        }
      >
        <SelectTrigger
          className="
  !h-10
  w-[150px]
  rounded-lg
  border
  border-slate-200
  bg-white
  px-3
  text-sm
  text-slate-700
  shadow-sm
  transition-all
  duration-200
  focus:border-blue-500
  focus:ring-2
  focus:ring-blue-500/10

  dark:border-slate-700
  dark:bg-slate-900
  dark:text-slate-200
"
        >
          <SelectValue placeholder="Status" />
        </SelectTrigger>

        <SelectContent
          className="
  rounded-lg
  border
  border-slate-200
  bg-white
  p-1
  shadow-xl

  dark:border-slate-700
  dark:bg-slate-900
"
        >
          <SelectItem
            value="all"
            className="
  rounded-md
  text-sm
  text-slate-700

  focus:bg-blue-50
  focus:text-blue-700

  dark:text-slate-200
  dark:focus:bg-slate-800
  dark:focus:text-blue-400
"
          >
            All Statuses
          </SelectItem>

          <SelectItem
            value="pending"
            className="
  rounded-md
  text-sm
  text-slate-700

  focus:bg-blue-50
  focus:text-blue-700

  dark:text-slate-200
  dark:focus:bg-slate-800
  dark:focus:text-blue-400
"
          >
            Pending
          </SelectItem>

          <SelectItem
            value="not_executed"
            className="
  rounded-md
  text-sm
  text-slate-700

  focus:bg-blue-50
  focus:text-blue-700

  dark:text-slate-200
  dark:focus:bg-slate-800
  dark:focus:text-blue-400
"
          >
            Not Executed
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Pipeline */}
      <Select
        value={entityTypeFilter}
        onValueChange={(value) =>
          onEntityTypeFilterChange(value as LlmRetryEntityType | "all")
        }
      >
        <SelectTrigger
          className="
  !h-10
  w-[150px]
  rounded-lg
  border
  border-slate-200
  bg-white
  px-3
  text-sm
  text-slate-700
  shadow-sm
  transition-all
  duration-200
  focus:border-blue-500
  focus:ring-2
  focus:ring-blue-500/10

  dark:border-slate-700
  dark:bg-slate-900
  dark:text-slate-200
"
        >
          <SelectValue placeholder="Pipeline" />
        </SelectTrigger>

        <SelectContent
          className="
  rounded-lg
  border
  border-slate-200
  bg-white
  p-1
  shadow-xl

  dark:border-slate-700
  dark:bg-slate-900
"
        >
          <SelectItem
            value="all"
            className="
  rounded-md
  text-sm
  text-slate-700

  focus:bg-blue-50
  focus:text-blue-700

  dark:text-slate-200
  dark:focus:bg-slate-800
  dark:focus:text-blue-400
"
          >
            All Pipelines
          </SelectItem>

          <SelectItem
            value="Deviation"
            className="
  rounded-md
  text-sm
  text-slate-700

  focus:bg-blue-50
  focus:text-blue-700

  dark:text-slate-200
  dark:focus:bg-slate-800
  dark:focus:text-blue-400
"
          >
            Deviation
          </SelectItem>

          <SelectItem
            value="Change Control"
            className="
  rounded-md
  text-sm
  text-slate-700

  focus:bg-blue-50
  focus:text-blue-700

  dark:text-slate-200
  dark:focus:bg-slate-800
  dark:focus:text-blue-400
"
          >
            Change Control
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
