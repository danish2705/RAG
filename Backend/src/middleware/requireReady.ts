import type { Request, Response, NextFunction } from "express";

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
