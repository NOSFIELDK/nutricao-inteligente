import * as React from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { SelectField, TextField } from "@/components/ui/TextField";
import type { ActivityLevel, Condition, DietaryPreference, GoalIntent, PrimaryGoal, Restriction, UserProfile } from "@/domain/models";
import { buildTargets } from "@/domain/nutrition/targets";
import { useAppStore } from "@/store/useAppStore";
import { uid } from "@/utils/id";

const goals: { value: PrimaryGoal; label: string; desc: string }[] = [
  { value: "saude", label: "Saúde", desc: "Bem-estar, equilíbrio e rotina sustentável." },
  { value: "tratamento", label: "Tratamento", desc: "Sugestões adaptadas a condições específicas." },
  { value: "performance", label: "Performance", desc: "Foco em proteína, energia e recuperação." },
];

const goalIntents: { value: GoalIntent; label: string; desc: string }[] = [
  { value: "cutting", label: "Definição", desc: "Déficit calórico para reduzir gordura, preservando músculo." },
  { value: "manutencao", label: "Manutenção", desc: "Equilíbrio energético para manter o peso atual." },
  { value: "bulking", label: "Ganho de massa", desc: "Superávit calórico para construir músculo." },
];

const preferences: { value: DietaryPreference; label: string }[] = [
  { value: "onivoro", label: "Onívoro" },
  { value: "vegetariano", label: "Vegetariano" },
  { value: "vegano", label: "Vegano" },
  { value: "lowCarb", label: "Low carb" },
];

const restrictions: { value: Restriction; label: string }[] = [
  { value: "lactose", label: "Intolerância à lactose" },
  { value: "gluten", label: "Alergia/intolerância ao glúten" },
];

const conditions: { value: Condition; label: string }[] = [
  { value: "diabetes", label: "Diabetes" },
  { value: "hipertensao", label: "Hipertensão" },
];

const activityLevels: { value: ActivityLevel; label: string }[] = [
  { value: "baixo", label: "Baixo" },
  { value: "moderado", label: "Moderado" },
  { value: "alto", label: "Alto" },
];

