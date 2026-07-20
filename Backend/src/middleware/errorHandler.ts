import type { Request, Response, NextFunction } from "express";

// Postgres/network error codes that mean "can't reach the database" as
// opposed to "the query itself was wrong". Used to give the frontend (and
// whoever's debugging) an honest, specific message instead of a generic
// "status 500".
const CONNECTION_ERROR_CODES = new Set([
  "ECONNREFUSED", // DB not accepting connections
  "ENOTFOUND", // DNS/host lookup failed
  "ETIMEDOUT", // connection attempt timed out
  "ECONNRESET", // connection dropped mid-request
  "57P03", // Postgres: cannot_connect_now
  "53300", // Postgres: too_many_connections
]);

function isConnectionError(err: unknown): boolean {
  const code = (err as { code?: string } | undefined)?.code;
  return typeof code === "string" && CONNECTION_ERROR_CODES.has(code);
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const message = err instanceof Error ? err.message : String(err);

  console.error(message);

  if (isConnectionError(err)) {
    res.status(503).json({
      error:
        "Couldn't connect to the database right now. Please check your connection and try again shortly.",
      reason: "db_connection",
    });
    return;
  }

  res.status(500).json({ error: message });
}
