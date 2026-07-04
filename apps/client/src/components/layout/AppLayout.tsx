import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth.js";
import { canAccessCandidates } from "../../features/candidates/utils/permissions.js";
import { canAccessInterviews } from "../../features/interviews/utils/permissions.js";
import { canAccessOffers } from "../../features/offers/utils/permissions.js";
import { canAccessOnboarding } from "../../features/onboarding/utils/permissions.js";
import { canAccessRequisitions } from "../../features/requisitions/utils/permissions.js";

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-header__brand">
          <Link className="app-header__brand-link" to="/">
            <span className="app-header__logo">R</span>
            <span className="app-header__title">ROMS</span>
          </Link>
        </div>

        <nav className="app-nav">
          {user && canAccessRequisitions(user) ? (
            <Link className="app-nav__link" to="/requisitions">
              Requisitions
            </Link>
          ) : null}
          {user && canAccessCandidates(user) ? (
            <Link className="app-nav__link" to="/candidates">
              Candidates
            </Link>
          ) : null}
          {user && canAccessInterviews(user) ? (
            <Link className="app-nav__link" to="/interviews">
              Interviews
            </Link>
          ) : null}
          {user && canAccessOffers(user) ? (
            <Link className="app-nav__link" to="/offers">
              Offers
            </Link>
          ) : null}
          {user && canAccessOnboarding(user) ? (
            <Link className="app-nav__link" to="/onboarding">
              Onboarding
            </Link>
          ) : null}
          {user && canAccessOnboarding(user) ? (
            <Link className="app-nav__link" to="/employees">
              Employees
            </Link>
          ) : null}
        </nav>

        <div className="app-header__actions">
          {user ? (
            <>
              <span className="app-header__user">
                {user.firstName} {user.lastName}
              </span>
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => void logout()}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link className="btn btn--ghost" to="/login">
              Sign in
            </Link>
          )}
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
