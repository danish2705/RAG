import type { Request, Response } from "express";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

export interface AuthUser {
  username: string;
  role: string;
  department: string;
}

const DEMO_USER: AuthUser = {
  username: "admin",
  role: "Quality Manager & Lead",
  department: "Quality Assurance & Compliance",
};

// POST /api/auth/login
export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body ?? {};

  if (typeof username !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Incorrect username or password." });
    return;
  }

  res.json({ user: DEMO_USER });
}

export async function ssoLogin(_req: Request, res: Response): Promise<void> {
  res.json({ user: DEMO_USER });
}
