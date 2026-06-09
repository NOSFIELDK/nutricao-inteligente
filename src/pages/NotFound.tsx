import { Link } from "react-router-dom";

import { LeifEmptyState } from "@/components/LeifSays";

export default function NotFoundPage() {
  return (
    <div className="grid gap-6">
      <LeifEmptyState
        mood="sad"
        title="Página não encontrada"
        message="Esta rota se perdeu nas brumas de Niflheim, guerreiro. Volte ao salão e siga sua jornada."
      />
      <div className="flex justify-center">
        <Link
          to="/painel"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-5 text-sm font-medium text-fg shadow-crisp transition hover:brightness-[1.02] active:translate-y-px active:shadow-none"
        >
          ⚔️ Voltar ao Salão
        </Link>
      </div>
    </div>
  );
}
