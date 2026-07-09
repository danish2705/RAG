import React from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { AlertTriangle } from "lucide-react";

interface GuardProps {
  onGoBack: () => void;
}

interface InsufficientGuardProps extends GuardProps {
  reason: string;
}

export const NoResultGuard: React.FC<GuardProps> = ({ onGoBack }) => (
  <div className="p-6 w-full">
    <Card>
      <CardContent className="py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">
          No analysis result found.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Please go back and submit a quality event first.
        </p>
        <Button className="mt-4" onClick={onGoBack}>
          Go Back
        </Button>
      </CardContent>
    </Card>
  </div>
);

export const InsufficientInputGuard: React.FC<InsufficientGuardProps> = ({
  reason,
  onGoBack,
}) => (
  <div className="p-6 w-full">
    <Card>
      <CardContent className="py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">
          This submission couldn&apos;t be classified.
        </p>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          {reason}
        </p>
        <Button className="mt-4" onClick={onGoBack}>
          Go Back and Add More Detail
        </Button>
      </CardContent>
    </Card>
  </div>
);

export const ClassificationFailedGuard: React.FC<GuardProps> = ({
  onGoBack,
}) => (
  <div className="p-6 w-full">
    <Card>
      <CardContent className="py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
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