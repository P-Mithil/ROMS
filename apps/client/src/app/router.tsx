import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../features/auth/ProtectedRoute.js";
import { AppLayout } from "../components/layout/AppLayout.js";
import { PageLoader } from "../components/ui/Skeleton.js";
import { HomePage } from "../pages/HomePage.js";
import { LoginPage } from "../pages/LoginPage.js";

const CandidateCreatePage = lazy(() =>
  import("../features/candidates/pages/CandidateCreatePage.js").then((m) => ({
    default: m.CandidateCreatePage,
  })),
);
const CandidateDetailPage = lazy(() =>
  import("../features/candidates/pages/CandidateDetailPage.js").then((m) => ({
    default: m.CandidateDetailPage,
  })),
);
const CandidateEditPage = lazy(() =>
  import("../features/candidates/pages/CandidateEditPage.js").then((m) => ({
    default: m.CandidateEditPage,
  })),
);
const CandidateListPage = lazy(() =>
  import("../features/candidates/pages/CandidateListPage.js").then((m) => ({
    default: m.CandidateListPage,
  })),
);
const RequisitionCreatePage = lazy(() =>
  import("../features/requisitions/pages/RequisitionCreatePage.js").then((m) => ({
    default: m.RequisitionCreatePage,
  })),
);
const RequisitionDetailPage = lazy(() =>
  import("../features/requisitions/pages/RequisitionDetailPage.js").then((m) => ({
    default: m.RequisitionDetailPage,
  })),
);
const RequisitionEditPage = lazy(() =>
  import("../features/requisitions/pages/RequisitionEditPage.js").then((m) => ({
    default: m.RequisitionEditPage,
  })),
);
const RequisitionListPage = lazy(() =>
  import("../features/requisitions/pages/RequisitionListPage.js").then((m) => ({
    default: m.RequisitionListPage,
  })),
);
const InterviewCreatePage = lazy(() =>
  import("../features/interviews/pages/InterviewCreatePage.js").then((m) => ({
    default: m.InterviewCreatePage,
  })),
);
const InterviewDetailPage = lazy(() =>
  import("../features/interviews/pages/InterviewDetailPage.js").then((m) => ({
    default: m.InterviewDetailPage,
  })),
);
const InterviewEditPage = lazy(() =>
  import("../features/interviews/pages/InterviewEditPage.js").then((m) => ({
    default: m.InterviewEditPage,
  })),
);
const InterviewListPage = lazy(() =>
  import("../features/interviews/pages/InterviewListPage.js").then((m) => ({
    default: m.InterviewListPage,
  })),
);
const OfferCreatePage = lazy(() =>
  import("../features/offers/pages/OfferCreatePage.js").then((m) => ({
    default: m.OfferCreatePage,
  })),
);
const OfferDetailPage = lazy(() =>
  import("../features/offers/pages/OfferDetailPage.js").then((m) => ({
    default: m.OfferDetailPage,
  })),
);
const OfferEditPage = lazy(() =>
  import("../features/offers/pages/OfferEditPage.js").then((m) => ({
    default: m.OfferEditPage,
  })),
);
const OfferListPage = lazy(() =>
  import("../features/offers/pages/OfferListPage.js").then((m) => ({
    default: m.OfferListPage,
  })),
);
const PublicOfferResponsePage = lazy(() =>
  import("../features/offers/pages/PublicOfferResponsePage.js").then((m) => ({
    default: m.PublicOfferResponsePage,
  })),
);
const EmployeeDetailPage = lazy(() =>
  import("../features/onboarding/pages/EmployeeDetailPage.js").then((m) => ({
    default: m.EmployeeDetailPage,
  })),
);
const EmployeeListPage = lazy(() =>
  import("../features/onboarding/pages/EmployeeListPage.js").then((m) => ({
    default: m.EmployeeListPage,
  })),
);
const OnboardingDetailPage = lazy(() =>
  import("../features/onboarding/pages/OnboardingDetailPage.js").then((m) => ({
    default: m.OnboardingDetailPage,
  })),
);
const OnboardingListPage = lazy(() =>
  import("../features/onboarding/pages/OnboardingListPage.js").then((m) => ({
    default: m.OnboardingListPage,
  })),
);
const DepartmentsReportPage = lazy(() =>
  import("../features/reports/pages/DepartmentsReportPage.js").then((m) => ({
    default: m.DepartmentsReportPage,
  })),
);
const EmployeesReportPage = lazy(() =>
  import("../features/reports/pages/EmployeesReportPage.js").then((m) => ({
    default: m.EmployeesReportPage,
  })),
);
const FunnelReportPage = lazy(() =>
  import("../features/reports/pages/FunnelReportPage.js").then((m) => ({
    default: m.FunnelReportPage,
  })),
);
const InterviewsReportPage = lazy(() =>
  import("../features/reports/pages/InterviewsReportPage.js").then((m) => ({
    default: m.InterviewsReportPage,
  })),
);
const OffersReportPage = lazy(() =>
  import("../features/reports/pages/OffersReportPage.js").then((m) => ({
    default: m.OffersReportPage,
  })),
);
const OnboardingReportPage = lazy(() =>
  import("../features/reports/pages/OnboardingReportPage.js").then((m) => ({
    default: m.OnboardingReportPage,
  })),
);
const RecruitmentReportPage = lazy(() =>
  import("../features/reports/pages/RecruitmentReportPage.js").then((m) => ({
    default: m.RecruitmentReportPage,
  })),
);
const ReportsOverviewPage = lazy(() =>
  import("../features/reports/pages/ReportsOverviewPage.js").then((m) => ({
    default: m.ReportsOverviewPage,
  })),
);

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader label="Loading page…" />}>{children}</Suspense>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/offers/respond/:token"
        element={
          <LazyPage>
            <PublicOfferResponsePage />
          </LazyPage>
        }
      />
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route element={<ProtectedRoute roles={["HR_ADMIN", "RECRUITER", "HIRING_MANAGER"]} />}>
          <Route
            path="/requisitions"
            element={
              <LazyPage>
                <RequisitionListPage />
              </LazyPage>
            }
          />
          <Route
            path="/requisitions/new"
            element={
              <LazyPage>
                <RequisitionCreatePage />
              </LazyPage>
            }
          />
          <Route
            path="/requisitions/:id"
            element={
              <LazyPage>
                <RequisitionDetailPage />
              </LazyPage>
            }
          />
          <Route
            path="/requisitions/:id/edit"
            element={
              <LazyPage>
                <RequisitionEditPage />
              </LazyPage>
            }
          />
          <Route
            path="/candidates"
            element={
              <LazyPage>
                <CandidateListPage />
              </LazyPage>
            }
          />
          <Route
            path="/candidates/new"
            element={
              <LazyPage>
                <CandidateCreatePage />
              </LazyPage>
            }
          />
          <Route
            path="/candidates/:id"
            element={
              <LazyPage>
                <CandidateDetailPage />
              </LazyPage>
            }
          />
          <Route
            path="/candidates/:id/edit"
            element={
              <LazyPage>
                <CandidateEditPage />
              </LazyPage>
            }
          />
          <Route
            path="/offers"
            element={
              <LazyPage>
                <OfferListPage />
              </LazyPage>
            }
          />
          <Route
            path="/offers/new"
            element={
              <LazyPage>
                <OfferCreatePage />
              </LazyPage>
            }
          />
          <Route
            path="/offers/:id"
            element={
              <LazyPage>
                <OfferDetailPage />
              </LazyPage>
            }
          />
          <Route
            path="/offers/:id/edit"
            element={
              <LazyPage>
                <OfferEditPage />
              </LazyPage>
            }
          />
          <Route
            path="/onboarding"
            element={
              <LazyPage>
                <OnboardingListPage />
              </LazyPage>
            }
          />
          <Route
            path="/onboarding/:id"
            element={
              <LazyPage>
                <OnboardingDetailPage />
              </LazyPage>
            }
          />
          <Route
            path="/employees"
            element={
              <LazyPage>
                <EmployeeListPage />
              </LazyPage>
            }
          />
          <Route
            path="/employees/:id"
            element={
              <LazyPage>
                <EmployeeDetailPage />
              </LazyPage>
            }
          />
          <Route
            path="/reports"
            element={
              <LazyPage>
                <ReportsOverviewPage />
              </LazyPage>
            }
          />
          <Route
            path="/reports/recruitment"
            element={
              <LazyPage>
                <RecruitmentReportPage />
              </LazyPage>
            }
          />
          <Route
            path="/reports/funnel"
            element={
              <LazyPage>
                <FunnelReportPage />
              </LazyPage>
            }
          />
          <Route
            path="/reports/departments"
            element={
              <LazyPage>
                <DepartmentsReportPage />
              </LazyPage>
            }
          />
          <Route
            path="/reports/interviews"
            element={
              <LazyPage>
                <InterviewsReportPage />
              </LazyPage>
            }
          />
          <Route
            path="/reports/offers"
            element={
              <LazyPage>
                <OffersReportPage />
              </LazyPage>
            }
          />
          <Route
            path="/reports/onboarding"
            element={
              <LazyPage>
                <OnboardingReportPage />
              </LazyPage>
            }
          />
          <Route
            path="/reports/employees"
            element={
              <LazyPage>
                <EmployeesReportPage />
              </LazyPage>
            }
          />
        </Route>
        <Route
          element={
            <ProtectedRoute
              roles={[
                "HR_ADMIN",
                "RECRUITER",
                "HIRING_MANAGER",
                "INTERVIEWER",
              ]}
            />
          }
        >
          <Route
            path="/interviews"
            element={
              <LazyPage>
                <InterviewListPage />
              </LazyPage>
            }
          />
          <Route
            path="/interviews/new"
            element={
              <LazyPage>
                <InterviewCreatePage />
              </LazyPage>
            }
          />
          <Route
            path="/interviews/:id"
            element={
              <LazyPage>
                <InterviewDetailPage />
              </LazyPage>
            }
          />
          <Route
            path="/interviews/:id/edit"
            element={
              <LazyPage>
                <InterviewEditPage />
              </LazyPage>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}
