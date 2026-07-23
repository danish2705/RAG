import React from "react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Download,
  X,
  FileText,
  User,
  Calendar,
  Tag,
  ShieldCheck,
} from "lucide-react";
import { formatTimestamp } from "../../utils/timezone";

interface CaseViewModalProps {
  record: any | null;
  onClose: () => void;
}

export const CaseViewModal: React.FC<CaseViewModalProps> = ({
  record,
  onClose,
}) => {
  if (!record) return null;

  // Helper to generate and download a text summary report
  const handleDownloadSummary = () => {
    const reportContent = [
      `====================================================`,
      `           QUALITY MANAGEMENT SYSTEM REPORT          `,
      `====================================================`,
      `Record ID:       ${record.uiId || record.id || "N/A"}`,
      `Submitted By:    ${record.submittedBy || record.user || "N/A"}`,
      `Classification:  ${record.classification || "N/A"}`,
      `Saved Timestamp: ${formatTimestamp(record.savedOn || record.timestamp)}`,
      `----------------------------------------------------`,
      `EVENT QUERY / DESCRIPTION:`,
      `${record.query || record.description || "No description provided."}`,
      `----------------------------------------------------`,
      `AI RATIONALE / SUMMARY:`,
      `${Array.isArray(record.rationale) ? record.rationale.join("\n") : record.rationale || record.summary || "N/A"}`,
      `====================================================`,
      `Report Generated: ${formatTimestamp(new Date())}`,
    ].join("\n");

    const blob = new Blob([reportContent], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `QMS_Summary_${record.uiId || "Record"}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getBadgeColor = (type: string) => {
    if (type === "Deviation")
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200";
    if (type === "Change Control")
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200";
    return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200";
  };

  return (
    <Dialog open={!!record} onOpenChange={(open) => !open && onClose()}>
      {/* Modal Container */}
      <DialogContent className="!max-w-none sm:!max-w-none w-[70vw] max-h-[90vh] p-0 overflow-hidden flex flex-col bg-card shadow-2xl rounded-xl">
        
        {/* Sticky Fixed Header with z-50 to ensure it always stays on top during scroll */}
        <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-card/95 backdrop-blur-md border-b border-border shrink-0 shadow-sm">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="p-2 rounded-lg bg-blue-600/10 border border-blue-200 dark:border-blue-800 shrink-0">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2 truncate">
                <span className="truncate">{record.uiId || record.id || "Case Record Details"}</span>
                <Badge
                  className={`text-xs font-semibold px-2 py-0.5 shrink-0 ${getBadgeColor(record.classification)}`}
                >
                  {record.classification || "Quality Event"}
                </Badge>
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                Complete audit snapshot and AI analysis evaluation
              </p>
            </div>
          </div>

          {/* Right-Aligned Sticky Action Buttons with increased gap-4 and margins */}
          <div className="flex items-center gap-4 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadSummary}
              className="bg-background hover:bg-muted font-medium text-xs h-9 px-3.5 border-border shadow-sm flex items-center gap-1.5 mr-1"
            >
              <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Download Summary</span>
            </Button>

            {/* Extreme Right Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0 flex items-center justify-center"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/30 border border-border/60">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-blue-500 shrink-0" />
              <div>
                <span className="text-xs font-medium text-muted-foreground block">
                  Submitted By
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {record.submittedBy || record.user || "N/A"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-500 shrink-0" />
              <div>
                <span className="text-xs font-medium text-muted-foreground block">
                  Saved Date & Time (IST)
                </span>
                <span className="text-sm font-semibold text-foreground font-mono">
                  {formatTimestamp(record.savedOn || record.timestamp)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" />
              <div>
                <span className="text-xs font-medium text-muted-foreground block">
                  System Status
                </span>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  Verified & Archived
                </span>
              </div>
            </div>
          </div>

          {/* Event Query / Description */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <Tag className="h-4 w-4 text-blue-500" /> Event Query &
              Description
            </h4>
            <div className="p-4 rounded-xl bg-background border border-border text-sm text-foreground leading-relaxed shadow-sm font-mono whitespace-pre-wrap">
              {record.query ||
                record.description ||
                "No specific query details available for this case."}
            </div>
          </div>

          {/* AI Rationale / Full Analysis */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <FileText className="h-4 w-4 text-blue-500" /> AI Classification
              Rationale & Summary
            </h4>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/80 text-sm text-muted-foreground leading-relaxed space-y-2">
              {Array.isArray(record.rationale) ? (
                <ul className="space-y-2">
                  {record.rationale.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>
                  {record.rationale ||
                    record.summary ||
                    "AI rationale was recorded automatically during case intake."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-muted/40 border-t border-border flex justify-end shrink-0">
          <Button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-6"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};