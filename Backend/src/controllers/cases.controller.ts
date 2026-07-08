import type { Request, Response } from "express";
import {
  saveDeviationCase,
  getAllDeviationCases,
  saveChangeControlCase,
  getAllChangeControlCases,
} from "../repository/caseRepository.js";

// SAVE: Persist a completed deviation case to the DB.
export async function saveCase(req: Request, res: Response): Promise<void> {
  const id = await saveDeviationCase(req.body ?? {});
  res.json({ id });
}

// GET ALL CASES: Returns all saved deviation cases for the DB Log page.
export async function listCases(_req: Request, res: Response): Promise<void> {
  const cases = await getAllDeviationCases();
  res.json(cases);
}

// SAVE (Change Control): Persist a completed Change Control case to the DB.
export async function saveChangeControlCaseHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const id = await saveChangeControlCase(req.body ?? {});
  res.json({ id });
}

// GET ALL CASES (Change Control): for the DB Log page.
export async function listChangeControlCases(
  _req: Request,
  res: Response,
): Promise<void> {
  const cases = await getAllChangeControlCases();
  res.json(cases);
}
