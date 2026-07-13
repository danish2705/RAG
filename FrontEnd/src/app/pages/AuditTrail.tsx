import { useState } from "react";
import { AIAssistant } from "../components/chat/AiAssistant";
import { AuditFilters } from "../components/auditTrail/AuditFilters";
import { ActivityLogTable } from "../components/auditTrail/ActivityLogTable";
import { auditTrailData } from "../mocks/mockAudit";

export function AuditTrail() {
  const [chatOpen, setChatOpen] = useState(false);

  const entries = auditTrailData.map((entry) => ({
    ...entry,
    type: entry.type as "ai" | "human",
  }));

  return (
    <div className="relative h-full w-full">
      <div
        className={`h-full p-6 overflow-y-auto transition-[margin] duration-200 ${chatOpen ? "mr-80" : ""}`}
      >
        <div className="space-y-6">
          <AuditFilters />
          <ActivityLogTable entries={entries} />
        </div>
      </div>
      <div className="fixed top-16 right-0 bottom-0 z-40">
        <AIAssistant
          isOpen={chatOpen}
          onToggle={() => setChatOpen(!chatOpen)}
        />
      </div>
    </div>
  );
}
