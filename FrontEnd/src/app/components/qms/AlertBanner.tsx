import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

type AlertType = 'error' | 'warning' | 'success' | 'info';

interface AlertBannerProps {
  type: AlertType;
  title?: string;
  message: string;
  className?: string;
}

export function AlertBanner({ type, title, message, className }: AlertBannerProps) {
  const config = {
    error: {
      icon: AlertCircle,
      className: 'border-red-200 bg-red-50 text-red-900',
    },
    warning: {
      icon: AlertTriangle,
      className: 'border-orange-200 bg-orange-50 text-orange-900',
    },
    success: {
      icon: CheckCircle,
      className: 'border-green-200 bg-green-50 text-green-900',
    },
    info: {
      icon: Info,
      className: 'border-blue-200 bg-blue-50 text-blue-900',
    },
  };

  const { icon: Icon, className: typeClassName } = config[type];

  return (
    <Alert className={`${typeClassName} ${className || ''}`}>
      <Icon className="h-4 w-4" />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
