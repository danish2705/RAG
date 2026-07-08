import type { Request, Response, NextFunction } from "express";

// Set to true once initKnowledgeBase() resolves in server.ts. Routes that
// depend on the knowledge base (anything calling retrieveContext) should be
// guarded with requireReady so they fail fast with a clear 503 instead of
// throwing a confusing "not initialized" error deeper in the call stack.
let isReady = false;

export function setReady(value: boolean): void {
  isReady = value;
}

export function getReady(): boolean {
  return isReady;
}

export function requireReady(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!isReady) {
    res.status(503).json({
      error: "Knowledge base is still loading, please try again shortly.",
    });
    return;
  }
  next();
}
