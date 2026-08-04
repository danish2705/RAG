import { useState } from "react";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Textarea } from "../ui/textarea";
import { useAuth } from "../../context/AuthContext";
import type { CaseComment } from "../../services/commentsApi";
import { formatTimestamp } from "../../utils/timezone";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// A little deterministic color per commenter so the avatar bubbles aren't
// all the same shade — purely cosmetic, based on the name's char codes.
const AVATAR_COLORS = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-fuchsia-500",
];
function colorOf(name: string) {
  const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

// A "Comments" trigger (with a count badge once there are any) that opens a
// focused comment sheet — modeled after Instagram's comments panel: a
// scrollable thread of everyone's comments up top, and a single add-comment
// bar pinned to the bottom. Meant to sit in a Card header next to the
// section title — e.g. Classification, Impact Assessment, Root Cause, CAPA.
export function SectionComments({
  sectionLabel,
  comments,
  onAdd,
}: {
  sectionLabel: string;
  comments: CaseComment[];
  onAdd: (text: string) => Promise<unknown>;
}) {
  const { user } = useAuth();
  const commenterName = user?.displayName || user?.username || "You";
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const text = draft.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onAdd(text);
      setDraft("");
    } catch {
      setError("Couldn't save the comment. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-7 px-2 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Comments
        {comments.length > 0 && (
          <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-semibold">
            {comments.length}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="z-[60] p-0 gap-0 flex flex-col w-[92vw] sm:w-full sm:max-w-md h-[70vh] max-h-[560px] overflow-hidden rounded-xl">
          <DialogHeader className="px-4 py-3 border-b border-border shrink-0 text-left">
            <DialogTitle className="text-sm font-semibold">
              Comments
              <span className="ml-1.5 font-normal text-muted-foreground">
                · {sectionLabel}
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Thread */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {comments.length > 0 ? (
              comments.map((c) => (
                <div key={c.id} className="flex items-start gap-3">
                  <Avatar className="size-8 mt-0.5">
                    <AvatarFallback
                      className={`${colorOf(c.created_by)} text-white text-[11px] font-semibold`}
                    >
                      {initialsOf(c.created_by)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground leading-snug break-words">
                      <span className="font-semibold mr-1.5">
                        {c.created_by}
                      </span>
                      {c.comment}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatTimestamp(c.created_at)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-10">
                <MessageCircle className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No comments yet
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Be the first to comment on {sectionLabel}.
                </p>
              </div>
            )}
          </div>

          {/* Composer, pinned to the bottom like a reel's comment bar */}
          <div className="shrink-0 border-t border-border px-3 py-3">
            {error && (
              <p className="text-[11px] text-red-600 mb-1.5 px-1">{error}</p>
            )}
            <div className="flex items-end gap-2">
              <Avatar className="size-8 shrink-0">
                <AvatarFallback
                  className={`${colorOf(commenterName)} text-white text-[11px] font-semibold`}
                >
                  {initialsOf(commenterName)}
                </AvatarFallback>
              </Avatar>
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Add a comment as ${commenterName}...`}
                rows={1}
                className="min-h-9 max-h-24 py-2 text-sm rounded-full resize-none flex-1"
              />
              <Button
                type="button"
                size="icon"
                onClick={handleSubmit}
                disabled={!draft.trim() || submitting}
                className="h-9 w-9 shrink-0 rounded-full"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}