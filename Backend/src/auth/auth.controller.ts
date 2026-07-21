import type { Request, Response } from "express";

export interface AuthUser {
  username: string;
  role: "Admin" | "User" | "Guest";
  department: string;
}

// Credentials sourced from env, with dev-friendly fallbacks.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

const USER_USERNAME = process.env.USER_USERNAME || "user";
const USER_PASSWORD = process.env.USER_PASSWORD || "user";

const GUEST_USERNAME = process.env.GUEST_USERNAME || "guest";
const GUEST_PASSWORD = process.env.GUEST_PASSWORD || "guest";

// Demo users
const USERS: Record<string, { password: string; user: AuthUser }> = {
  [ADMIN_USERNAME]: {
    password: ADMIN_PASSWORD,
    user: {
      username: ADMIN_USERNAME,
      role: "Admin",
      department: "Quality Assurance & Compliance",
    },
  },
  [USER_USERNAME]: {
    password: USER_PASSWORD,
    user: {
      username: USER_USERNAME,
      role: "User",
      department: "Manufacturing",
    },
  },
  [GUEST_USERNAME]: {
    password: GUEST_PASSWORD,
    user: {
      username: GUEST_USERNAME,
      role: "Guest",
      department: "Visitor",
    },
  },
};

// POST /api/auth/login
export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body ?? {};

  if (typeof username !== "string" || typeof password !== "string") {
    res.status(400).json({
      error: "Username and password are required.",
    });
    return;
  }

  const account = USERS[username];

  if (!account || account.password !== password) {
    res.status(401).json({
      error: "Incorrect username or password.",
    });
    return;
  }

  res.json({
    user: account.user,
  });
}

// Demo SSO Login
export async function ssoLogin(req: Request, res: Response): Promise<void> {
  // Example:
  // ?username=admin
  // ?username=user
  // ?username=guest

  const username = (req.query.username as string) || ADMIN_USERNAME;

  const account = USERS[username];

  if (!account) {
    res.status(404).json({
      error: "User not found.",
    });
    return;
  }

  res.json({
    user: account.user,
  });
}