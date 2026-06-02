import * as React from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useTheme } from "@/hooks/useTheme";
import { createBackup, resetAll, restoreBackup } from "@/storage/backup";

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SettingsPage() {
  const { isDark, toggleTheme } = useTheme();
  const [importError, setImportError] = React.useState<string | null>(null);

  const onExport = () => {
    const data = createBackup();
    download(`nutricao-inteligente-backup-${data.createdAtISO.slice(0, 10)}.json`, JSON.stringify(data, null, 2));
  };

  const onImport = async (file: File | null) => {
    if (!file) return;
    setImportError(null);
    try {
      const raw = JSON.parse(await file.text());
      restoreBackup(raw);
      window.location.reload();
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Falha ao importar.");
    }
  };

  const onReset = () => {
    resetAll();
    window.location.reload();
  };

  return (
    <div className="grid gap-6">
      <div>
        <div className="font-display text-2xl tracking-tight text-fg">Configurações</div>
        <div className="mt-1 text-sm text-muted">Preferências, backup e reset do app.</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tema</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="text-sm text-muted">Tema atual: {isDark ? "Escuro" : "Claro"}</div>
            <Button variant="secondary" onClick={toggleTheme}>
              Alternar tema
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backup / Restore</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="text-sm text-muted">
              Exporta e importa seus dados (perfil, favoritos, plano e marcações da lista de compras) em um arquivo JSON.
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={onExport}>Exportar</Button>
              <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg bg-card-2 px-4 text-sm font-medium text-fg ring-1 ring-border shadow-crisp transition hover:bg-card active:translate-y-px active:shadow-none">
                Importar
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => onImport(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            {importError ? <div className="text-sm font-medium text-red-500">{importError}</div> : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Reset</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="text-sm text-muted">Apaga todos os dados locais deste app neste dispositivo.</div>
            <Button variant="danger" onClick={onReset}>
              Apagar dados locais
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

