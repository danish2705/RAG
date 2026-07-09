import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export function AuditFilters() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Input type="date" placeholder="Start Date" />
          </div>
          <div>
            <Input type="date" placeholder="End Date" />
          </div>
          <div>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="human">Human Only</SelectItem>
                <SelectItem value="ai">AI Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input placeholder="Search actions..." />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}