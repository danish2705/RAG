import type { Request, Response } from "express";
 
export interface AuthUser {
  username: string;
  role: "Admin" | "User" | "Guest";
  department: string;
}
 
// Demo users
const USERS: Record<
  string,
  { password: string; user: AuthUser }
> = {
  admin: {
    password: "admin",
    user: {
      username: "admin",
      role: "Admin",
      department: "Quality Assurance & Compliance",
    },
  },
  user: {
    password: "user",
    user: {
      username: "user",
      role: "User",
      department: "Manufacturing",
    },
  },
  guest: {
    password: "guest",
    user: {
      username: "guest",
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
export async function ssoLogin(
  req: Request,
  res: Response
): Promise<void> {
  // Example:
  // ?username=admin
  // ?username=user
  // ?username=guest
 
  const username = (req.query.username as string) || "admin";
 
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