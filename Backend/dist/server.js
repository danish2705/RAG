import express from "express";
import { pool } from "./db.js";
import { config } from "./config.js";
import { initKnowledgeBase, retrieveContext } from "./kb/knowledgeBase.js";
import { runClassificationOnly, runImpactAssessmentOnly, runRCAOnly, runCAPAOnly, } from "./pipeline/deviation/orchestrator.js";
import { ClassificationSchema, ImpactAssessmentSchema, RCASchema, } from "./llm/schemas/deviation.js";
import { runChangeImpactAssessmentOnly, runRiskCriticalityOnly, runValidationTestingOnly, runImplementationControlOnly, runFinalSummaryOnly, } from "./pipeline/changeControl/orchestrator.js";
import { ChangeImpactAssessmentSchema, RiskCriticalitySchema, ValidationTestingSchema, ImplementationControlSchema, } from "./llm/schemas/changeControl.js";
import cors from "cors";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const app = express();
app.use(express.json());
app.use(cors());
let isReady = false;
function requireReady(_req, res, next) {
    if (!isReady) {
        res.status(503).json({
            error: "Knowledge base is still loading, please try again shortly.",
        });
        return;
    }
    next();
}
// Classification / routing ONLY.
app.post("/api/inputQuery", requireReady, async (req, res) => {
    const { query } = (req.body ?? {});
    if (typeof query !== "string" || query.trim().length === 0) {
        res.status(400).json({
            error: "Request body must include a non-empty 'query' string.",
        });
        return;
    }
    try {
        const { contextText, routing } = await retrieveContext(query);
        const result = await runClassificationOnly(query, contextText);
        res.json({ query, routing, ...result });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: message });
    }
});
//Impact / severity assessment.
app.post("/api/deviations/impact-assessment", requireReady, async (req, res) => {
    const { query, classification } = (req.body ??
        {});
    if (typeof query !== "string" || query.trim().length === 0) {
        res.status(400).json({
            error: "Request body must include a non-empty 'query' string.",
        });
        return;
    }
    const parsedClassification = ClassificationSchema.safeParse(classification);
    if (!parsedClassification.success) {
        res.status(400).json({
            error: "Request body must include a valid 'classification' object (the approved Stage 1 result).",
            details: parsedClassification.error.flatten(),
        });
        return;
    }
    try {
        const { contextText } = await retrieveContext(query);
        const result = await runImpactAssessmentOnly(query, contextText, parsedClassification.data);
        res.json({ query, ...result });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: message });
    }
});
//Root cause analysis.
app.post("/api/deviations/rca", requireReady, async (req, res) => {
    const { query, classification, impactAssessment } = (req.body ??
        {});
    if (typeof query !== "string" || query.trim().length === 0) {
        res.status(400).json({
            error: "Request body must include a non-empty 'query' string.",
        });
        return;
    }
    const parsedClassification = ClassificationSchema.safeParse(classification);
    if (!parsedClassification.success) {
        res.status(400).json({
            error: "Request body must include a valid 'classification' object.",
            details: parsedClassification.error.flatten(),
        });
        return;
    }
    const parsedImpactAssessment = ImpactAssessmentSchema.safeParse(impactAssessment);
    if (!parsedImpactAssessment.success) {
        res.status(400).json({
            error: "Request body must include a valid 'impactAssessment' object (the approved Stage 2 result).",
            details: parsedImpactAssessment.error.flatten(),
        });
        return;
    }
    try {
        const { contextText } = await retrieveContext(query);
        const result = await runRCAOnly(query, contextText, parsedClassification.data, parsedImpactAssessment.data);
        res.json({ query, ...result });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: message });
    }
});
//CAPA recommendations.
app.post("/api/deviations/capa", async (req, res) => {
    const { query, classification, impactAssessment, rca } = (req.body ??
        {});
    if (typeof query !== "string" || query.trim().length === 0) {
        res.status(400).json({
            error: "Request body must include a non-empty 'query' string.",
        });
        return;
    }
    const parsedClassification = ClassificationSchema.safeParse(classification);
    if (!parsedClassification.success) {
        res.status(400).json({
            error: "Request body must include a valid 'classification' object.",
            details: parsedClassification.error.flatten(),
        });
        return;
    }
    const parsedImpactAssessment = ImpactAssessmentSchema.safeParse(impactAssessment);
    if (!parsedImpactAssessment.success) {
        res.status(400).json({
            error: "Request body must include a valid 'impactAssessment' object (the approved Stage 2 result).",
            details: parsedImpactAssessment.error.flatten(),
        });
        return;
    }
    const parsedRCA = RCASchema.safeParse(rca);
    if (!parsedRCA.success) {
        res.status(400).json({
            error: "Request body must include a valid 'rca' object (the approved Stage 3 result).",
            details: parsedRCA.error.flatten(),
        });
        return;
    }
    try {
        const result = await runCAPAOnly(query, parsedClassification.data, parsedImpactAssessment.data, parsedRCA.data);
        res.json({ query, ...result });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: message });
    }
});
//Change Impact Assessment
app.post("/api/change-control/impact-assessment", requireReady, async (req, res) => {
    const { query, classification } = (req.body ??
        {});
    if (typeof query !== "string" || query.trim().length === 0) {
        res.status(400).json({
            error: "Request body must include a non-empty 'query' string.",
        });
        return;
    }
    const parsedClassification = ClassificationSchema.safeParse(classification);
    if (!parsedClassification.success) {
        res.status(400).json({
            error: "Request body must include a valid 'classification' object (the approved Stage 0 result).",
            details: parsedClassification.error.flatten(),
        });
        return;
    }
    try {
        const { contextText } = await retrieveContext(query);
        const result = await runChangeImpactAssessmentOnly(query, contextText, parsedClassification.data);
        res.json({ query, ...result });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: message });
    }
});
//Risk & Criticality Evaluation
app.post("/api/change-control/risk-criticality", requireReady, async (req, res) => {
    const { query, changeImpactAssessment } = (req.body ??
        {});
    if (typeof query !== "string" || query.trim().length === 0) {
        res.status(400).json({
            error: "Request body must include a non-empty 'query' string.",
        });
        return;
    }
    const parsedImpact = ChangeImpactAssessmentSchema.safeParse(changeImpactAssessment);
    if (!parsedImpact.success) {
        res.status(400).json({
            error: "Request body must include a valid 'changeImpactAssessment' object (the approved Stage 1 result).",
            details: parsedImpact.error.flatten(),
        });
        return;
    }
    try {
        const result = await runRiskCriticalityOnly(query, parsedImpact.data);
        res.json({ query, ...result });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: message });
    }
});
//Validation & Testing Strategy
app.post("/api/change-control/validation-testing", requireReady, async (req, res) => {
    const { query, changeImpactAssessment, riskCriticality } = (req.body ??
        {});
    if (typeof query !== "string" || query.trim().length === 0) {
        res.status(400).json({
            error: "Request body must include a non-empty 'query' string.",
        });
        return;
    }
    const parsedImpact = ChangeImpactAssessmentSchema.safeParse(changeImpactAssessment);
    if (!parsedImpact.success) {
        res.status(400).json({
            error: "Request body must include a valid 'changeImpactAssessment' object (the approved Stage 1 result).",
            details: parsedImpact.error.flatten(),
        });
        return;
    }
    const parsedRisk = RiskCriticalitySchema.safeParse(riskCriticality);
    if (!parsedRisk.success) {
        res.status(400).json({
            error: "Request body must include a valid 'riskCriticality' object (the approved Stage 2 result).",
            details: parsedRisk.error.flatten(),
        });
        return;
    }
    try {
        const result = await runValidationTestingOnly(query, parsedImpact.data, parsedRisk.data);
        res.json({ query, ...result });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: message });
    }
});
//Implementation & Control Actions.
app.post("/api/change-control/implementation-control", requireReady, async (req, res) => {
    const { query, changeImpactAssessment, riskCriticality, validationTesting, } = (req.body ?? {});
    if (typeof query !== "string" || query.trim().length === 0) {
        res.status(400).json({
            error: "Request body must include a non-empty 'query' string.",
        });
        return;
    }
    const parsedImpact = ChangeImpactAssessmentSchema.safeParse(changeImpactAssessment);
    if (!parsedImpact.success) {
        res.status(400).json({
            error: "Request body must include a valid 'changeImpactAssessment' object (the approved Stage 1 result).",
            details: parsedImpact.error.flatten(),
        });
        return;
    }
    const parsedRisk = RiskCriticalitySchema.safeParse(riskCriticality);
    if (!parsedRisk.success) {
        res.status(400).json({
            error: "Request body must include a valid 'riskCriticality' object (the approved Stage 2 result).",
            details: parsedRisk.error.flatten(),
        });
        return;
    }
    const parsedValidation = ValidationTestingSchema.safeParse(validationTesting);
    if (!parsedValidation.success) {
        res.status(400).json({
            error: "Request body must include a valid 'validationTesting' object (the approved Stage 3 result).",
            details: parsedValidation.error.flatten(),
        });
        return;
    }
    try {
        const result = await runImplementationControlOnly(query, parsedImpact.data, parsedRisk.data, parsedValidation.data);
        res.json({ query, ...result });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: message });
    }
});
//Final Change Control Summary.
app.post("/api/change-control/final-summary", async (req, res) => {
    const { query, changeImpactAssessment, riskCriticality, validationTesting, implementationControl, } = (req.body ?? {});
    if (typeof query !== "string" || query.trim().length === 0) {
        res.status(400).json({
            error: "Request body must include a non-empty 'query' string.",
        });
        return;
    }
    const parsedImpact = ChangeImpactAssessmentSchema.safeParse(changeImpactAssessment);
    if (!parsedImpact.success) {
        res.status(400).json({
            error: "Request body must include a valid 'changeImpactAssessment' object (the approved Stage 1 result).",
            details: parsedImpact.error.flatten(),
        });
        return;
    }
    const parsedRisk = RiskCriticalitySchema.safeParse(riskCriticality);
    if (!parsedRisk.success) {
        res.status(400).json({
            error: "Request body must include a valid 'riskCriticality' object (the approved Stage 2 result).",
            details: parsedRisk.error.flatten(),
        });
        return;
    }
    const parsedValidation = ValidationTestingSchema.safeParse(validationTesting);
    if (!parsedValidation.success) {
        res.status(400).json({
            error: "Request body must include a valid 'validationTesting' object (the approved Stage 3 result).",
            details: parsedValidation.error.flatten(),
        });
        return;
    }
    const parsedImplementation = ImplementationControlSchema.safeParse(implementationControl);
    if (!parsedImplementation.success) {
        res.status(400).json({
            error: "Request body must include a valid 'implementationControl' object (the approved Stage 4 result).",
            details: parsedImplementation.error.flatten(),
        });
        return;
    }
    try {
        const result = await runFinalSummaryOnly(query, parsedImpact.data, parsedRisk.data, parsedValidation.data, parsedImplementation.data);
        res.json({ query, ...result });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: message });
    }
});
//SAVE
app.post("/api/save", async (req, res) => {
    const { query, classification, impact_assessment, rca, capa, status, halted_at, saved_by, } = req.body;
    try {
        const result = await pool.query(`INSERT INTO deviation_cases
        (query, classification, impact_assessment, rca, capa, status, halted_at, saved_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`, [
            query,
            JSON.stringify(classification),
            JSON.stringify(impact_assessment),
            JSON.stringify(rca),
            JSON.stringify(capa),
            status,
            halted_at,
            saved_by,
        ]);
        res.json({ id: result.rows[0].id });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: message });
    }
});
// GET ALL CASES: Returns all saved deviation cases for the DB Log page.
app.get("/api/cases", async (_req, res) => {
    try {
        const result = await pool.query(`SELECT
         id,
         query,
         saved_by,
         classification,
         impact_assessment,
         rca,
         capa,
         status,
         halted_at,
         created_at
       FROM deviation_cases
       ORDER BY created_at DESC`);
        res.json(result.rows);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: message });
    }
});
// SAVE (Change Control): Persist a completed Change Control case to the DB.
app.post("/api/change-control/save", async (req, res) => {
    const { query, classification, change_impact_assessment, risk_criticality, validation_testing, implementation_control, final_summary, status, halted_at, saved_by, } = req.body;
    try {
        const result = await pool.query(`INSERT INTO change_control_cases
          (query, classification, change_impact_assessment, risk_criticality,
           validation_testing, implementation_control, final_summary,
           status, halted_at, saved_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`, [
            query,
            JSON.stringify(classification),
            JSON.stringify(change_impact_assessment),
            JSON.stringify(risk_criticality),
            JSON.stringify(validation_testing),
            JSON.stringify(implementation_control),
            JSON.stringify(final_summary),
            status,
            halted_at,
            saved_by,
        ]);
        res.json({ id: result.rows[0].id });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: message });
    }
});
// GET ALL CASES (Change Control): for the DB Log page.
app.get("/api/change-control/cases", async (_req, res) => {
    try {
        const result = await pool.query(`SELECT
           id,
           query,
           saved_by,
           classification,
           change_impact_assessment,
           risk_criticality,
           validation_testing,
           implementation_control,
           final_summary,
           status,
           halted_at,
           created_at
         FROM change_control_cases
         ORDER BY created_at DESC`);
        res.json(result.rows);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: message });
    }
});
app.get("/healthz", (_req, res) => res.json({ status: "ok", ready: isReady }));
async function start() {
    // Bind to 0.0.0.0 (not just localhost) and bind FIRST, before the slow
    // knowledge base load, so Render's port scan succeeds immediately.
    app.listen(config.port, "0.0.0.0", () => {
        console.log(`GxP AI orchestrator listening on port ${config.port}`);
    });
    console.log("Loading knowledge base from S3 and building vector indexes...");
    await initKnowledgeBase();
    isReady = true;
    console.log("Knowledge base ready.");
}
start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map