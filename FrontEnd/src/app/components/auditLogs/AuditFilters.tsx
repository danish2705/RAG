import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
            />
          </div>
          <div>
            <Input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
            />
          </div>
          <div>
            <Select
              value={sourceFilter}
              onValueChange={(val) =>
                onSourceFilterChange(val as AuditSource | "all")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="human">Human Only</SelectItem>
                <SelectItem value="ai">AI Only</SelectItem>
                <SelectItem value="system">System Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input
              placeholder="Search actions..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
