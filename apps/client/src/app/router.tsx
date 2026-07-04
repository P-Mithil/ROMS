import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../features/auth/ProtectedRoute.js";
import { CandidateCreatePage } from "../features/candidates/pages/CandidateCreatePage.js";
import { CandidateDetailPage } from "../features/candidates/pages/CandidateDetailPage.js";
import { CandidateEditPage } from "../features/candidates/pages/CandidateEditPage.js";
import { CandidateListPage } from "../features/candidates/pages/CandidateListPage.js";
import { RequisitionCreatePage } from "../features/requisitions/pages/RequisitionCreatePage.js";
import { RequisitionDetailPage } from "../features/requisitions/pages/RequisitionDetailPage.js";
import { RequisitionEditPage } from "../features/requisitions/pages/RequisitionEditPage.js";
import { RequisitionListPage } from "../features/requisitions/pages/RequisitionListPage.js";
import { InterviewCreatePage } from "../features/interviews/pages/InterviewCreatePage.js";
import { InterviewDetailPage } from "../features/interviews/pages/InterviewDetailPage.js";
import { InterviewEditPage } from "../features/interviews/pages/InterviewEditPage.js";
import { InterviewListPage } from "../features/interviews/pages/InterviewListPage.js";
import { OfferCreatePage } from "../features/offers/pages/OfferCreatePage.js";
import { OfferDetailPage } from "../features/offers/pages/OfferDetailPage.js";
import { OfferEditPage } from "../features/offers/pages/OfferEditPage.js";
import { OfferListPage } from "../features/offers/pages/OfferListPage.js";
import { PublicOfferResponsePage } from "../features/offers/pages/PublicOfferResponsePage.js";
import { EmployeeDetailPage } from "../features/onboarding/pages/EmployeeDetailPage.js";
import { EmployeeListPage } from "../features/onboarding/pages/EmployeeListPage.js";
import { OnboardingDetailPage } from "../features/onboarding/pages/OnboardingDetailPage.js";
import { OnboardingListPage } from "../features/onboarding/pages/OnboardingListPage.js";
import { AppLayout } from "../components/layout/AppLayout.js";
import { HomePage } from "../pages/HomePage.js";
import { LoginPage } from "../pages/LoginPage.js";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/offers/respond/:token"
        element={<PublicOfferResponsePage />}
      />
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route element={<ProtectedRoute roles={["HR_ADMIN", "RECRUITER", "HIRING_MANAGER"]} />}>
          <Route path="/requisitions" element={<RequisitionListPage />} />
          <Route path="/requisitions/new" element={<RequisitionCreatePage />} />
          <Route path="/requisitions/:id" element={<RequisitionDetailPage />} />
          <Route
            path="/requisitions/:id/edit"
            element={<RequisitionEditPage />}
          />
          <Route path="/candidates" element={<CandidateListPage />} />
          <Route path="/candidates/new" element={<CandidateCreatePage />} />
          <Route path="/candidates/:id" element={<CandidateDetailPage />} />
          <Route path="/candidates/:id/edit" element={<CandidateEditPage />} />
          <Route path="/offers" element={<OfferListPage />} />
          <Route path="/offers/new" element={<OfferCreatePage />} />
          <Route path="/offers/:id" element={<OfferDetailPage />} />
          <Route path="/offers/:id/edit" element={<OfferEditPage />} />
          <Route path="/onboarding" element={<OnboardingListPage />} />
          <Route path="/onboarding/:id" element={<OnboardingDetailPage />} />
          <Route path="/employees" element={<EmployeeListPage />} />
          <Route path="/employees/:id" element={<EmployeeDetailPage />} />
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
          <Route path="/interviews" element={<InterviewListPage />} />
          <Route path="/interviews/new" element={<InterviewCreatePage />} />
          <Route path="/interviews/:id" element={<InterviewDetailPage />} />
          <Route path="/interviews/:id/edit" element={<InterviewEditPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
