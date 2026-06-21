import { Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout.js";
import { HomePage } from "../pages/HomePage.js";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>
    </Routes>
  );
}