function toggle<T>(arr: T[], value: T) {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

function PreviewStat({ label, value, unit, highlight }: { label: string; value: string; unit: string; highlight?: boolean }) {
  return (
    <div className={["rounded-xl p-3 ring-1", highlight ? "bg-accent/16 ring-accent/30" : "bg-card-2/60 ring-border"].join(" ")}>
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className="mt-1 text-fg">
        <span className="text-lg font-semibold tabular-nums">{value}</span>
        <span className="ml-1 text-xs text-muted">{unit}</span>
      </div>
    </div>
  );
}

function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);

  const [age, setAge] = React.useState(profile?.age ?? 28);
  const [sex, setSex] = React.useState<UserProfile["sex"]>(profile?.sex ?? "outro");
  const [weightKg, setWeightKg] = React.useState(profile?.weightKg ?? 72);
  const [heightCm, setHeightCm] = React.useState(profile?.heightCm ?? 172);
  const [goal, setGoal] = React.useState<PrimaryGoal>(profile?.primaryGoal ?? "saude");
  const [goalIntent, setGoalIntent] = React.useState<GoalIntent>(profile?.goalIntent ?? "manutencao");
  const [dietaryPreferences, setDietaryPreferences] = React.useState<DietaryPreference[]>(
    profile?.dietaryPreferences ?? (["onivoro"] as DietaryPreference[]),
  );
  const [restr, setRestr] = React.useState<Restriction[]>(profile?.restrictions ?? []);
  const [conds, setConds] = React.useState<Condition[]>(profile?.conditions ?? []);
  const [activity, setActivity] = React.useState<ActivityLevel>(profile?.activityLevel ?? "moderado");

  const normalizePrefs = (next: DietaryPreference[]): DietaryPreference[] => {
    if (next.includes("vegano")) return next.filter((p) => p !== "vegetariano" && p !== "onivoro");
    if (next.includes("vegetariano")) return next.filter((p) => p !== "vegano" && p !== "onivoro");
    if (next.includes("onivoro")) return next.filter((p) => p !== "vegano" && p !== "vegetariano");
    if (next.length === 0) return ["onivoro"];
    return next;
  };

  const draft: UserProfile = {
    id: profile?.id ?? uid("user"),
    age: clampNumber(age, 10, 99),
    sex,
    weightKg: clampNumber(weightKg, 25, 260),
    heightCm: clampNumber(heightCm, 120, 230),
    primaryGoal: goal,
    dietaryPreferences: normalizePrefs(dietaryPreferences),
    restrictions: restr,
    conditions: conds,
    activityLevel: activity,
    goalIntent,
  };

  const preview = buildTargets(draft);

  const onSave = () => {
    setProfile(draft);
    navigate("/painel");
  };

  return (
    <div className="grid gap-6">
      <div>
        <div className="font-display text-2xl tracking-tight text-fg">Forja do Guerreiro</div>
        <div className="mt-1 max-w-2xl text-sm text-muted">
          Defina sua força, medidas e missão. O clã Viking precisa conhecer seu guerreiro para guiá-lo.
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="animate-fade-up" style={{ animationDelay: "60ms" } as React.CSSProperties}>
          <CardHeader>
            <CardTitle>Status do Guerreiro</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label="Idade"
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
              />
              <SelectField label="Sexo" value={sex} onChange={(e) => setSex(e.target.value as UserProfile["sex"])}>
                <option value="f">Feminino</option>
                <option value="m">Masculino</option>
                <option value="outro">Outro</option>
              </SelectField>
              <TextField
                label="Peso (kg)"
                inputMode="decimal"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
              />
              <TextField
                label="Altura (cm)"
                inputMode="numeric"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
              />
            </div>
            <SelectField label="Classe do Guerreiro" value={activity} onChange={(e) => setActivity(e.target.value as ActivityLevel)}>
              {activityLevels.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </SelectField>
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: "120ms" } as React.CSSProperties}>
          <CardHeader>
            <CardTitle>Missão do Clã</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-2 sm:grid-cols-3">
              {goals.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGoal(g.value)}
                  className={[
                    "rounded-xl p-3 text-left ring-1 transition-all duration-200",
                    goal === g.value
                      ? "bg-accent/16 ring-accent/30 shadow-[0_0_0_1px_hsl(var(--accent)/0.18),inset_0_1px_0_hsl(var(--accent)/0.12)] scale-[1.02]"
                      : "bg-card-2/60 ring-border hover:bg-card-2 hover:scale-[1.01]",
                  ].join(" ")}
                >
                  <div className="font-medium text-fg">{g.label}</div>
                  <div className="mt-1 text-xs leading-snug text-muted">{g.desc}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: "180ms" } as React.CSSProperties}>
          <CardHeader>
            <CardTitle>Objetivo de Batalha</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-2 sm:grid-cols-3">
              {goalIntents.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGoalIntent(g.value)}
                  className={[
                    "rounded-xl p-3 text-left ring-1 transition-all duration-200",
                    goalIntent === g.value
                      ? "bg-accent/16 ring-accent/30 shadow-[0_0_0_1px_hsl(var(--accent)/0.18),inset_0_1px_0_hsl(var(--accent)/0.12)] scale-[1.02]"
                      : "bg-card-2/60 ring-border hover:bg-card-2 hover:scale-[1.01]",
                  ].join(" ")}
                >
                  <div className="font-medium text-fg">{g.label}</div>
                  <div className="mt-1 text-xs leading-snug text-muted">{g.desc}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-up bg-accent/[0.06] ring-accent/20" style={{ animationDelay: "240ms" } as React.CSSProperties}>
          <CardHeader>
            <CardTitle>Profecia das Metas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="text-xs text-muted">Calculado pela sua força e missão. Atualiza enquanto você ajusta.</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <PreviewStat label="Calorias" value={`${preview.caloriesKcal ?? 0}`} unit="kcal" highlight />
              <PreviewStat label="Proteína" value={`${preview.proteinG}`} unit="g" />
              <PreviewStat label="Carboidrato" value={`${preview.carbsG ?? 0}`} unit="g" />
              <PreviewStat label="Gordura" value={`${preview.fatG ?? 0}`} unit="g" />
              <PreviewStat label="Fibras" value={`${preview.fiberG}`} unit="g" />
              <PreviewStat label="Água" value={`${(preview.waterMl / 1000).toFixed(1)}`} unit="L" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 animate-fade-up" style={{ animationDelay: "300ms" } as React.CSSProperties}>
          <CardHeader>
            <CardTitle>Código de Honra Alimentar</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-2">
              <div className="text-xs font-medium text-fg/90">Preferências</div>
              <div className="flex flex-wrap gap-2">
                {preferences.map((p) => (
                  <Chip
                    key={p.value}
                    active={dietaryPreferences.includes(p.value)}
                    onClick={() => setDietaryPreferences((prev) => normalizePrefs(toggle(prev, p.value)))}
                    type="button"
                  >
                    {p.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <div className="text-xs font-medium text-fg/90">Restrições alimentares</div>
              <div className="flex flex-wrap gap-2">
                {restrictions.map((r) => (
                  <Chip
                    key={r.value}
                    active={restr.includes(r.value)}
                    onClick={() => setRestr((prev) => toggle(prev, r.value))}
                    type="button"
                  >
                    {r.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <div className="text-xs font-medium text-fg/90">Condições (opcional)</div>
              <div className="flex flex-wrap gap-2">
                {conditions.map((c) => (
                  <Chip key={c.value} active={conds.includes(c.value)} onClick={() => setConds((prev) => toggle(prev, c.value))} type="button">
                    {c.label}
                  </Chip>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button variant="secondary" onClick={() => navigate("/painel")} disabled={!profile}>
          Voltar
        </Button>
        <Button onClick={onSave}>Forjar e Partir para Batalha</Button>
      </div>
    </div>
  );
}
