import { Navigate } from "react-router-dom";

import { useAppStore } from "@/store/useAppStore";

export default function RootRedirect() {
  const profile = useAppStore((s) => s.profile);
  return <Navigate to={profile ? "/painel" : "/perfil"} replace />;
}

