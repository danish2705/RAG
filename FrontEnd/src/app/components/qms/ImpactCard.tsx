import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { StatusBadge } from "./StatusBadge";

type StatusLevel = 'High' | 'Medium' | 'Low' | 'None';

interface ImpactCardProps {
  category: string;
  status: StatusLevel;
  description: string;
}

export function ImpactCard({ category, status, description }: ImpactCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          {category}
          <StatusBadge status={status} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
}
