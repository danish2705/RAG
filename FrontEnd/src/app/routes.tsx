import { createBrowserRouter } from "react-router";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { NewDeviation } from "./pages/InputQuery";
import { AIRecommendation } from "./pages/AIRecommendation";
import { ImmediateCorrection } from "./pages/ImmediateCorrection";
import { ImpactAssessment } from "./pages/ImpactAssessment";
import { RootCause } from "./pages/RootCause";
import { Capa } from "./pages/Capa";
import { Summary } from "./pages/Summary";
import { DbLog } from "./pages/Dblog";
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
      {
        path: "deviation/immediate-correction",
        Component: ImmediateCorrection,
      },
      { path: "deviation/impact-assessment", Component: ImpactAssessment },
      { path: "deviation/root-cause", Component: RootCause },
      { path: "deviation/capa", Component: Capa },
      { path: "deviation/summary", Component: Summary },
      { path: "db-log", Component: DbLog },
      { path: "audit-trail", Component: AuditTrail },
      { path: "reports", Component: Reports },
      { path: "settings", Component: Settings },
    ],
  },
]);
