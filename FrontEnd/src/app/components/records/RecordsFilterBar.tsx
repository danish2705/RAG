import { Search } from "lucide-react";
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
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search submitted by, query…"
          value={submittedByFilter}
          onChange={(e) => onSubmittedByFilterChange(e.target.value)}
          className="pl-9 h-10 bg-muted/50 border-border"
        />
      </div>

      <Select value={classificationFilter} onValueChange={onClassificationFilterChange}>
        <SelectTrigger className="h-10 w-[180px] bg-muted/50 border-border">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="Deviation">Deviation</SelectItem>
          <SelectItem value="Change Control">Change Control</SelectItem>
        </SelectContent>
      </Select>

      <span className="text-sm text-muted-foreground whitespace-nowrap pl-1">
        {resultCount} result{resultCount === 1 ? "" : "s"}
      </span>
    </div>
  );
}