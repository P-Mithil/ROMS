import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { RoleName } from "@roms/shared";
import { useAuth } from "./useAuth.js";

type ProtectedRouteProps = {
  roles?: RoleName[];
};

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="page-loading">
        <span className="badge badge--loading">Loading…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !hasRole(...roles)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
