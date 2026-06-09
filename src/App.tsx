import * as React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { AppShell } from "@/components/AppShell";
import { LeifChat } from "@/components/LeifChat";
import { LeifMascot } from "@/components/LeifMascot";
import { ReminderBanner } from "@/components/ReminderBanner";
import { SyncManager } from "@/components/SyncManager";
import { useAppStore } from "@/store/useAppStore";

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
const AboutPage = React.lazy(() => import("@/pages/About"));
const ResetPasswordPage = React.lazy(() => import("@/pages/ResetPassword"));
const NotFoundPage = React.lazy(() => import("@/pages/NotFound"));

function RouteFallback() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-[1220px] place-items-center px-4 pb-24 pt-6 md:pb-10">
      <div className="flex flex-col items-center gap-4">
        <div className="h-24 w-24">
          <LeifMascot variant="avatar" mood="normal" animated className="h-full w-full" />
        </div>
        <div className="font-display text-sm tracking-wide text-muted">Reunindo o clã…</div>
      </div>
    </div>
  );
}

function AccessibilitySync() {
  const highContrast = useAppStore((s) => s.highContrast);
  const fontScale = useAppStore((s) => s.fontScale);

  React.useEffect(() => {
    document.documentElement.classList.toggle("hc", highContrast);
  }, [highContrast]);

  React.useEffect(() => {
    document.documentElement.classList.remove("fs-112", "fs-125");
    if (fontScale === "112") document.documentElement.classList.add("fs-112");
    if (fontScale === "125") document.documentElement.classList.add("fs-125");
  }, [fontScale]);

  return null;
}

export default function App() {
  return (
    <>
      <AccessibilitySync />
      <SyncManager />
      <Router basename={import.meta.env.BASE_URL}>
        <React.Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route element={<AppShell />}>
              <Route path="/perfil" element={<ProfilePage />} />
              <Route path="/painel" element={<DashboardPage />} />
              <Route path="/historico" element={<HistoryPage />} />
              <Route path="/sobre" element={<AboutPage />} />
              <Route path="/receitas" element={<RecipesPage />} />
              <Route path="/receitas/:id" element={<RecipeDetailPage />} />
              <Route path="/alimentos" element={<FoodsPage />} />
              <Route path="/suplementos" element={<SupplementsPage />} />
              <Route path="/plano" element={<PlanPage />} />
              <Route path="/compras" element={<ShoppingPage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="/configuracoes" element={<SettingsPage />} />
              <Route path="/reset-senha" element={<ResetPasswordPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </React.Suspense>
      </Router>
      <ReminderBanner />
      <LeifChat />
    </>
  );
}
