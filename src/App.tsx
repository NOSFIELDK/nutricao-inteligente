import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { AppShell } from "@/components/AppShell";
import DashboardPage from "@/pages/Dashboard";
import FoodsPage from "@/pages/Foods";
import InsightsPage from "@/pages/Insights";
import PlanPage from "@/pages/Plan";
import ProfilePage from "@/pages/Profile";
import RecipeDetailPage from "@/pages/RecipeDetail";
import RecipesPage from "@/pages/Recipes";
import RootRedirect from "@/pages/RootRedirect";
import SettingsPage from "@/pages/Settings";
import ShoppingPage from "@/pages/Shopping";
import SupplementsPage from "@/pages/Supplements";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route element={<AppShell />}>
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/painel" element={<DashboardPage />} />
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
    </Router>
  );
}
