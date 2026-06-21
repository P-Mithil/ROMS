import { Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__logo">R</span>
          <span className="app-header__title">ROMS</span>
        </div>
        <span className="app-header__subtitle">
          Recruitment to Onboarding Management System
        </span>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
