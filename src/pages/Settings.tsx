import * as React from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import type { ReminderInterval } from "@/domain/models";
import { useTheme } from "@/hooks/useTheme";
import { createBackup, resetAll, restoreBackup } from "@/storage/backup";
import { STORAGE_KEYS } from "@/storage/keys";
import { useAppStore } from "@/store/useAppStore";

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const INTERVALS: { value: ReminderInterval; label: string }[] = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1h30" },
  { value: 120, label: "2 horas" },
];

export default function SettingsPage() {
  const { isDark, toggleTheme } = useTheme();
  const [importError, setImportError] = React.useState<string | null>(null);
  const [apiBase, setApiBase] = React.useState(() => localStorage.getItem(STORAGE_KEYS.apiBase) ?? "");
  const [notifStatus, setNotifStatus] = React.useState<NotificationPermission | "unsupported">(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );
  const [newLabel, setNewLabel] = React.useState("");
  const [newMessage, setNewMessage] = React.useState("");
  const [newInterval, setNewInterval] = React.useState<ReminderInterval>(60);

  const reminders = useAppStore((s) => s.reminders);
  const setReminderEnabled = useAppStore((s) => s.setReminderEnabled);
  const setReminderInterval = useAppStore((s) => s.setReminderInterval);
  const addReminder = useAppStore((s) => s.addReminder);
  const removeReminder = useAppStore((s) => s.removeReminder);

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
    if (!window.confirm("Apagar todos os dados locais? Perfil, favoritos e plano serão removidos. Essa ação não pode ser desfeita.")) return;
    resetAll();
    window.location.reload();
  };

  const onSaveApiBase = () => {
    const cleaned = apiBase.trim().replace(/\/+$/g, "");
    if (!cleaned) {
      localStorage.removeItem(STORAGE_KEYS.apiBase);
      window.location.reload();
      return;
    }
    localStorage.setItem(STORAGE_KEYS.apiBase, cleaned);
    window.location.reload();
  };

  const requestNotifPermission = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifStatus(perm);
  };

  const onToggleReminder = (id: string, enabled: boolean) => {
    if (enabled && notifStatus === "default") {
      requestNotifPermission();
    }
    setReminderEnabled(id, enabled);
  };

  const onAddReminder = () => {
    if (!newLabel.trim() || !newMessage.trim()) return;
    addReminder(newLabel.trim(), newMessage.trim(), newInterval);
    setNewLabel("");
    setNewMessage("");
  };

  return (
    <div className="grid gap-6">
      <div>
        <div className="font-display text-2xl tracking-tight text-fg">Configurações</div>
        <div className="mt-1 text-sm text-muted">Preferências, lembretes, backup e reset do app.</div>
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
            <CardTitle>API de receitas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="text-sm text-muted">
              URL do seu Worker (Cloudflare) para habilitar busca quase infinita com macros estimados.
            </div>
            <TextField
              label="Base URL"
              placeholder="Ex.: https://nutricao-inteligente-api.seuusuario.workers.dev"
              value={apiBase}
              onChange={(e) => setApiBase(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={onSaveApiBase}>Salvar</Button>
              <Button variant="secondary" onClick={() => setApiBase("")}>
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backup / Restore</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="text-sm text-muted">
              Exporta e importa seus dados em um arquivo JSON.
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
            <CardTitle>Lembretes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            {notifStatus === "denied" && (
              <div className="rounded-xl bg-card-2/60 p-3 text-sm text-muted ring-1 ring-border">
                Notificações bloqueadas no navegador. Ative nas configurações do navegador para receber alertas mesmo com a aba em segundo plano. Os lembretes ainda funcionam enquanto o app estiver aberto.
              </div>
            )}
            {notifStatus === "default" && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-accent/10 p-3 ring-1 ring-accent/20">
                <div className="text-sm text-fg/90">Ative notificações do navegador para alertas em segundo plano.</div>
                <Button size="sm" onClick={requestNotifPermission}>Ativar</Button>
              </div>
            )}

            <div className="grid gap-3">
              {reminders.map((r) => (
                <div key={r.id} className="flex flex-col gap-3 rounded-xl bg-card-2/50 p-4 ring-1 ring-border sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggleReminder(r.id, !r.enabled)}
                      className={[
                        "relative h-6 w-11 shrink-0 rounded-full ring-1 transition-colors duration-200",
                        r.enabled ? "bg-accent ring-accent/40" : "bg-border ring-border",
                      ].join(" ")}
                      aria-label={r.enabled ? "Desativar" : "Ativar"}
                    >
                      <span
                        className={[
                          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
                          r.enabled ? "translate-x-5" : "translate-x-0.5",
                        ].join(" ")}
                      />
                    </button>
                    <div>
                      <div className="text-sm font-medium text-fg">{r.label}</div>
                      <div className="text-xs text-muted">{r.message}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={r.intervalMinutes}
                      onChange={(e) => setReminderInterval(r.id, Number(e.target.value) as ReminderInterval)}
                      className="h-9 rounded-lg bg-card-2 px-3 text-sm text-fg ring-1 ring-border transition hover:bg-card"
                    >
                      {INTERVALS.map((i) => (
                        <option key={i.value} value={i.value}>{i.label}</option>
                      ))}
                    </select>
                    {!["water", "snack", "stretch"].includes(r.id) && (
                      <Button variant="ghost" size="sm" onClick={() => removeReminder(r.id)}>
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 rounded-xl bg-card-2/40 p-4 ring-1 ring-border">
              <div className="text-xs font-medium text-fg/90">Criar lembrete personalizado</div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  placeholder="Nome (ex.: Tomar vitamina)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="h-10 rounded-lg bg-card px-3 text-sm text-fg ring-1 ring-border placeholder:text-muted focus:outline-none focus:ring-accent/40"
                />
                <input
                  placeholder="Mensagem"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="h-10 rounded-lg bg-card px-3 text-sm text-fg ring-1 ring-border placeholder:text-muted focus:outline-none focus:ring-accent/40"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={newInterval}
                  onChange={(e) => setNewInterval(Number(e.target.value) as ReminderInterval)}
                  className="h-9 rounded-lg bg-card-2 px-3 text-sm text-fg ring-1 ring-border"
                >
                  {INTERVALS.map((i) => (
                    <option key={i.value} value={i.value}>{i.label}</option>
                  ))}
                </select>
                <Button onClick={onAddReminder} disabled={!newLabel.trim() || !newMessage.trim()}>
                  Adicionar
                </Button>
              </div>
            </div>
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
