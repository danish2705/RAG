import { Badge } from "../ui/badge";

type StatusLevel = 'Critical' | 'Major' | 'Minor' | 'High' | 'Medium' | 'Low' | 'None';

interface StatusBadgeProps {
  status: StatusLevel;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    Critical: 'bg-red-100 text-red-800 border-red-200',
    Major: 'bg-orange-100 text-orange-800 border-orange-200',
    Minor: 'bg-green-100 text-green-800 border-green-200',
    High: 'bg-red-100 text-red-800 border-red-200',
    Medium: 'bg-orange-100 text-orange-800 border-orange-200',
    Low: 'bg-green-100 text-green-800 border-green-200',
    None: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <Badge variant="outline" className={`${variants[status]} ${className || ''}`}>
      {status}
    </Badge>
  );
}