import { PenSquare, Search } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export function RecordsFilterBar({
  submittedByFilter,
  onSubmittedByFilterChange,
  classificationFilter,
  onClassificationFilterChange,
  resultCount,
}: {
  submittedByFilter: string;
  onSubmittedByFilterChange: (value: string) => void;
  classificationFilter: string;
  onClassificationFilterChange: (value: string) => void;
  resultCount: number;
}) {
  const navigate = useNavigate();

  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      {/* Left Side */}
      <Button
        onClick={() => navigate("/deviation")}
        className="
          h-10
          rounded-lg
          bg-blue-600
          px-4
          text-sm
          font-medium
          text-white
          shadow-sm
          transition-colors
          hover:bg-blue-700
          focus-visible:ring-2
          focus-visible:ring-blue-500/20
          flex
          items-center
          gap-2
        "
      >
        <PenSquare className="h-4 w-4" />
        New Case
      </Button>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative w-[380px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />

          <Input
            placeholder="Search by submitted user or query..."
            value={submittedByFilter}
            onChange={(e) => onSubmittedByFilterChange(e.target.value)}
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

        {/* Type Filter */}
        <Select
          value={classificationFilter}
          onValueChange={onClassificationFilterChange}
        >
          <SelectTrigger
            className="
  !h-10
  w-[170px]
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
            <SelectValue placeholder="All Types" />
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
              All Types
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

        {/* Result Count */}
        <div
          className="
  flex
  h-10
  min-w-[95px]
  items-center
  justify-center
  rounded-lg
  bg-slate-50
  px-3
  text-sm
  font-semibold

  dark:bg-transparent
"
        >
          <span className="font-bold text-blue-600">{resultCount}</span>

          <span className="ml-1 text-slate-700 dark:text-slate-300">
            result{resultCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </div>
  );
}
