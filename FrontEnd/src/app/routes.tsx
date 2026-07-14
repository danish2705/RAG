import { createBrowserRouter } from "react-router";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { Login } from "./pages/Login";
import { Profile } from "./pages/Profile";
import { Dashboard } from "./pages/Dashboard";
import { NewDeviation } from "./pages/InputQuery";
import { AIRecommendation } from "./pages/AIRecommendation";
import { ImpactAssessment } from "./pages/deviation/ImpactAssessment";
import { RootCause } from "./pages/deviation/RootCause";
import { Capa } from "./pages/deviation/Capa";
import { Summary } from "./pages/deviation/Summary";
import { Records } from "./pages/Records";
import { AuditTrail } from "./pages/AuditTrail";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { ChangeImpactAssessment } from "./pages/changeControl/ChangeImpactAssessment";
import { RiskCriticality } from "./pages/changeControl/RiskCriticality";
import { ValidationTesting } from "./pages/changeControl/ValidationTesting";
import { ImplementationControl } from "./pages/changeControl/ImplementationControl";
import { ChangecontrolSummary } from "./pages/changeControl/Summary";

export const router = createBrowserRouter([
  { path: "/login", Component: Login },
  {
    path: "/",
    Component: ProtectedRoute,
    children: [
      {
        path: "/",
        Component: Layout,
        children: [
          { index: true, Component: Dashboard },
          { path: "profile", Component: Profile },
          { path: "deviation", Component: NewDeviation },
          { path: "deviation/ai-recommendation", Component: AIRecommendation },
          { path: "deviation/impact-assessment", Component: ImpactAssessment },
          { path: "deviation/root-cause", Component: RootCause },
          { path: "deviation/capa", Component: Capa },
          { path: "deviation/summary", Component: Summary },
          {
            path: "change-control/change-impact-assessment",
            Component: ChangeImpactAssessment,
          },
          {
            path: "change-control/risk-criticality",
            Component: RiskCriticality,
          },
          {
            path: "change-control/validation-testing",
            Component: ValidationTesting,
          },
          {
            path: "change-control/implementation",
            Component: ImplementationControl,
          },
          { path: "change-control/summary", Component: ChangecontrolSummary },
          { path: "records", Component: Records },
          { path: "audit-trail", Component: AuditTrail },
          { path: "reports", Component: Reports },
          { path: "settings", Component: Settings },
        ],
      },
    ],
  },
]);