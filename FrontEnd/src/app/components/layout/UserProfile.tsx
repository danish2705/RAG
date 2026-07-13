import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { User, Shield, Building, Mail, Key, Clock, Award } from "lucide-react";

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-5 w-5 text-blue-600" /> Administrative Profile
          </DialogTitle>
          <DialogDescription>
            Current global user session and QMS system privileges.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Header Card */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/60 border border-border">
            <div className="h-14 w-14 rounded-full bg-blue-600/10 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
              <User className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-foreground">
                  Anurag Sharma
                </h3>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800 text-xs">
                  Global Admin
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Senior QMS Architect & Principal Lead
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted/40 transition-colors">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Building className="h-4 w-4 text-blue-500" /> Department:
              </span>
              <span className="font-medium text-foreground">
                Quality Assurance & Compliance
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted/40 transition-colors">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 text-blue-500" /> Email:
              </span>
              <span className="font-medium text-foreground">
                anurag.sharma@qms-enterprise.com
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted/40 transition-colors">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Key className="h-4 w-4 text-blue-500" /> Access Level:
              </span>
              <span className="font-medium text-green-600 dark:text-green-400 font-semibold">
                Full Read / Write / Override
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted/40 transition-colors">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-blue-500" /> Current Session:
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                Active (IP: 192.168.1.104)
              </span>
            </div>
          </div>

          {/* Roles & Permissions */}
          <div className="space-y-2 border-t border-border pt-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Award className="h-3.5 w-3.5" /> Assigned Regulatory Gateways
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge variant="outline" className="text-xs">21 CFR Part 11</Badge>
              <Badge variant="outline" className="text-xs">EU Annex 11</Badge>
              <Badge variant="outline" className="text-xs">CAPA Sign-off</Badge>
              <Badge variant="outline" className="text-xs">AI Override Authority</Badge>
              <Badge variant="outline" className="text-xs">Audit Log Export</Badge>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-border pt-3">
          <Button
            variant="default"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => onOpenChange(false)}
          >
            Close Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};