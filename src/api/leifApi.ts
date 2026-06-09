import { STORAGE_KEYS } from "@/storage/keys";

export type LeifChatMessage = { role: "user" | "assistant"; content: string };

function getApiBase() {
  const saved = localStorage.getItem(STORAGE_KEYS.apiBase);
  if (saved) return saved.replace(/\/+$/g, "");
  const envBase = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";
  return envBase.replace(/\/+$/g, "");
}

function chatUrl() {
  const base = getApiBase();
  if (!base) return "";
  const normalized = base.replace(/\/+$/g, "");
  const root = normalized.toLowerCase().endsWith("/api") ? normalized.slice(0, -4) : normalized;
  return `${root}/api/leif/chat`;
}

export function hasLeifAi() {
  return Boolean(getApiBase());
}

/** Envia o histórico + contexto e retorna a resposta do Leif. */
export async function chatLeif(params: {
  messages: LeifChatMessage[];
  context?: unknown;
  signal?: AbortSignal;
}): Promise<string> {
  const url = chatUrl();
  if (!url) throw new Error("IA não configurada (defina o endereço da API em Ajustes).");

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages: params.messages, context: params.context }),
    signal: params.signal,
  });

  if (!res.ok) {
    let message = `Falha ao falar com o Leif (${res.status}).`;
    try {
      const data = (await res.json()) as { message?: string };
      if (data?.message) message = data.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const data = (await res.json()) as { reply?: string };
  return (data.reply ?? "").trim();
}
