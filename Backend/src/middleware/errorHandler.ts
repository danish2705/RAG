import type { Request, Response, NextFunction } from "express";

/**
 * Single place that turns a thrown/rejected error into an HTTP response.
 * Must be registered LAST, after all routes, in app.ts.
 *
 * Replaces the ~10 repeated
 *   catch (err) { const message = err instanceof Error ? err.message : String(err); res.status(500).json({ error: message }); }
 * blocks that used to live in every route handler.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express requires 4-arg signature to detect this as an error handler
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const message = err instanceof Error ? err.message : String(err);

  // TODO: swap console.error for a structured logger (pino/winston) and
  // give distinct status codes to known error types (e.g. a NotFoundError
  // -> 404, a ValidationError -> 400) as those are introduced.
  console.error(message);

  res.status(500).json({ error: message });
}
