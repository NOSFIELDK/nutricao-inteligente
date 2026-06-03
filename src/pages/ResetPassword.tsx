import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import * as SyncApi from "@/api/syncApi";

export default function ResetPasswordPage() {
  const nav = useNavigate();
  const location = useLocation();
  const token = React.useMemo(() => new URLSearchParams(location.search).get("token") ?? "", [location.search]);

  const [newPassword, setNewPassword] = React.useState("");
  const [status, setStatus] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const onSubmit = async () => {
    if (!token) return;
    setBusy(true);
    setStatus(null);
    try {
      await SyncApi.resetPassword({ token, newPassword });
      setStatus("Senha atualizada.");
      nav("/configuracoes");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Falha ao resetar senha.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div>
        <div className="font-display text-2xl tracking-tight text-fg">Redefinir senha</div>
        <div className="mt-1 text-sm text-muted">Escolha uma nova senha para sua conta.</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova senha</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {!token ? <div className="text-sm text-muted">Link inválido ou incompleto.</div> : null}
          <TextField
            label="Senha (mín. 8 caracteres)"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={onSubmit} disabled={!token || busy || newPassword.length < 8}>
              Salvar
            </Button>
            <Button variant="secondary" onClick={() => nav("/configuracoes")} disabled={busy}>
              Voltar
            </Button>
          </div>
          {status ? <div className="text-sm text-muted">{status}</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}

