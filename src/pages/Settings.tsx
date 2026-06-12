import * as React from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import * as SyncApi from "@/api/syncApi";
import { forceSync } from "@/api/syncActions";
import { calcDayMacros } from "@/domain/nutrition/insights";
import { buildTargets } from "@/domain/nutrition/targets";
import type { FontScale, NutritionTargets, ReminderInterval } from "@/domain/models";
import { useTheme } from "@/hooks/useTheme";
import { createBackup, resetAll, restoreBackup } from "@/storage/backup";
import { STORAGE_KEYS } from "@/storage/keys";
import { useAppStore } from "@/store/useAppStore";
import { LeifMascot } from "@/components/LeifMascot";
import { addDaysISO, mealSlotLabel, todayISO } from "@/utils/date";
import { catalog } from "@/data/catalog";
import { getItem, itemTitle } from "@/domain/catalog";

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
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
  const [authEmail, setAuthEmail] = React.useState("");
  const [authPassword, setAuthPassword] = React.useState("");
  const [accountEmail, setAccountEmail] = React.useState<string | null>(null);
  const [syncStatus, setSyncStatus] = React.useState<string | null>(null);
  const [syncBusy, setSyncBusy] = React.useState(false);
  const [forcing, setForcing] = React.useState(false);
  const [forceMsg, setForceMsg] = React.useState<string | null>(null);

  const profile = useAppStore((s) => s.profile);
  const favorites = useAppStore((s) => s.favorites);
  const plan = useAppStore((s) => s.plan);
  const recipeCache = useAppStore((s) => s.recipeCache);
  const consumedPlan = useAppStore((s) => s.consumedPlan);
  const shoppingChecked = useAppStore((s) => s.shoppingChecked);
  const manualByDate = useAppStore((s) => s.manualByDate);
  const waterByDate = useAppStore((s) => s.waterByDate);
  const checkInByDate = useAppStore((s) => s.checkInByDate);
  const labelScansByDate = useAppStore((s) => s.labelScansByDate);
  const customTargets = useAppStore((s) => s.customTargets);
  const setCustomTargets = useAppStore((s) => s.setCustomTargets);
  const clearCustomTargets = useAppStore((s) => s.clearCustomTargets);
  const highContrast = useAppStore((s) => s.highContrast);
  const setHighContrast = useAppStore((s) => s.setHighContrast);
  const fontScale = useAppStore((s) => s.fontScale);
  const setFontScale = useAppStore((s) => s.setFontScale);
  const mascotStyle = useAppStore((s) => s.mascotStyle);
  const setMascotStyle = useAppStore((s) => s.setMascotStyle);
  const mascotSize = useAppStore((s) => s.mascotSize);
  const setMascotSize = useAppStore((s) => s.setMascotSize);
  const mascotItem = useAppStore((s) => s.mascotItem);
  const setMascotItem = useAppStore((s) => s.setMascotItem);

  const reminders = useAppStore((s) => s.reminders);
  const setReminderEnabled = useAppStore((s) => s.setReminderEnabled);
  const setReminderInterval = useAppStore((s) => s.setReminderInterval);
  const addReminder = useAppStore((s) => s.addReminder);
  const removeReminder = useAppStore((s) => s.removeReminder);
  const markSynced = useAppStore((s) => s.markSynced);
  const applyRemote = useAppStore((s) => s.applyRemote);
  const syncDirty = useAppStore((s) => s.syncDirty);
  const syncLastSyncedAt = useAppStore((s) => s.syncLastSyncedAt);

  const SYNC_KEYS = [
    { key: "profile" as const, label: "Perfil" },
    { key: "plan" as const, label: "Plano" },
    { key: "tracking" as const, label: "Registros" },
    { key: "prefs" as const, label: "Preferências" },
  ];
  const pendingKeys = SYNC_KEYS.filter((k) => syncDirty[k.key]);
  const lastSyncAt = (() => {
    const times = [syncLastSyncedAt.profile, syncLastSyncedAt.plan, syncLastSyncedAt.tracking, syncLastSyncedAt.prefs].filter(Boolean) as string[];
    if (times.length === 0) return null;
    return times.sort().at(-1) ?? null;
  })();

  const onForceSync = async () => {
    setForcing(true);
    setForceMsg(null);
    try {
      const res = await forceSync();
      setForceMsg(`Sincronizado. Enviados: ${res.pushedKeys.length} · baixados: ${res.appliedKeys.length}.`);
    } catch (e) {
      setForceMsg(e instanceof Error ? e.message : "Falha ao sincronizar.");
    } finally {
      setForcing(false);
    }
  };

  const baseTargets = React.useMemo(() => buildTargets(profile, null), [profile]);
  const effectiveTargets = React.useMemo(() => buildTargets(profile, customTargets), [profile, customTargets]);
  const [proteinTarget, setProteinTarget] = React.useState(String(effectiveTargets.proteinG));
  const [fiberTarget, setFiberTarget] = React.useState(String(effectiveTargets.fiberG));
  const [waterTarget, setWaterTarget] = React.useState(String(effectiveTargets.waterMl));

  React.useEffect(() => {
    setProteinTarget(String(effectiveTargets.proteinG));
    setFiberTarget(String(effectiveTargets.fiberG));
    setWaterTarget(String(effectiveTargets.waterMl));
  }, [effectiveTargets.fiberG, effectiveTargets.proteinG, effectiveTargets.waterMl]);

  React.useEffect(() => {
    if (!apiBase.trim()) return;
    if (!localStorage.getItem(STORAGE_KEYS.authToken)) return;
    SyncApi.me()
      .then((r) => setAccountEmail(r.email))
      .catch(() => {
        SyncApi.logout();
        setAccountEmail(null);
      });
  }, [apiBase]);

  React.useEffect(() => {
    if (!apiBase.trim()) return;
    const h = window.location.hash ?? "";
    const qIndex = h.indexOf("?");
    if (qIndex === -1) return;
    const qs = h.slice(qIndex + 1);
    const params = new URLSearchParams(qs);
    const token = params.get("token");
    const verified = params.get("verified");
    if (token) {
      localStorage.setItem(STORAGE_KEYS.authToken, token);
      params.delete("token");
      SyncApi.me()
        .then((r) => setAccountEmail(r.email))
        .catch(() => {});
      setSyncStatus("Conectado.");
    }
    if (verified) {
      params.delete("verified");
      setSyncStatus("Email confirmado.");
    }
    if (token || verified) {
      const nextHash = `${h.slice(0, qIndex)}${params.toString() ? `?${params.toString()}` : ""}`;
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${nextHash}`);
    }
  }, [apiBase]);

  const onExport = () => {
    const data = createBackup();
    download(`nutricao-inteligente-backup-${data.createdAtISO.slice(0, 10)}.json`, JSON.stringify(data, null, 2));
  };

  const onExportCsv = () => {
    const date = todayISO();
    const days = Array.from({ length: 14 }).map((_, idx) => addDaysISO(date, -idx)).reverse();
    const mergedCatalog = [...catalog, ...Object.values(recipeCache)];

    const header = ["dateISO", "proteinG", "carbsG", "fatG", "fiberG", "waterMl", "consumedPlanItems", "planItems", "manualEntries"].join(",");
    const rows = days.map((d) => {
      const dayPlan = plan.filter((p) => p.dateISO === d);
      const dayConsumed = dayPlan.filter((p) => consumedPlan[p.id]);
      const m = calcDayMacros({ catalog: mergedCatalog, plan: dayConsumed, dateISO: d });
      const manual = (manualByDate[d] ?? []).reduce(
        (acc, e) => ({
          proteinG: acc.proteinG + e.proteinG,
          carbsG: acc.carbsG + e.carbsG,
          fatG: acc.fatG + e.fatG,
          fiberG: acc.fiberG + e.fiberG,
        }),
        { proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
      );
      const proteinG = Math.round((m.proteinG + manual.proteinG) * 10) / 10;
      const carbsG = Math.round((m.carbsG + manual.carbsG) * 10) / 10;
      const fatG = Math.round((m.fatG + manual.fatG) * 10) / 10;
      const fiberG = Math.round((m.fiberG + manual.fiberG) * 10) / 10;
      const waterMl = waterByDate[d] ?? 0;
      return [d, proteinG, carbsG, fatG, fiberG, waterMl, dayConsumed.length, dayPlan.length, (manualByDate[d] ?? []).length].join(",");
    });

    downloadText(`nutricao-inteligente-historico-${date}.csv`, [header, ...rows].join("\n"), "text/csv;charset=utf-8");
  };

  const onExportPlanCsv = () => {
    const start = todayISO();
    const days = Array.from({ length: 7 }).map((_, i) => addDaysISO(start, i));
    const mergedCatalog = [...catalog, ...Object.values(recipeCache)];
    const header = ["dateISO", "mealSlot", "title", "servings", "consumed", "type"].join(",");
    const rows: string[] = [];

    for (const d of days) {
      const dayPlan = plan.filter((p) => p.dateISO === d);
      for (const p of dayPlan) {
        const item = getItem(mergedCatalog, { type: p.itemType, id: p.itemId });
        const title = item ? itemTitle(item).replace(/"/g, '""') : "Item";
        rows.push([d, mealSlotLabel(p.mealSlot), `"${title}"`, p.servings, consumedPlan[p.id] ? "1" : "0", p.itemType].join(","));
      }
      for (const e of manualByDate[d] ?? []) {
        const title = e.title.replace(/"/g, '""');
        rows.push([d, "Manual", `"${title}"`, 1, "1", "manual"].join(","));
      }
    }

    downloadText(`nutricao-inteligente-plano-${start}.csv`, [header, ...rows].join("\n"), "text/csv;charset=utf-8");
  };

  const onPrintSummary = () => {
    const start = todayISO();
    const days = Array.from({ length: 7 }).map((_, i) => addDaysISO(start, i));
    const mergedCatalog = [...catalog, ...Object.values(recipeCache)];
    const html = `
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nutrição Inteligente — Resumo</title>
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;margin:24px;color:#111}
      h1{margin:0 0 6px 0;font-size:20px}
      h2{margin:18px 0 8px 0;font-size:14px}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th,td{border:1px solid #ddd;padding:8px;font-size:12px;text-align:left;vertical-align:top}
      th{background:#f4f4f4}
      .muted{color:#555;font-size:12px}
    </style>
  </head>
  <body>
    <h1>Nutrição Inteligente — Plano semanal</h1>
    <div class="muted">Semana iniciando em ${start}</div>
    <table>
      <thead><tr><th>Dia</th><th>Refeição</th><th>Item</th><th>Porções</th><th>Consumido</th></tr></thead>
      <tbody>${days
        .map((d) => {
          const dayPlan = plan.filter((p) => p.dateISO === d);
          const items = dayPlan
            .map((p) => {
              const item = getItem(mergedCatalog, { type: p.itemType, id: p.itemId });
              const title = item ? itemTitle(item) : "Item";
              const consumed = consumedPlan[p.id] ? "Sim" : "Não";
              return `<tr><td>${d}</td><td>${mealSlotLabel(p.mealSlot)}</td><td>${title}</td><td>${p.servings}</td><td>${consumed}</td></tr>`;
            })
            .join("");
          const manual = (manualByDate[d] ?? [])
            .map((e) => `<tr><td>${d}</td><td>Manual</td><td>${e.title}</td><td>1</td><td>Sim</td></tr>`)
            .join("");
          return items + manual;
        })
        .join("")}</tbody>
    </table>
  </body>
</html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
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
    const cleaned = apiBase
      .trim()
      .replace(/\/+$/g, "")
      .replace(/\/api\/?$/i, "");
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

  const onSaveTargets = () => {
    const next: NutritionTargets = {
      proteinG: Number(proteinTarget) || 0,
      fiberG: Number(fiberTarget) || 0,
      waterMl: Number(waterTarget) || 0,
    };
    setCustomTargets(next);
  };

  const apiConfigured = Boolean(apiBase.trim());

  const refreshMe = React.useCallback(() => {
    if (!apiConfigured) return;
    if (!localStorage.getItem(STORAGE_KEYS.authToken)) return;
    SyncApi.me()
      .then((r) => setAccountEmail(r.email))
      .catch(() => {
        SyncApi.logout();
        setAccountEmail(null);
      });
  }, [apiConfigured]);

  const onRegister = async () => {
    if (!apiConfigured) return;
    setSyncBusy(true);
    setSyncStatus(null);
    try {
      await SyncApi.register({ email: authEmail, password: authPassword });
      refreshMe();
      setSyncStatus("Conta criada e conectada.");
    } catch (e) {
      setSyncStatus(e instanceof Error ? e.message : "Falha ao registrar.");
    } finally {
      setSyncBusy(false);
    }
  };

  const onLogin = async () => {
    if (!apiConfigured) return;
    setSyncBusy(true);
    setSyncStatus(null);
    try {
      await SyncApi.login({ email: authEmail, password: authPassword });
      refreshMe();
      setSyncStatus("Conectado.");
    } catch (e) {
      setSyncStatus(e instanceof Error ? e.message : "Falha ao entrar.");
    } finally {
      setSyncBusy(false);
    }
  };

  const onGoogleLogin = () => {
    if (!apiConfigured) return;
    const returnTo = `${window.location.origin}${window.location.pathname}#/configuracoes`;
    window.location.assign(SyncApi.googleStartUrl(returnTo));
  };

  const onRequestReset = async () => {
    if (!apiConfigured) return;
    setSyncBusy(true);
    setSyncStatus(null);
    try {
      await SyncApi.requestPasswordReset({ email: authEmail });
      setSyncStatus("Se existir uma conta com esse email, enviamos um link de redefinição.");
    } catch (e) {
      setSyncStatus(e instanceof Error ? e.message : "Falha ao solicitar reset.");
    } finally {
      setSyncBusy(false);
    }
  };

  const onLogout = () => {
    SyncApi.logout();
    setAccountEmail(null);
    setSyncStatus("Desconectado.");
  };

  const onSyncPush = async () => {
    if (!apiConfigured) return;
    setSyncBusy(true);
    setSyncStatus(null);
    try {
      const res = await SyncApi.pushItems({
        profile: { profile, favorites, customTargets },
        plan: { plan, consumedPlan, shoppingChecked, recipeCache },
        tracking: { waterByDate, manualByDate, checkInByDate, labelScansByDate },
        prefs: { reminders, highContrast, fontScale },
      });
      Object.entries(res.updatedAt ?? {}).forEach(([k, ts]) => {
        if (ts) markSynced(k as SyncApi.SyncV2Key, ts);
      });
      setSyncStatus("Enviado.");
    } catch (e) {
      setSyncStatus(e instanceof Error ? e.message : "Falha ao enviar.");
    } finally {
      setSyncBusy(false);
    }
  };

  const onSyncPull = async () => {
    if (!apiConfigured) return;
    if (!window.confirm("Baixar do servidor e substituir seus dados locais?")) return;
    setSyncBusy(true);
    setSyncStatus(null);
    try {
      const res = await SyncApi.pullItems();
      const items = res.items ?? {};
      const keys = Object.keys(items) as SyncApi.SyncV2Key[];
      if (keys.length === 0) {
        setSyncStatus("Sem dados salvos no servidor.");
        return;
      }
      keys.forEach((k) => {
        const item = items[k];
        if (!item) return;
        applyRemote(k, item.data, item.updatedAt);
      });
      window.location.reload();
    } catch (e) {
      setSyncStatus(e instanceof Error ? e.message : "Falha ao baixar.");
    } finally {
      setSyncBusy(false);
    }
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
            <CardTitle>Conta e sincronização</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {!apiConfigured ? (
              <div className="text-sm text-muted">
                Configure a Base URL da API para habilitar login e sync.
              </div>
            ) : accountEmail ? (
              <div className="text-sm text-muted">
                Conectado como <span className="font-medium text-fg">{accountEmail}</span>
              </div>
            ) : (
              <div className="text-sm text-muted">Desconectado.</div>
            )}

            {!accountEmail && (
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField label="Email" inputMode="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
                <TextField label="Senha" type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} />
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {accountEmail ? (
                <>
                  <Button variant="secondary" onClick={onSyncPull} disabled={!apiConfigured || syncBusy}>
                    Baixar
                  </Button>
                  <Button onClick={onSyncPush} disabled={!apiConfigured || syncBusy}>
                    Enviar
                  </Button>
                  <Button variant="ghost" onClick={onLogout} disabled={syncBusy}>
                    Sair
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={onLogin} disabled={!apiConfigured || syncBusy || !authEmail.trim() || authPassword.length < 8}>
                    Entrar
                  </Button>
                  <Button variant="secondary" onClick={onRegister} disabled={!apiConfigured || syncBusy || !authEmail.trim() || authPassword.length < 8}>
                    Criar conta
                  </Button>
                  <Button variant="secondary" onClick={onGoogleLogin} disabled={!apiConfigured || syncBusy}>
                    Entrar com Google
                  </Button>
                  <Button variant="ghost" onClick={onRequestReset} disabled={!apiConfigured || syncBusy || !authEmail.trim()}>
                    Esqueci minha senha
                  </Button>
                </>
              )}
            </div>
            {syncStatus ? <div className="text-sm text-muted">{syncStatus}</div> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status da nuvem</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {!apiConfigured || !accountEmail ? (
              <div className="text-sm text-muted">Conecte uma conta acima para sincronizar entre dispositivos.</div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-card-2/50 p-3 ring-1 ring-border">
                  <div className="text-sm text-fg/90">Último sync</div>
                  <div className="text-sm text-muted tabular-nums">
                    {lastSyncAt ? new Date(lastSyncAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </div>
                </div>
                <div className="rounded-xl bg-card-2/50 p-3 ring-1 ring-border">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-fg/90">Itens pendentes</div>
                    <div className="text-sm text-muted tabular-nums">{pendingKeys.length}</div>
                  </div>
                  {pendingKeys.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {pendingKeys.map((k) => (
                        <span key={k.key} className="rounded-full bg-accent-2/15 px-2 py-0.5 text-[11px] font-medium text-fg ring-1 ring-accent-2/25">
                          {k.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={onForceSync} disabled={forcing}>
                    {forcing ? "Sincronizando…" : "Forçar sincronização"}
                  </Button>
                  {pendingKeys.length === 0 && !forcing ? <span className="text-xs text-muted">Tudo sincronizado ✓</span> : null}
                </div>
                {forceMsg ? <div className="text-sm text-muted">{forceMsg}</div> : null}
              </>
            )}
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
              <Button variant="secondary" onClick={onExportCsv}>CSV (histórico)</Button>
              <Button variant="secondary" onClick={onExportPlanCsv}>CSV (plano)</Button>
              <Button variant="secondary" onClick={onPrintSummary}>Imprimir (PDF)</Button>
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

        <Card>
          <CardHeader>
            <CardTitle>Metas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="text-sm text-muted">
              Metas automáticas (base): proteína {Math.round(baseTargets.proteinG)}g, fibras {baseTargets.fiberG}g, água {baseTargets.waterMl}ml.
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <TextField label="Proteína (g)" inputMode="decimal" value={proteinTarget} onChange={(e) => setProteinTarget(e.target.value)} />
              <TextField label="Fibras (g)" inputMode="decimal" value={fiberTarget} onChange={(e) => setFiberTarget(e.target.value)} />
              <TextField label="Água (ml)" inputMode="numeric" value={waterTarget} onChange={(e) => setWaterTarget(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={onSaveTargets}>Salvar metas</Button>
              <Button variant="secondary" onClick={clearCustomTargets} disabled={!customTargets}>
                Usar automático
              </Button>
              <div className="text-xs text-muted self-center">
                Ativas: proteína {Math.round(effectiveTargets.proteinG)}g · fibras {effectiveTargets.fiberG}g · água {effectiveTargets.waterMl}ml
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acessibilidade</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <label className="flex items-center justify-between gap-3 rounded-xl bg-card-2/50 p-3 ring-1 ring-border">
              <div className="text-sm text-fg/90">Alto contraste</div>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="h-4 w-4 accent-[hsl(var(--accent))]"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-fg/90">Tamanho da fonte</span>
              <select
                value={fontScale}
                onChange={(e) => setFontScale(e.target.value as FontScale)}
                className="h-11 w-full appearance-none rounded-lg bg-card/70 px-3 text-sm text-fg ring-1 ring-border shadow-crisp outline-none transition focus:ring-2 focus:ring-accent/35"
              >
                <option value="100">Padrão</option>
                <option value="112">Maior</option>
                <option value="125">Muito maior</option>
              </select>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mascote (Leif)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex items-center justify-center rounded-xl bg-card-2/40 p-4 ring-1 ring-border">
              <div className="h-32 w-28">
                <LeifMascot variant="full" mood="celebrate" pose="hero" item={mascotItem} style={mascotStyle} animated className="h-full w-full" />
              </div>
            </div>
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-fg/90">Estilo</span>
              <select
                value={mascotStyle}
                onChange={(e) => setMascotStyle(e.target.value as "crafted" | "blocky")}
                className="h-11 w-full appearance-none rounded-lg bg-card/70 px-3 text-sm text-fg ring-1 ring-border shadow-crisp outline-none transition focus:ring-2 focus:ring-accent/35"
              >
                <option value="crafted">Clássico (vetorial)</option>
                <option value="blocky">Blocky (pixel)</option>
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-fg/90">Tamanho</span>
              <select
                value={mascotSize}
                onChange={(e) => setMascotSize(e.target.value as "sm" | "md" | "lg")}
                className="h-11 w-full appearance-none rounded-lg bg-card/70 px-3 text-sm text-fg ring-1 ring-border shadow-crisp outline-none transition focus:ring-2 focus:ring-accent/35"
              >
                <option value="sm">Pequeno</option>
                <option value="md">Médio</option>
                <option value="lg">Grande</option>
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-fg/90">Item</span>
              <select
                value={mascotItem}
                onChange={(e) => setMascotItem(e.target.value as "axe" | "shield")}
                className="h-11 w-full appearance-none rounded-lg bg-card/70 px-3 text-sm text-fg ring-1 ring-border shadow-crisp outline-none transition focus:ring-2 focus:ring-accent/35"
              >
                <option value="axe">Machado</option>
                <option value="shield">Escudo</option>
              </select>
            </label>
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
