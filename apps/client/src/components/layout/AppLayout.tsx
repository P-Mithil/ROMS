import { NavLink, Outlet } from "react-router-dom";
import { Icon } from "../ui/Icon.js";
import { useAuth } from "../../features/auth/useAuth.js";
import { canAccessCandidates } from "../../features/candidates/utils/permissions.js";
import { canAccessInterviews } from "../../features/interviews/utils/permissions.js";
import { canAccessOffers } from "../../features/offers/utils/permissions.js";
import { canAccessOnboarding } from "../../features/onboarding/utils/permissions.js";
import { canAccessReports } from "../../features/reports/utils/permissions.js";
import { canAccessRequisitions } from "../../features/requisitions/utils/permissions.js";

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="app-header">
        <div className="app-header__brand">
          <NavLink className="app-header__brand-link" to="/">
            <span className="app-header__logo" aria-hidden="true">
              R
            </span>
            <span className="app-header__title">ROMS</span>
          </NavLink>
        </div>

        <nav className="app-nav" aria-label="Primary">
          {user && canAccessRequisitions(user) ? (
            <NavLink className="app-nav__link" to="/requisitions">
              <Icon name="briefcase" />
              <span>Requisitions</span>
            </NavLink>
          ) : null}
          {user && canAccessCandidates(user) ? (
            <NavLink className="app-nav__link" to="/candidates">
              <Icon name="users" />
              <span>Candidates</span>
            </NavLink>
          ) : null}
          {user && canAccessInterviews(user) ? (
            <NavLink className="app-nav__link" to="/interviews">
              <Icon name="calendar" />
              <span>Interviews</span>
            </NavLink>
          ) : null}
          {user && canAccessOffers(user) ? (
            <NavLink className="app-nav__link" to="/offers">
              <Icon name="fileText" />
              <span>Offers</span>
            </NavLink>
          ) : null}
          {user && canAccessOnboarding(user) ? (
            <NavLink className="app-nav__link" to="/onboarding">
              <Icon name="clipboard" />
              <span>Onboarding</span>
            </NavLink>
          ) : null}
          {user && canAccessOnboarding(user) ? (
            <NavLink className="app-nav__link" to="/employees">
              <Icon name="userCheck" />
              <span>Employees</span>
            </NavLink>
          ) : null}
          {user && canAccessReports(user) ? (
            <NavLink className="app-nav__link" to="/reports">
              <Icon name="barChart" />
              <span>Reports</span>
            </NavLink>
          ) : null}
        </nav>

        <div className="app-header__actions">
          {user ? (
            <>
              <span className="app-header__user">
                {user.firstName} {user.lastName}
                <span className="app-header__role">{user.role.replaceAll("_", " ")}</span>
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
            <NavLink className="btn btn--ghost" to="/login">
              Sign in
            </NavLink>
          )}
        </div>
      </header>
      <main id="main-content" className="app-main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
