import * as React from "react";
import { Send, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { LeifMascot } from "@/components/LeifMascot";
import { chatLeif, hasLeifAi, type LeifChatMessage } from "@/api/leifApi";
import { useAppStore } from "@/store/useAppStore";
import { buildTargets } from "@/domain/nutrition/targets";
import { todayISO } from "@/utils/date";

const GREETING: LeifChatMessage = {
  role: "assistant",
  content: "Saudações, guerreiro! Sou Leif. Pergunte sobre nutrição, suas metas ou o que comer hoje. ⚔️",
};

const SUGESTOES = ["O que comer no pré-treino?", "Como bater minha meta de proteína?", "Ideias de lanche saudável"];

function buildContext(): unknown {
  const s = useAppStore.getState();
  const profile = s.profile;
  if (!profile) return { semPerfil: true };
  const targets = buildTargets(profile, s.customTargets);
  const today = todayISO();
  const dayPlan = s.plan.filter((p) => p.dateISO === today);
  const consumed = dayPlan.filter((p) => s.consumedPlan[p.id]).length;
  return {
    perfil: {
      idade: profile.age,
      sexo: profile.sex,
      pesoKg: profile.weightKg,
      alturaCm: profile.heightCm,
      objetivo: profile.primaryGoal,
      intensidade: profile.goalIntent,
      atividade: profile.activityLevel,
      restricoes: profile.restrictions,
      condicoes: profile.conditions,
      preferencias: profile.dietaryPreferences,
    },
    metasDiarias: {
      calorias: targets.caloriesKcal,
      proteinaG: targets.proteinG,
      fibrasG: targets.fiberG,
      aguaMl: targets.waterMl,
    },
    hoje: { aguaMl: s.waterByDate[today] ?? 0, itensPlanejados: dayPlan.length, itensConsumidos: consumed },
  };
}

export function LeifChat() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<LeifChatMessage[]>([GREETING]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const abortRef = React.useRef<AbortController | null>(null);
  const mascotStyle = useAppStore((s) => s.mascotStyle);
  const mascotSize = useAppStore((s) => s.mascotSize);
  const btnSize = mascotSize === "sm" ? "h-12 w-12" : mascotSize === "lg" ? "h-16 w-16" : "h-14 w-14";
  const btnAvatar = mascotSize === "sm" ? "h-8 w-8" : mascotSize === "lg" ? "h-12 w-12" : "h-10 w-10";

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, open]);

  React.useEffect(() => () => abortRef.current?.abort(), []);

  if (!hasLeifAi()) return null;

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    setError(null);
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const reply = await chatLeif({
        messages: next.filter((m) => m.role === "user" || m.role === "assistant"),
        context: buildContext(),
        signal: ctrl.signal,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Falha ao falar com o Leif.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar chat do Leif" : "Abrir chat do Leif"}
        className={cn(
          "fixed right-4 z-50 flex items-center justify-center rounded-full bg-accent shadow-soft ring-2 ring-gold/40 transition-transform duration-200 hover:scale-105 active:scale-95",
          btnSize,
          "bottom-24 md:bottom-6",
        )}
      >
        {open ? (
          <X className="h-6 w-6 text-fg" />
        ) : (
          <div className={cn(btnAvatar, "overflow-hidden rounded-full")}>
            <LeifMascot variant="avatar" mood="motivate" style={mascotStyle} animated className="h-full w-full" />
          </div>
        )}
      </button>

      {/* Painel de chat */}
      {open && (
        <div
          className={cn(
            "fixed right-4 z-50 flex flex-col overflow-hidden rounded-2xl bg-card/95 ring-1 ring-border shadow-soft backdrop-blur-md animate-fade-up",
            "bottom-40 left-4 max-h-[70vh] md:bottom-24 md:left-auto md:w-[380px]",
          )}
        >
          {/* Cabeçalho */}
          <div className="flex items-center gap-3 border-b border-border/70 bg-card-2/40 px-4 py-3">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-gold/40">
              <LeifMascot variant="avatar" mood={loading ? "motivate" : "normal"} style={mascotStyle} animated className="h-full w-full" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-sm font-bold tracking-wide text-fg">Leif IA</div>
              <div className="text-[11px] text-muted">{loading ? "consultando as runas…" : "guia de nutrição"}</div>
            </div>
          </div>

          {/* Mensagens */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ring-1",
                    m.role === "user"
                      ? "rounded-br-sm bg-accent/20 text-fg ring-accent/30"
                      : "rounded-bl-sm bg-bone/40 text-fg/90 ring-gold/25",
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-bone/40 px-3 py-2 text-sm text-muted ring-1 ring-gold/25">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:240ms]" />
                  </span>
                </div>
              </div>
            )}

            {error && <div className="rounded-xl bg-rust/10 px-3 py-2 text-xs text-rust ring-1 ring-rust/30">{error}</div>}

            {messages.length <= 1 && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGESTOES.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="press rounded-full bg-card-2/60 px-3 py-1.5 text-xs font-medium text-fg ring-1 ring-border transition hover:bg-card-2"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border/70 bg-card-2/30 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte ao Leif…"
              className="h-10 flex-1 rounded-lg bg-card px-3 text-sm text-fg ring-1 ring-border outline-none transition focus:ring-accent/40"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Enviar"
              className="press flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-fg shadow-crisp transition hover:brightness-[1.02] disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
