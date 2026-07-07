import { createBrowserRouter } from "react-router";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { NewDeviation } from "./pages/InputQuery";
import { AIRecommendation } from "./pages/AIRecommendation";
import { ImpactAssessment } from "./pages/ImpactAssessment";
import { RootCause } from "./pages/RootCause";
import { Capa } from "./pages/Capa";
import { Summary } from "./pages/Summary";
import { Records } from "./pages/Records";
import { AuditTrail } from "./pages/AuditTrail";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { ChangeImpactAssessment } from "./pages/ChangeImpactAssessment";
import { RiskCriticality } from "./pages/RiskCriticality";
import { ValidationTesting } from "./pages/ValidationTesting";
import { ImplementationControl } from "./pages/ImplementationControl";
import { ChangecontrolSummary } from "./pages/ChangecontrolSummary";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "deviation", Component: NewDeviation },
      { path: "deviation/ai-recommendation", Component: AIRecommendation },
      { path: "deviation/impact-assessment", Component: ImpactAssessment },
      { path: "deviation/root-cause", Component: RootCause },
      { path: "deviation/capa", Component: Capa },
      { path: "deviation/summary", Component: Summary },
      { path: "change-control/change-impact-assessment", Component: ChangeImpactAssessment },
      { path: "change-control/risk-criticality", Component: RiskCriticality },
      { path: "change-control/validation-testing", Component: ValidationTesting },
      { path: "change-control/implementation", Component: ImplementationControl },
      { path: "change-control/summary", Component: ChangecontrolSummary },
      { path: "records", Component: Records },
      { path: "audit-trail", Component: AuditTrail },
      { path: "reports", Component: Reports },
      { path: "settings", Component: Settings },
    ],
  },
]);
