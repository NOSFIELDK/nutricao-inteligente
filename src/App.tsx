import * as React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";

import { AppShell } from "@/components/AppShell";
import { ReminderBanner } from "@/components/ReminderBanner";

const RootRedirect = React.lazy(() => import("@/pages/RootRedirect"));
const ProfilePage = React.lazy(() => import("@/pages/Profile"));
const DashboardPage = React.lazy(() => import("@/pages/Dashboard"));
const HistoryPage = React.lazy(() => import("@/pages/History"));
const RecipesPage = React.lazy(() => import("@/pages/Recipes"));
const RecipeDetailPage = React.lazy(() => import("@/pages/RecipeDetail"));
const FoodsPage = React.lazy(() => import("@/pages/Foods"));
const SupplementsPage = React.lazy(() => import("@/pages/Supplements"));
const PlanPage = React.lazy(() => import("@/pages/Plan"));
const ShoppingPage = React.lazy(() => import("@/pages/Shopping"));
const InsightsPage = React.lazy(() => import("@/pages/Insights"));
const SettingsPage = React.lazy(() => import("@/pages/Settings"));

function RouteFallback() {
  return (
    <div className="mx-auto grid max-w-[1220px] gap-6 px-4 pb-24 pt-6 md:pb-10">
      <div className="rounded-2xl bg-card/70 p-4 text-sm text-muted ring-1 ring-border shadow-crisp">
        Carregando…
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Router>
        <React.Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route element={<AppShell />}>
              <Route path="/perfil" element={<ProfilePage />} />
              <Route path="/painel" element={<DashboardPage />} />
              <Route path="/historico" element={<HistoryPage />} />
              <Route path="/receitas" element={<RecipesPage />} />
              <Route path="/receitas/:id" element={<RecipeDetailPage />} />
              <Route path="/alimentos" element={<FoodsPage />} />
              <Route path="/suplementos" element={<SupplementsPage />} />
              <Route path="/plano" element={<PlanPage />} />
              <Route path="/compras" element={<ShoppingPage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="/configuracoes" element={<SettingsPage />} />
            </Route>
          </Routes>
        </React.Suspense>
      </Router>
      <ReminderBanner />
    </>
  );
}
