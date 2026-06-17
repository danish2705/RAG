import { createBrowserRouter } from "react-router";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { NewDeviation } from "./pages/NewDeviation";
import { AIRecommendation } from "./pages/AIRecommendation";
import { ImmediateCorrection } from "./pages/ImmediateCorrection";
import { ImpactAssessment } from "./pages/ImpactAssessment";
import { HistoricalMatches } from "./pages/HistoricalMatches";
import { RootCauseCapa } from "./pages/RootCauseCapa";
import { EffectivenessCheck } from "./pages/EffectivenessCheck";
import { ChangeControl } from "./pages/ChangeControl";
import { ChangeDecision } from "./pages/ChangeDecision";
import { ActionPlan } from "./pages/ActionPlan";
import { CrossTrigger } from "./pages/CrossTrigger";
import { AuditTrail } from "./pages/AuditTrail";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "deviation", Component: NewDeviation },
      { path: "deviation/ai-recommendation", Component: AIRecommendation },
      { path: "deviation/immediate-correction", Component: ImmediateCorrection },
      { path: "deviation/impact-assessment", Component: ImpactAssessment },
      { path: "deviation/historical-analysis", Component: HistoricalMatches },
      { path: "deviation/root-cause", Component: RootCauseCapa },
      { path: "deviation/effectiveness-check", Component: EffectivenessCheck },
      { path: "change-control", Component: ChangeControl },
      { path: "change-control/decision", Component: ChangeDecision },
      { path: "change-control/action-plan", Component: ActionPlan },
      { path: "change-control/cross-trigger", Component: CrossTrigger },
      { path: "audit-trail", Component: AuditTrail },
      { path: "reports", Component: Reports },
      { path: "settings", Component: Settings },
    ],
  },
]);
