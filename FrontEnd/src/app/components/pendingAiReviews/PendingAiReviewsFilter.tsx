import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Select
              value={statusFilter}
              onValueChange={(val) =>
                onStatusFilterChange(val as LlmRetryStatus | "all")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="not_executed">Not Executed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select
              value={entityTypeFilter}
              onValueChange={(val) =>
                onEntityTypeFilterChange(val as LlmRetryEntityType | "all")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pipeline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pipelines</SelectItem>
                <SelectItem value="Deviation">Deviation</SelectItem>
                <SelectItem value="Change Control">Change Control</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input
              placeholder="Search by name or reference code..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
