import React from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { AlertTriangle, FileQuestion, XCircle } from "lucide-react";

interface GuardProps {
  onGoBack: () => void;
}

interface InsufficientInputGuardProps extends GuardProps {
  reason: string;
}

// Shown when there's no pipeline result at all (e.g. user navigated here
// directly without going through intake).
export const NoResultGuard: React.FC<GuardProps> = ({ onGoBack }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <FileQuestion className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">
            No classification result found.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Please go back and submit the event intake form first.
          </p>
          <Button className="mt-4" onClick={onGoBack}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Shown when the AI determined the submitted input didn't have enough
// information to classify.
export const InsufficientInputGuard: React.FC<InsufficientInputGuardProps> = ({
  reason,
  onGoBack,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">
            Insufficient input to classify this event.
          </p>
          <p className="text-sm text-muted-foreground mt-1">{reason}</p>
          <Button className="mt-4" onClick={onGoBack}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Shown when the AI classification stage failed outright (couldn't be
// parsed / errored).
export const ClassificationFailedGuard: React.FC<GuardProps> = ({
  onGoBack,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <XCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">
            Classification failed unexpectedly.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Please go back and try submitting the event again.
          </p>
          <Button className="mt-4" onClick={onGoBack}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};