import express from "express";
import cors from "cors";
import { getReady } from "./middleware/requireReady.js";
import { errorHandler } from "./middleware/errorHandler.js";
import deviationsRoutes from "./routes/deviation.routes.js";
import changeControlRoutes from "./routes/changeControl.routes.js";
import casesRoutes from "./routes/cases.routes.js";

export const app = express();

app.use(express.json());
app.use(cors());

app.use("/api", deviationsRoutes);
app.use("/api/change-control", changeControlRoutes);
app.use("/api", casesRoutes);

app.get("/healthz", (_req, res) => {
  res.json({ status: "ok", ready: getReady() });
});

// Must be registered LAST, after all routes/routers.
app.use(errorHandler);
