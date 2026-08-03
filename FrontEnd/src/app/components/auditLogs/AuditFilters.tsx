import { Search } from "lucide-react";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { AuditSource } from "../../types/audit";

interface AuditFiltersProps {
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  sourceFilter: AuditSource | "all";
  onSourceFilterChange: (val: AuditSource | "all") => void;
  search: string;
  onSearchChange: (val: string) => void;
}

export function AuditFilters({
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  sourceFilter,
  onSourceFilterChange,
  search,
  onSearchChange,
}: AuditFiltersProps) {
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
          placeholder="Search activity..."
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

      {/* User Type */}
      <Select
        value={sourceFilter}
        onValueChange={(value) =>
          onSourceFilterChange(value as AuditSource | "all")
        }
      >
        <SelectTrigger
          className="
  !h-10
  w-[180px]
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
  focus:ring-2
  focus:ring-blue-500/10
  focus:border-blue-500

  dark:border-slate-700
  dark:bg-slate-900
  dark:text-slate-200
"
        >
          <SelectValue placeholder="User Type" />
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
            All Users
          </SelectItem>

          <SelectItem
            value="human"
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
            Human Only
          </SelectItem>

          <SelectItem
            value="system"
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
            System Only
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Start Date */}
      <Input
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="
  h-10
  w-[150px]
  rounded-lg
  border
  border-slate-200
  bg-white
  text-sm
  text-slate-700
  shadow-sm
  transition-all
  duration-200
  focus-visible:border-blue-500
  focus-visible:ring-2
  focus-visible:ring-blue-500/10

  dark:border-slate-700
  dark:bg-slate-900
  dark:text-slate-200
"
      />

      {/* End Date */}
      <Input
        type="date"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="
  h-10
  w-[150px]
  rounded-lg
  border
  border-slate-200
  bg-white
  text-sm
  text-slate-700
  shadow-sm
  transition-all
  duration-200
  focus-visible:border-blue-500
  focus-visible:ring-2
  focus-visible:ring-blue-500/10

  dark:border-slate-700
  dark:bg-slate-900
  dark:text-slate-200
"
      />
    </div>
  );
}
